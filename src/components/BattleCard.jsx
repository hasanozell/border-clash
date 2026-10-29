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
      <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-center text-slate-400 select-none flex flex-col items-center justify-center">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
          <Dices className="w-4 h-4 animate-pulse" />
        </div>
        <h3 className="text-xs sm:text-sm font-black text-white mb-0.5">
          Ready for Clash
        </h3>
        <p className="text-[11px] text-slate-400 mb-2">
          Pick a random attacking country to start:
        </p>
        {onSelectCountry && (
          <button
            onClick={onSelectCountry}
            className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <Dices className="w-3.5 h-3.5 fill-slate-950" />
            <span>🎲 Select Country</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 font-sans text-white select-none shadow-xl">
      {/* Attacker vs Defender Cards */}
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        {/* Attacker Card */}
        <div className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all duration-300 border ${
          isWinnerStep
            ? attackerWon
              ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-slate-950/40 border-slate-800 opacity-40 grayscale scale-95'
            : 'bg-slate-950/60 border-amber-500/40'
        }`}>
          <div className="text-[9px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1 text-amber-400">
            {isWinnerStep ? (
              attackerWon ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <Trophy className="w-2.5 h-2.5" /> WINNER
                </span>
              ) : (
                <span className="text-rose-400">LOSER</span>
              )
            ) : (
              <span>ATTACKER</span>
            )}
          </div>

          <div className="w-12 sm:w-16 h-8 sm:h-11 rounded-lg overflow-hidden border border-slate-700 shadow-md mb-1 bg-slate-900">
            <img
              src={getFlagUrl(attacker.code)}
              alt={attacker.name}
              className="w-full h-full object-cover"
            />
          </div>

          <h3 className="text-[11px] sm:text-xs font-black text-center truncate max-w-[95px] sm:max-w-[120px] drop-shadow">
            {attacker.name}
          </h3>
          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold mt-0.5">
            <span>{formatNumber(attacker.population)}</span>
            <span className="font-bold text-amber-400 px-1 rounded bg-amber-500/10 border border-amber-500/30">
              *{attacker.multiplier?.toFixed(1) || '1.0'}
            </span>
          </div>
        </div>

        {/* Center Swords / Status */}
        <div className="flex flex-col items-center justify-center px-1">
          <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
            flowStep.startsWith('rolling') || flowStep === 'cycling_neighbors'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce'
              : 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
          }`}>
            <Swords className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${flowStep.startsWith('rolling') ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
            {flowStep === 'cycling_neighbors' ? 'ROULETTE' : flowStep.startsWith('rolling') ? 'CLASH' : 'VS'}
          </span>
        </div>

        {/* Defender Card */}
        <div className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all duration-300 border ${
          !defender
            ? 'bg-slate-950/40 border-dashed border-slate-700'
            : isWinnerStep
            ? defenderWon
              ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-slate-950/40 border-slate-800 opacity-40 grayscale scale-95'
            : 'bg-slate-950/60 border-sky-500/40'
        }`}>
          <div className="text-[9px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1 text-sky-400">
            {defender ? (
              isWinnerStep ? (
                defenderWon ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <Trophy className="w-2.5 h-2.5" /> WINNER
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
              <div className="w-12 sm:w-16 h-8 sm:h-11 rounded-lg overflow-hidden border border-slate-700 shadow-md mb-1 bg-slate-900">
                <img
                  src={getFlagUrl(defender.code)}
                  alt={defender.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-[11px] sm:text-xs font-black text-center truncate max-w-[95px] sm:max-w-[120px] drop-shadow">
                {defender.name}
              </h3>
              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold mt-0.5">
                <span>{formatNumber(defender.population)}</span>
                <span className="font-bold text-sky-400 px-1 rounded bg-sky-500/10 border border-sky-500/30">
                  *{defender.multiplier?.toFixed(1) || '1.0'}
                </span>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-0.5 text-center">
              <div className="w-12 sm:w-16 h-8 sm:h-11 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600 mb-0.5">
                <HelpCircle className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-[9px] font-bold text-slate-500">
                Neighbor
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button inside Card if Country Selected */}
      {flowStep === 'country_selected' && onStartBattle && (
        <div className="my-1">
          <button
            onClick={onStartBattle}
            className="w-full py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-lg shadow-rose-500/20 active:scale-98 transition transform animate-pulse"
          >
            <Swords className="w-4 h-4" />
            <span>⚔️ Start Clash! (Neighbor Roulette)</span>
          </button>
        </div>
      )}

      {/* Sequential Dice Arena */}
      {defender && (
        <div className="bg-slate-950/80 rounded-xl p-1.5 sm:p-2 border border-slate-800 shadow-inner">
          {/* Header Score Bar */}
          <div className="flex items-center justify-between px-2 mb-1">
            <div className="text-left">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold">
                ATTACKER
              </span>
              <span className={`text-sm sm:text-base font-black ${attackerWon ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isMultiplierStep ? finalAttackerPoints : attackerRawPoints}
              </span>
            </div>

            <div className="text-center">
              <div className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 inline-block">
                {flowStep === 'cycling_neighbors' ? 'ROULETTE...' :
                 flowStep === 'rolling_1' ? 'ROUND 1' :
                 flowStep === 'rolling_2' ? 'ROUND 2' :
                 flowStep === 'rolling_3' ? 'ROUND 3' :
                 flowStep === 'multiplier' ? 'MULTIPLIER' :
                 isWinnerStep ? 'RESULT' : '3 ROUNDS'}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold">
                DEFENDER
              </span>
              <span className={`text-sm sm:text-base font-black ${defenderWon ? 'text-emerald-400' : 'text-sky-400'}`}>
                {isMultiplierStep ? finalDefenderPoints : defenderRawPoints}
              </span>
            </div>
          </div>

          {/* 3 Sequential Dice Rows */}
          <div className="space-y-1">
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
                  className={`flex items-center justify-between px-2 py-0.5 rounded-lg transition-all ${
                    isCurrentRolling
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : isRevealed
                      ? 'bg-slate-900/70 border border-slate-800'
                      : 'bg-slate-950/40 border border-slate-800/40 opacity-40'
                  }`}
                >
                  <span className="text-[9px] font-mono font-bold text-slate-500 w-11">
                    R{roundNum}
                  </span>

                  <Dice
                    value={aVal}
                    isRolling={isCurrentRolling}
                    isWinner={isRevealed && isRoundAttackerWin}
                    isLoser={isRevealed && isRoundDefenderWin}
                    isPending={!isCurrentRolling && !isRevealed}
                    size="xs"
                  />

                  <div className="min-w-[60px] text-center">
                    {isRevealed && roundData ? (
                      roundData.winner === 'attacker' ? (
                        <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                          <span>◀</span>
                          <span>+{roundData.points}</span>
                        </div>
                      ) : roundData.winner === 'defender' ? (
                        <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300 font-mono text-[10px] font-bold">
                          <span>+{roundData.points}</span>
                          <span>▶</span>
                        </div>
                      ) : (
                        <div className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-bold">
                          = 0
                        </div>
                      )
                    ) : isCurrentRolling ? (
                      <span className="text-amber-400 font-mono text-[10px] animate-pulse font-bold">
                        Rolling...
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono text-[10px]">-</span>
                    )}
                  </div>

                  <Dice
                    value={dVal}
                    isRolling={isCurrentRolling}
                    isWinner={isRevealed && isRoundDefenderWin}
                    isLoser={isRevealed && isRoundAttackerWin}
                    isPending={!isCurrentRolling && !isRevealed}
                    size="xs"
                  />

                  <span className="w-8 text-right text-[9px] font-mono font-bold">
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
            <div className="mt-1 p-1 rounded-lg bg-slate-900 border border-amber-500/30 text-center animate-fade-in">
              <div className="flex items-center justify-around text-[10px] sm:text-xs font-mono font-bold text-slate-200">
                <div>
                  {attackerRawPoints} <span className="text-amber-400">× {attacker.multiplier?.toFixed(1)}</span> = <strong className="text-emerald-400">{finalAttackerPoints}</strong>
                </div>
                <div className="text-slate-500">vs</div>
                <div>
                  {defenderRawPoints} <span className="text-sky-400">× {defender.multiplier?.toFixed(1)}</span> = <strong className="text-emerald-400">{finalDefenderPoints}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Winner Banner */}
          {isWinnerStep && (
            <div className={`mt-1 p-1.5 rounded-lg text-center text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 border shadow-sm ${
              attackerWon
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-sky-950/80 border-sky-500 text-sky-300'
            }`}>
              <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">
                {attackerWon
                  ? `🏆 ${attacker.name} conquered ${defender.name}!`
                  : `🏆 ${defender.name} defended against ${attacker.name}!`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}