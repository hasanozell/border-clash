import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Globe, Swords, Trophy, Bookmark, Check } from 'lucide-react';

import MapViewer from './components/MapViewer';
import BattleCard from './components/BattleCard';
import Leaderboard from './components/Leaderboard';
import Controls from './components/Controls';
import CustomMatchModal from './components/CustomMatchModal';

import countryMetadata from './data/countryMetadata.json';
import borderGraph from './data/borderGraph.json';
import { calculateMultiplier, executeDiceClash } from './utils/battleEngine';
import { sound } from './utils/sound';

const STORAGE_KEY = 'border_clash_save_v1';

export default function App() {
  // Load saved campaign or initialize fresh state
  const initializeState = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.factions && parsed.conquestMap && Object.keys(parsed.factions).length > 0) {
          return {
            factions: parsed.factions,
            conquestMap: parsed.conquestMap,
            episode: parsed.episode || 1,
            isResumed: true
          };
        }
      }
    } catch (err) {
      console.warn('Failed to load saved state, using default:', err);
    }

    const initFactions = {};
    const initConquest = {};

    Object.entries(countryMetadata).forEach(([id, meta]) => {
      const normId = String(id).padStart(3, '0');
      initConquest[normId] = normId;
      initFactions[normId] = {
        id: normId,
        name: meta.name,
        code: meta.code,
        territories: [normId],
        population: meta.pop || 1000000,
        area: meta.area || 10000,
        wins: 0,
        losses: 0,
        multiplier: calculateMultiplier(meta.pop || 1000000)
      };
    });

    return { factions: initFactions, conquestMap: initConquest, episode: 1, isResumed: false };
  }, []);

  const [initialData] = useState(initializeState);
  const [{ factions, conquestMap }, setGameState] = useState({
    factions: initialData.factions,
    conquestMap: initialData.conquestMap
  });
  const [episode, setEpisode] = useState(initialData.episode || 1);
  const [isResumedBanner, setIsResumedBanner] = useState(initialData.isResumed);
  const [isSavedJustNow, setIsSavedJustNow] = useState(false);

  // Flow State Machine:
  // 'idle' -> 'country_selected' -> 'cycling_neighbors' -> 'defender_chosen' -> 'rolling_1' -> 'rolling_2' -> 'rolling_3' -> 'multiplier' -> 'winner'
  const [flowStep, setFlowStep] = useState('idle');

  // Battle entities
  const [attackerId, setAttackerId] = useState(null);
  const [defenderId, setDefenderId] = useState(null);
  const [highlightedNeighborId, setHighlightedNeighborId] = useState(null);
  const [candidateNeighbors, setCandidateNeighbors] = useState([]);

  // Sequential Dice Battle State
  const [revealedRounds, setRevealedRounds] = useState([]);
  const [rollingDice, setRollingDice] = useState({ attacker: [1, 1, 1], defender: [1, 1, 1] });
  const [attackerRawPoints, setAttackerRawPoints] = useState(0);
  const [defenderRawPoints, setDefenderRawPoints] = useState(0);
  const [finalAttackerPoints, setFinalAttackerPoints] = useState(0);
  const [finalDefenderPoints, setFinalDefenderPoints] = useState(0);
  const [winner, setWinner] = useState(null);

  // View and playback
  const [viewMode, setViewMode] = useState('world'); // 'world' | 'zoom'
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isCustomMatchOpen, setIsCustomMatchOpen] = useState(false);
  const [isVerticalMode, setIsVerticalMode] = useState(true);

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const timerRef = useRef(null);
  const rollIntervalRef = useRef(null);

  const remainingCount = Object.keys(factions).length;

  // Save campaign helper
  const saveCampaign = useCallback((facs, map, ep) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          factions: facs,
          conquestMap: map,
          episode: ep,
          timestamp: Date.now()
        })
      );
      setIsSavedJustNow(true);
      setTimeout(() => setIsSavedJustNow(false), 2000);
    } catch (err) {
      console.error('Failed to save campaign:', err);
    }
  }, []);

  const handleManualSave = () => {
    saveCampaign(factions, conquestMap, episode);
  };

  const getForeignNeighbors = useCallback((aId, currentFactions, currentConquest) => {
    const aFaction = currentFactions[aId];
    if (!aFaction) return [];

    const foreignNeighbors = new Set();
    aFaction.territories.forEach(tid => {
      const neighbors = borderGraph[tid] || [];
      neighbors.forEach(nId => {
        const ownerId = currentConquest[nId];
        if (ownerId && ownerId !== aId && currentFactions[ownerId]) {
          foreignNeighbors.add(ownerId);
        }
      });
    });

    return Array.from(foreignNeighbors);
  }, []);

  // STEP 1: SELECT COUNTRY (Zooms directly into country)
  const handleSelectCountry = useCallback((forcedAttacker = null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

    const activeFactionIds = Object.keys(factions);
    if (activeFactionIds.length <= 1) {
      alert('The entire world has been conquered by a single empire!');
      return;
    }

    let aId = forcedAttacker;
    let neighbors = [];

    if (aId) {
      neighbors = getForeignNeighbors(aId, factions, conquestMap);
    } else {
      const shuffled = [...activeFactionIds].sort(() => Math.random() - 0.5);
      for (const candidateId of shuffled) {
        const validNeighbors = getForeignNeighbors(candidateId, factions, conquestMap);
        if (validNeighbors.length > 0) {
          aId = candidateId;
          neighbors = validNeighbors;
          break;
        }
      }
    }

    if (!aId || neighbors.length === 0) {
      alert('No valid foreign neighbors left for this country!');
      return;
    }

    setAttackerId(aId);
    setDefenderId(null);
    setHighlightedNeighborId(null);
    setCandidateNeighbors(neighbors);
    setViewMode('zoom');
    setFlowStep('country_selected');

    setRevealedRounds([]);
    setAttackerRawPoints(0);
    setDefenderRawPoints(0);
    setFinalAttackerPoints(0);
    setFinalDefenderPoints(0);
    setWinner(null);

    sound.playPointDing(true);

    if (isPlayingRef.current) {
      const waitTime = Math.max(800, 1600 / speedRef.current);
      timerRef.current = setTimeout(() => {
        handleStartBattle();
      }, waitTime);
    }
  }, [factions, conquestMap, getForeignNeighbors]);

  // STEP 2: START CLASH (Neighbor roulette cycling)
  const handleStartBattle = useCallback((forcedDefender = null) => {
    if (!attackerId) return;

    const neighbors = candidateNeighbors.length > 0
      ? candidateNeighbors
      : getForeignNeighbors(attackerId, factions, conquestMap);

    if (neighbors.length === 0) return;

    let targetDefenderId = forcedDefender;
    if (!targetDefenderId) {
      targetDefenderId = neighbors[Math.floor(Math.random() * neighbors.length)];
    }

    const spd = speedRef.current;

    // ROULETTE / CYCLING EFFECT THROUGH NEIGHBORS
    const delays = [60, 70, 80, 90, 110, 140, 180, 230, 300, 400].map(d => Math.max(30, d / spd));
    let stepIndex = 0;

    setFlowStep('cycling_neighbors');

    const runCyclingStep = () => {
      if (stepIndex < delays.length - 1) {
        const currentId = neighbors[stepIndex % neighbors.length];
        setDefenderId(currentId);
        setHighlightedNeighborId(currentId);
        sound.playTick();

        const delay = delays[stepIndex];
        stepIndex++;
        timerRef.current = setTimeout(runCyclingStep, delay);
      } else {
        // FINAL STOP: Lock in the chosen defender!
        setDefenderId(targetDefenderId);
        setHighlightedNeighborId(targetDefenderId);
        setFlowStep('defender_chosen');
        sound.playSwordClash();

        const startDelay = Math.max(400, 800 / spd);
        timerRef.current = setTimeout(() => {
          setHighlightedNeighborId(null);
          startSequentialDiceClash(attackerId, targetDefenderId);
        }, startDelay);
      }
    };

    runCyclingStep();

  }, [attackerId, candidateNeighbors, factions, conquestMap, getForeignNeighbors]);

  // STEP 3: SEQUENTIAL DICE ROLLS (Round 1 -> Round 2 -> Round 3 -> Multiplier -> Winner)
  const startSequentialDiceClash = (aId, dId) => {
    const aFaction = factions[aId];
    const dFaction = factions[dId];

    const battleResult = executeDiceClash(
      aFaction?.multiplier || 1.0,
      dFaction?.multiplier || 1.0
    );

    const spd = speedRef.current;
    const rollDuration = Math.max(300, 800 / spd);
    const roundPause = Math.max(250, 500 / spd);

    // Round 1
    setFlowStep('rolling_1');
    sound.playDiceRoll();

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    rollIntervalRef.current = setInterval(() => {
      setRollingDice(prev => ({
        ...prev,
        attacker: [Math.floor(Math.random() * 6) + 1, prev.attacker[1], prev.attacker[2]],
        defender: [Math.floor(Math.random() * 6) + 1, prev.defender[1], prev.defender[2]]
      }));
    }, 60);

    timerRef.current = setTimeout(() => {
      clearInterval(rollIntervalRef.current);
      const r1 = battleResult.rounds[0];
      setRollingDice(prev => ({
        ...prev,
        attacker: [r1.attackerDie, prev.attacker[1], prev.attacker[2]],
        defender: [r1.defenderDie, prev.defender[1], prev.defender[2]]
      }));
      setRevealedRounds([r1]);

      let curA = r1.winner === 'attacker' ? r1.points : 0;
      let curD = r1.winner === 'defender' ? r1.points : 0;
      setAttackerRawPoints(curA);
      setDefenderRawPoints(curD);
      sound.playPointDing(r1.winner === 'attacker');

      // Round 2
      timerRef.current = setTimeout(() => {
        setFlowStep('rolling_2');
        sound.playDiceRoll();

        rollIntervalRef.current = setInterval(() => {
          setRollingDice(prev => ({
            ...prev,
            attacker: [prev.attacker[0], Math.floor(Math.random() * 6) + 1, prev.attacker[2]],
            defender: [prev.defender[0], Math.floor(Math.random() * 6) + 1, prev.defender[2]]
          }));
        }, 60);

        timerRef.current = setTimeout(() => {
          clearInterval(rollIntervalRef.current);
          const r2 = battleResult.rounds[1];
          setRollingDice(prev => ({
            ...prev,
            attacker: [prev.attacker[0], r2.attackerDie, prev.attacker[2]],
            defender: [prev.defender[0], r2.defenderDie, prev.defender[2]]
          }));
          setRevealedRounds(prev => [...prev, r2]);

          if (r2.winner === 'attacker') curA += r2.points;
          if (r2.winner === 'defender') curD += r2.points;
          setAttackerRawPoints(curA);
          setDefenderRawPoints(curD);
          sound.playPointDing(r2.winner === 'attacker');

          // Round 3
          timerRef.current = setTimeout(() => {
            setFlowStep('rolling_3');
            sound.playDiceRoll();

            rollIntervalRef.current = setInterval(() => {
              setRollingDice(prev => ({
                ...prev,
                attacker: [prev.attacker[0], prev.attacker[1], Math.floor(Math.random() * 6) + 1],
                defender: [prev.defender[0], prev.defender[1], Math.floor(Math.random() * 6) + 1]
              }));
            }, 60);

            timerRef.current = setTimeout(() => {
              clearInterval(rollIntervalRef.current);
              const r3 = battleResult.rounds[2];
              setRollingDice(prev => ({
                ...prev,
                attacker: [prev.attacker[0], prev.attacker[1], r3.attackerDie],
                defender: [prev.defender[0], prev.defender[1], r3.defenderDie]
              }));
              setRevealedRounds(prev => [...prev, r3]);

              if (r3.winner === 'attacker') curA += r3.points;
              if (r3.winner === 'defender') curD += r3.points;
              setAttackerRawPoints(curA);
              setDefenderRawPoints(curD);
              sound.playPointDing(r3.winner === 'attacker');

              // Decimal Multiplier Reveal
              const multDelay = Math.max(300, 700 / spd);
              timerRef.current = setTimeout(() => {
                setFlowStep('multiplier');
                setFinalAttackerPoints(battleResult.finalAttackerPoints);
                setFinalDefenderPoints(battleResult.finalDefenderPoints);
                sound.playPointDing(true);

                // Winner Announcement
                const winDelay = Math.max(400, 900 / spd);
                timerRef.current = setTimeout(() => {
                  setFlowStep('winner');
                  setWinner(battleResult.winner);
                  sound.playVictory();

                  try {
                    confetti({
                      particleCount: 50,
                      spread: 60,
                      origin: { y: 0.7 }
                    });
                  } catch (e) {}

                  // Execute conquest & zoom out
                  const conquestDelay = Math.max(800, 1800 / spd);
                  timerRef.current = setTimeout(() => {
                    executeConquestAndReset(aId, dId, battleResult.winner);
                  }, conquestDelay);

                }, winDelay);

              }, multDelay);

            }, rollDuration);

          }, roundPause);

        }, rollDuration);

      }, roundPause);

    }, rollDuration);
  };

  // STEP 4: CONQUEST & RETURN CAMERA TO WORLD VIEW & AUTO-SAVE
  const executeConquestAndReset = (aId, dId, battleWinner) => {
    const winnerId = battleWinner === 'attacker' ? aId : dId;
    const loserId = battleWinner === 'attacker' ? dId : aId;

    let nextFactions;
    let nextConquest;
    let nextEpisode = episode + 1;

    setGameState(prev => {
      const prevFactions = { ...prev.factions };
      const prevConquest = { ...prev.conquestMap };

      const winnerFaction = prevFactions[winnerId];
      const loserFaction = prevFactions[loserId];

      if (!winnerFaction || !loserFaction) return prev;

      const combinedTerritories = [...winnerFaction.territories, ...loserFaction.territories];
      const combinedPop = winnerFaction.population + loserFaction.population;
      const combinedArea = winnerFaction.area + loserFaction.area;
      const newMultiplier = calculateMultiplier(combinedPop);

      loserFaction.territories.forEach(tId => {
        prevConquest[tId] = winnerId;
      });

      prevFactions[winnerId] = {
        ...winnerFaction,
        territories: combinedTerritories,
        population: combinedPop,
        area: combinedArea,
        wins: winnerFaction.wins + 1,
        multiplier: newMultiplier
      };

      delete prevFactions[loserId];

      nextFactions = prevFactions;
      nextConquest = prevConquest;

      return {
        factions: prevFactions,
        conquestMap: prevConquest
      };
    });

    setEpisode(nextEpisode);

    // Auto-save the campaign after every clash!
    if (nextFactions && nextConquest) {
      saveCampaign(nextFactions, nextConquest, nextEpisode);
    }

    setViewMode('world');
    setFlowStep('idle');
    setCandidateNeighbors([]);
    setHighlightedNeighborId(null);

    if (isPlayingRef.current) {
      const waitTime = Math.max(1000, 2200 / speedRef.current);
      timerRef.current = setTimeout(() => {
        handleSelectCountry();
      }, waitTime);
    }
  };

  const handleTogglePlay = () => {
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);
    isPlayingRef.current = nextPlay;

    if (nextPlay) {
      if (flowStep === 'idle') {
        handleSelectCountry();
      } else if (flowStep === 'country_selected') {
        handleStartBattle();
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    const initFactions = {};
    const initConquest = {};

    Object.entries(countryMetadata).forEach(([id, meta]) => {
      const normId = String(id).padStart(3, '0');
      initConquest[normId] = normId;
      initFactions[normId] = {
        id: normId,
        name: meta.name,
        code: meta.code,
        territories: [normId],
        population: meta.pop || 1000000,
        area: meta.area || 10000,
        wins: 0,
        losses: 0,
        multiplier: calculateMultiplier(meta.pop || 1000000)
      };
    });

    setGameState({ factions: initFactions, conquestMap: initConquest });
    setEpisode(1);
    setIsResumedBanner(false);
    setAttackerId(null);
    setDefenderId(null);
    setCandidateNeighbors([]);
    setHighlightedNeighborId(null);
    setFlowStep('idle');
    setViewMode('world');
    setRevealedRounds([]);
    setAttackerRawPoints(0);
    setDefenderRawPoints(0);
    setFinalAttackerPoints(0);
    setFinalDefenderPoints(0);
    setWinner(null);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleChangeSpeed = () => {
    const speeds = [1, 2, 4];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  };

  const handleStartCustomMatch = (aId, dId) => {
    handleSelectCountry(aId);
    setTimeout(() => {
      handleStartBattle(dId);
    }, 600);
  };

  const attackerFaction = attackerId ? factions[attackerId] : null;
  const defenderFaction = defenderId ? factions[defenderId] : null;

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#07090e] text-white flex flex-col justify-between p-1.5 sm:p-3 select-none font-sans overflow-hidden">
      {/* Top Header (Ultra sleek & compact) */}
      <header className="flex-shrink-0 w-full max-w-5xl mx-auto flex items-center justify-between gap-1 pb-1 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black flex-shrink-0 shadow-sm">
            <Swords className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1">
              BORDER CLASH <span className="text-amber-400 text-[8px] font-bold px-1 rounded bg-amber-500/10 border border-amber-500/30">WARS</span>
            </h1>
          </div>
        </div>

        {/* Global Stats Badges */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {isResumedBanner && (
            <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-[9px] font-bold text-emerald-300">
              <Check className="w-2.5 h-2.5" />
              <span>Resumed</span>
            </div>
          )}

          {isSavedJustNow && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 animate-pulse">
              <Bookmark className="w-2.5 h-2.5" />
              <span>Saved!</span>
            </div>
          )}

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold">
            <Globe className="w-2.5 h-2.5 text-sky-400" />
            <span>Left: <strong className="text-amber-400">{remainingCount}</strong></span>
          </div>

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold">
            <Trophy className="w-2.5 h-2.5 text-amber-400" />
            <span>Ep: <strong className="text-white">#{episode}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Content Area (Auto-fits 100% viewport, NO scrolling) */}
      <main className={`flex-1 min-h-0 w-full mx-auto my-1 flex flex-col items-center justify-between overflow-hidden ${
        isVerticalMode ? 'max-w-[440px]' : 'max-w-5xl'
      }`}>
        {isVerticalMode ? (
          /* Mobile / 9:16 Vertical Screen (Perfect Single-Screen Fit) */
          <div className="w-full h-full flex flex-col justify-between overflow-hidden bg-[#080d1c] border border-slate-800 rounded-xl sm:rounded-2xl shadow-xl p-1 sm:p-1.5">
            {/* Top: Auto-expanding Interactive Map */}
            <div className="flex-1 min-h-[140px] w-full relative rounded-lg sm:rounded-xl overflow-hidden bg-[#060913]">
              <MapViewer
                conquestMap={conquestMap}
                factions={factions}
                attackerId={attackerId}
                defenderId={defenderId}
                highlightedNeighborId={highlightedNeighborId}
                candidateNeighbors={candidateNeighbors}
                viewMode={viewMode}
                width={420}
                height={260}
              />
            </div>

            {/* Bottom: Compact Battle Card or Leaderboard */}
            <div className="flex-shrink-0 w-full mt-1">
              {flowStep === 'idle' && viewMode === 'world' ? (
                <Leaderboard
                  factions={factions}
                  episode={episode}
                  remainingCount={remainingCount}
                  onSelectCountry={() => handleSelectCountry()}
                />
              ) : (
                <BattleCard
                  attacker={attackerFaction}
                  defender={defenderFaction}
                  flowStep={flowStep}
                  activeDiceRound={revealedRounds.length}
                  revealedRounds={revealedRounds}
                  rollingDice={rollingDice}
                  attackerRawPoints={attackerRawPoints}
                  defenderRawPoints={defenderRawPoints}
                  finalAttackerPoints={finalAttackerPoints}
                  finalDefenderPoints={finalDefenderPoints}
                  winner={winner}
                  onStartBattle={() => handleStartBattle()}
                  onSelectCountry={() => handleSelectCountry()}
                />
              )}
            </div>
          </div>
        ) : (
          /* Desktop / Tablet Widescreen Layout */
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[1.3fr,1fr] gap-2.5 items-stretch overflow-hidden">
            {/* Left: Map */}
            <div className="h-full bg-[#080d1c] rounded-2xl overflow-hidden shadow-xl border border-slate-800">
              <MapViewer
                conquestMap={conquestMap}
                factions={factions}
                attackerId={attackerId}
                defenderId={defenderId}
                highlightedNeighborId={highlightedNeighborId}
                candidateNeighbors={candidateNeighbors}
                viewMode={viewMode}
                width={600}
                height={460}
              />
            </div>

            {/* Right: Battle Arena & Stats */}
            <div className="flex flex-col justify-between gap-2 overflow-y-auto pr-1">
              <BattleCard
                attacker={attackerFaction}
                defender={defenderFaction}
                flowStep={flowStep}
                activeDiceRound={revealedRounds.length}
                revealedRounds={revealedRounds}
                rollingDice={rollingDice}
                attackerRawPoints={attackerRawPoints}
                defenderRawPoints={defenderRawPoints}
                finalAttackerPoints={finalAttackerPoints}
                finalDefenderPoints={finalDefenderPoints}
                winner={winner}
                onStartBattle={() => handleStartBattle()}
                onSelectCountry={() => handleSelectCountry()}
              />

              <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                <Leaderboard
                  factions={factions}
                  episode={episode}
                  remainingCount={remainingCount}
                  onSelectCountry={() => handleSelectCountry()}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Control Bar (Mobile-First Safe Area) */}
      <footer className="flex-shrink-0 w-full max-w-[440px] lg:max-w-5xl mx-auto">
        <Controls
          flowStep={flowStep}
          onSelectCountry={() => handleSelectCountry()}
          onStartBattle={() => handleStartBattle()}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
          onSave={handleManualSave}
          isSavedJustNow={isSavedJustNow}
          speed={speed}
          onChangeSpeed={handleChangeSpeed}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(v => v === 'zoom' ? 'world' : 'zoom')}
          onOpenCustomMatch={() => setIsCustomMatchOpen(true)}
          isVerticalMode={isVerticalMode}
          onToggleVerticalMode={() => setIsVerticalMode(v => !v)}
        />
      </footer>

      {/* Custom Match Modal */}
      <CustomMatchModal
        isOpen={isCustomMatchOpen}
        onClose={() => setIsCustomMatchOpen(false)}
        factions={factions}
        borderGraph={borderGraph}
        onStartCustomMatch={handleStartCustomMatch}
      />
    </div>
  );
}