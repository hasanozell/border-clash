import React from 'react';
import Dice from './Dice';
import { Swords, Trophy, Sparkles, HelpCircle, Dices } from 'lucide-react';
import { formatNumber } from '../utils/battleEngine';

export default function BattleCard({
  attacker,
  defender,
  flowStep, // 'idle' | 'country_selected' | 'cycling_neighbors' | 'defender_chosen' | 'rolling_1' | 'rolling_2' | 'rolling_3' | 'multiplier' | 'winner'
  activeDiceRound,
  revealedRounds,
  rollingDice,
  attackerRawPoints,
  defenderRawPoints,
  finalAttackerPoints,
  finalDefenderPoints,
  winner,
  onStartBattle,
  onSelectCountry
}) {
  const getFlagUrl = (iso2) => {
    if (!iso2) return 'https://flagcdn.com/w160/un.png';
    return `https://flagcdn.com/w160/${iso2.toLowerCase()}.png`;
  };

  const isWinnerStep = flowStep === 'winner';
  const isMultiplierStep = flowStep === 'multiplier' || isWinnerStep;

  const attackerWon = isWinnerStep && winner === 'attacker';
  const defenderWon = isWinnerStep && winner === 'defender';

  // If no attacker selected yet
  if (!attacker) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center text-slate-400 select-none flex flex-col items-center justify-center min-h-[180px]">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
          <Dices className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-black text-white mb-1">
          Ready for Clash
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-3">
          Click the button below to pick a random attacking country and zoom in on the map:
        </p>
        {onSelectCountry && (
          <button
            onClick={onSelectCountry}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30 active:scale-95 transition"
          >
            <Dices className="w-4 h-4 fill-slate-950" />
            <span>🎲 Select Country</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 sm:p-4 font-sans text-white select-none shadow-2xl">
      {/* Attacker vs Defender Cards */}
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 sm:gap-3 mb-3">
        {/* Attacker Card */}
        <div className={`flex flex-col items-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 border ${
          isWinnerStep
            ? attackerWon
              ? 'bg-emerald-950/50 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-102'
              : 'bg-slate-950/40 border-slate-800 opacity-40 grayscale scale-95'
            : 'bg-slate-950/60 border-amber-500/40'
        }`}>
          <div className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 text-amber-400">
            {isWinnerStep ? (
              attackerWon ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> WINNER
                </span>
              ) : (
                <span className="text-rose-400">LOSER</span>
              )
            ) : (
              <span>ATTACKER</span>
            )}
          </div>

          <div className="w-16 sm:w-20 h-11 sm:h-14 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl mb-1.5 bg-slate-900">
            <img
              src={getFlagUrl(attacker.code)}
              alt={attacker.name}
              className="w-full h-full object-cover"
            />
          </div>

          <h3 className="text-xs sm:text-sm font-black text-center truncate max-w-[120px] drop-shadow">
            {attacker.name}
          </h3>
          <div className="text-[10px] text-slate-400 font-semibold">
            Pop. {formatNumber(attacker.population)}
          </div>
          <div className="text-[10px] font-black text-amber-400 mt-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            *{attacker.multiplier?.toFixed(1) || '1.0'}
          </div>
        </div>

        {/* Center Swords / Status */}
        <div className="flex flex-col items-center justify-center">
          <div className={`w-9 sm:w-11 h-9 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
            flowStep.startsWith('rolling') || flowStep === 'cycling_neighbors'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-bounce'
              : 'bg-slate-800 text-amber-400 border border-slate-700 shadow-lg'
          }`}>
            <Swords className={`w-4 sm:w-5 h-4 sm:h-5 ${flowStep.startsWith('rolling') ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {flowStep === 'cycling_neighbors' ? 'ROULETTE' : flowStep.startsWith('rolling') ? 'CLASH' : 'VS'}
          </span>
        </div>

        {/* Defender Card */}
        <div className={`flex flex-col items-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 border ${
          !defender
            ? 'bg-slate-950/40 border-dashed border-slate-700'
            : isWinnerStep
            ? defenderWon
              ? 'bg-emerald-950/50 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-102'
              : 'bg-slate-950/40 border-slate-800 opacity-40 grayscale scale-95'
            : 'bg-slate-950/60 border-sky-500/40'
        }`}>
          <div className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 text-sky-400">
            {defender ? (
              isWinnerStep ? (
                defenderWon ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> WINNER
                  </span>
                ) : (
                  <span className="text-rose-400">LOSER</span>
                )
              ) : (
                <span>DEFENDER</span>
              )
            ) : (
              <span className="text-slate-500">DEFENDER</span>
            )}
          </div>

          {defender ? (
            <>
              <div className="w-16 sm:w-20 h-11 sm:h-14 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl mb-1.5 bg-slate-900">
                <img
                  src={getFlagUrl(defender.code)}
                  alt={defender.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-xs sm:text-sm font-black text-center truncate max-w-[120px] drop-shadow">
                {defender.name}
              </h3>
              <div className="text-[10px] text-slate-400 font-semibold">
                Pop. {formatNumber(defender.population)}
              </div>
              <div className="text-[10px] font-black text-sky-400 mt-0.5 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30">
                *{defender.multiplier?.toFixed(1) || '1.0'}
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-1 text-center">
              <div className="w-16 sm:w-20 h-11 sm:h-14 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600 mb-1">
                <HelpCircle className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Awaiting Neighbor
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button inside Card if Country Selected */}
      {flowStep === 'country_selected' && onStartBattle && (
        <div className="my-2.5">
          <button
            onClick={onStartBattle}
            className="w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-xl shadow-rose-500/30 active:scale-98 transition transform animate-pulse"
          >
            <Swords className="w-5 h-5" />
            <span>⚔️ Start Clash! (Neighbor Roulette)</span>
          </button>
        </div>
      )}

      {/* Sequential Dice Arena */}
      {defender && (
        <div className="bg-slate-950/90 rounded-2xl p-2.5 sm:p-3 border border-slate-800 shadow-inner">
          {/* Header Score Bar */}
          <div className="flex items-center justify-between px-3 mb-2">
            <div className="text-center">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">
                ATTACKER
              </span>
              <span className={`text-xl sm:text-2xl font-black ${attackerWon ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isMultiplierStep ? finalAttackerPoints : attackerRawPoints}
              </span>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 inline-block">
                {flowStep === 'cycling_neighbors' ? 'ROULETTE...' :
                 flowStep === 'rolling_1' ? 'ROUND 1' :
                 flowStep === 'rolling_2' ? 'ROUND 2' :
                 flowStep === 'rolling_3' ? 'ROUND 3' :
                 flowStep === 'multiplier' ? 'POPULATION MULTIPLIER' :
                 isWinnerStep ? 'RESULT' : '3 ROUNDS BATTLE'}
              </div>
            </div>

            <div className="text-center">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">
                DEFENDER
              </span>
              <span className={`text-xl sm:text-2xl font-black ${defenderWon ? 'text-emerald-400' : 'text-sky-400'}`}>
                {isMultiplierStep ? finalDefenderPoints : defenderRawPoints}
              </span>
            </div>
          </div>

          {/* 3 Sequential Dice Rows */}
          <div className="space-y-1.5">
            {[0, 1, 2].map((idx) => {
              const roundNum = idx + 1;
              const isCurrentRolling = flowStep === `rolling_${roundNum}`;
              const isRevealed = revealedRounds[idx] !== undefined;
              const roundData = revealedRounds[idx];

              const aVal = isCurrentRolling ? rollingDice.attacker[idx] : roundData?.attackerDie;
              const dVal = isCurrentRolling ? rollingDice.defender[idx] : roundData?.defenderDie;

              const isRoundAttackerWin = roundData?.winner === 'attacker';
              const isRoundDefenderWin = roundData?.winner === 'defender';

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-1 rounded-xl transition-all ${
                    isCurrentRolling
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : isRevealed
                      ? 'bg-slate-900/70 border border-slate-800'
                      : 'bg-slate-950/40 border border-slate-800/40 opacity-40'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500 w-12">
                    Round {roundNum}
                  </span>

                  <Dice
                    value={aVal}
                    isRolling={isCurrentRolling}
                    isWinner={isRevealed && isRoundAttackerWin}
                    isLoser={isRevealed && isRoundDefenderWin}
                    isPending={!isCurrentRolling && !isRevealed}
                    size="sm"
                  />

                  <div className="min-w-[70px] text-center">
                    {isRevealed && roundData ? (
                      roundData.winner === 'attacker' ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                          <span>◀</span>
                          <span>+{roundData.points}</span>
                        </div>
                      ) : roundData.winner === 'defender' ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/40 text-sky-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                          <span>+{roundData.points}</span>
                          <span>▶</span>
                        </div>
                      ) : (
                        <div className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono text-xs font-bold">
                          = 0
                        </div>
                      )
                    ) : isCurrentRolling ? (
                      <span className="text-amber-400 font-mono text-xs animate-pulse font-bold">
                        Rolling...
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono text-xs">-</span>
                    )}
                  </div>

                  <Dice
                    value={dVal}
                    isRolling={isCurrentRolling}
                    isWinner={isRevealed && isRoundDefenderWin}
                    isLoser={isRevealed && isRoundAttackerWin}
                    isPending={!isCurrentRolling && !isRevealed}
                    size="sm"
                  />

                  <span className="w-12 text-right text-[10px] font-mono font-bold">
                    {isRevealed ? (
                      isRoundAttackerWin ? (
                        <span className="text-emerald-400">+{roundData.points}</span>
                      ) : isRoundDefenderWin ? (
                        <span className="text-sky-400">+{roundData.points}</span>
                      ) : '0'
                    ) : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Decimal Multiplier Step Explanation */}
          {isMultiplierStep && (
            <div className="mt-2.5 p-2 rounded-xl bg-slate-900 border border-amber-500/30 text-center animate-fade-in">
              <div className="text-[9px] uppercase font-black tracking-widest text-amber-400 mb-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> POPULATION MULTIPLIER APPLIED
              </div>
              <div className="flex items-center justify-around text-xs font-mono font-bold text-slate-200">
                <div>
                  {attackerRawPoints} <span className="text-amber-400">× {attacker.multiplier?.toFixed(1)}</span> = <strong className="text-emerald-400 text-sm">{finalAttackerPoints}</strong>
                </div>
                <div className="text-slate-500">vs</div>
                <div>
                  {defenderRawPoints} <span className="text-sky-400">× {defender.multiplier?.toFixed(1)}</span> = <strong className="text-emerald-400 text-sm">{finalDefenderPoints}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Winner Banner */}
          {isWinnerStep && (
            <div className={`mt-2.5 p-2.5 rounded-xl text-center text-xs font-black flex items-center justify-center gap-2 border shadow-lg ${
              attackerWon
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-emerald-500/20'
                : 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-sky-500/20'
            }`}>
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>
                {attackerWon
                  ? `🏆 WINNER: ${attacker.name}! Conquered ${defender.name}!`
                  : `🏆 WINNER: ${defender.name}! Defended against ${attacker.name}!`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
