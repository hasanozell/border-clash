import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Globe, Swords, Trophy } from 'lucide-react';

import MapViewer from './components/MapViewer';
import BattleCard from './components/BattleCard';
import Leaderboard from './components/Leaderboard';
import Controls from './components/Controls';
import CustomMatchModal from './components/CustomMatchModal';

import countryMetadata from './data/countryMetadata.json';
import borderGraph from './data/borderGraph.json';
import { calculateMultiplier, executeDiceClash } from './utils/battleEngine';
import { sound } from './utils/sound';

export default function App() {
  const initializeState = useCallback(() => {
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

    return { factions: initFactions, conquestMap: initConquest };
  }, []);

  const [{ factions, conquestMap }, setGameState] = useState(initializeState);
  const [episode, setEpisode] = useState(1);

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
      const waitTime = Math.max(900, 1800 / speedRef.current);
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

  // STEP 3: SEQUENTIAL DICE ROLLS (Round 1 ➔ Round 2 ➔ Round 3 ➔ Multiplier ➔ Winner)
  const startSequentialDiceClash = (aId, dId) => {
    const aFaction = factions[aId];
    const dFaction = factions[dId];

    const battleResult = executeDiceClash(
      aFaction?.multiplier || 1.0,
      dFaction?.multiplier || 1.0
    );

    const spd = speedRef.current;
    const rollDuration = Math.max(300, 850 / spd);
    const roundPause = Math.max(250, 550 / spd);

    // Round 1
    setFlowStep('rolling_1');
    sound.playDiceRoll();

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    rollIntervalRef.current = setInterval(() => {
      setRollingDice(prev => ({
        ...prev,
        attacker: [Math.floor(Math.random() * 6) + 1, prev.attacker[1], prev.attacker[2]],
        defender: [Math.floor(Math.random() * 6) + 1, prev.defender[1], prev.defender[2]],
      }));
    }, 70);

    // Reveal Round 1
    timerRef.current = setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      const r1 = battleResult.rounds[0];
      setRevealedRounds([r1]);

      let aRaw = r1.winner === 'attacker' ? r1.points : 0;
      let dRaw = r1.winner === 'defender' ? r1.points : 0;
      setAttackerRawPoints(aRaw);
      setDefenderRawPoints(dRaw);
      sound.playPointDing(r1.winner === 'attacker');

      // Round 2
      timerRef.current = setTimeout(() => {
        setFlowStep('rolling_2');
        sound.playDiceRoll();

        rollIntervalRef.current = setInterval(() => {
          setRollingDice(prev => ({
            ...prev,
            attacker: [prev.attacker[0], Math.floor(Math.random() * 6) + 1, prev.attacker[2]],
            defender: [prev.defender[0], Math.floor(Math.random() * 6) + 1, prev.defender[2]],
          }));
        }, 70);

        // Reveal Round 2
        timerRef.current = setTimeout(() => {
          if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
          const r2 = battleResult.rounds[1];
          setRevealedRounds([r1, r2]);

          if (r2.winner === 'attacker') aRaw += r2.points;
          if (r2.winner === 'defender') dRaw += r2.points;
          setAttackerRawPoints(aRaw);
          setDefenderRawPoints(dRaw);
          sound.playPointDing(r2.winner === 'attacker');

          // Round 3
          timerRef.current = setTimeout(() => {
            setFlowStep('rolling_3');
            sound.playDiceRoll();

            rollIntervalRef.current = setInterval(() => {
              setRollingDice(prev => ({
                ...prev,
                attacker: [prev.attacker[0], prev.attacker[1], Math.floor(Math.random() * 6) + 1],
                defender: [prev.defender[0], prev.defender[1], Math.floor(Math.random() * 6) + 1],
              }));
            }, 70);

            // Reveal Round 3
            timerRef.current = setTimeout(() => {
              if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
              const r3 = battleResult.rounds[2];
              setRevealedRounds([r1, r2, r3]);

              if (r3.winner === 'attacker') aRaw += r3.points;
              if (r3.winner === 'defender') dRaw += r3.points;
              setAttackerRawPoints(aRaw);
              setDefenderRawPoints(dRaw);
              sound.playPointDing(r3.winner === 'attacker');

              // Decimal Multiplier Calculation Step
              timerRef.current = setTimeout(() => {
                setFlowStep('multiplier');
                setFinalAttackerPoints(battleResult.finalAttackerPoints);
                setFinalDefenderPoints(battleResult.finalDefenderPoints);
                sound.playPointDing(true);

                // Winner announcement
                timerRef.current = setTimeout(() => {
                  setFlowStep('winner');
                  setWinner(battleResult.winner);
                  sound.playVictory();
                  confetti({ particleCount: 90, spread: 75 });

                  // Execute Conquest & Return to World Map
                  timerRef.current = setTimeout(() => {
                    executeConquestAndReset(aId, dId, battleResult.winner);
                  }, Math.max(1200, 2200 / spd));

                }, Math.max(600, 1200 / spd));

              }, Math.max(500, 1000 / spd));

            }, rollDuration);

          }, roundPause);

        }, rollDuration);

      }, roundPause);

    }, rollDuration);
  };

  // STEP 4: CONQUEST & RETURN CAMERA TO WORLD VIEW
  const executeConquestAndReset = (aId, dId, battleWinner) => {
    const winnerId = battleWinner === 'attacker' ? aId : dId;
    const loserId = battleWinner === 'attacker' ? dId : aId;

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

      return {
        factions: prevFactions,
        conquestMap: prevConquest
      };
    });

    setEpisode(ep => ep + 1);

    setViewMode('world');
    setFlowStep('idle');
    setCandidateNeighbors([]);
    setHighlightedNeighborId(null);

    if (isPlayingRef.current) {
      const waitTime = Math.max(1200, 2600 / speedRef.current);
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
    setGameState(initializeState());
    setEpisode(1);
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
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-between p-2 sm:p-5 select-none font-sans">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80 mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black flex-shrink-0">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              BORDER CLASH <span className="text-amber-400 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">WARS</span>
            </h1>
          </div>
        </div>

        {/* Global Stats Badges */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold">
            <Globe className="w-3 h-3 text-sky-400" />
            <span>Left: <strong className="text-amber-400">{remainingCount}</strong></span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>Ep: <strong className="text-white">#{episode}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full transition-all duration-300 flex flex-col items-center justify-center mb-3 sm:mb-4 ${
        isVerticalMode ? 'max-w-[420px]' : 'max-w-5xl'
      }`}>
        {isVerticalMode ? (
          /* 9:16 Clean Reels Layout (Mobile Optimized) */
          <div className="w-full bg-[#080d1c] border border-slate-800 sm:border-2 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Top Half: Interactive Map */}
            <div className="relative w-full h-[240px] xs:h-[260px] sm:h-[280px] bg-[#060913]">
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

            {/* Bottom Half: Battle Card or Leaderboard */}
            <div className="p-2 sm:p-2.5 bg-[#080d1c]">
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
          /* Widescreen Layout */
          <div className="w-full grid grid-cols-1 lg:grid-cols-[1.3fr,1fr] gap-3.5 items-stretch">
            {/* Left: Map */}
            <div className="h-[460px] bg-[#080d1c] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
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
            <div className="flex flex-col justify-between gap-3">
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

              <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
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
      <footer className="sticky bottom-1 sm:bottom-2 z-40 w-full max-w-md lg:max-w-5xl shadow-2xl">
        <Controls
          flowStep={flowStep}
          onSelectCountry={() => handleSelectCountry()}
          onStartBattle={() => handleStartBattle()}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
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
