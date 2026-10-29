import React from 'react';
import { Trophy, Globe, Flame, Dices } from 'lucide-react';
import { formatArea } from '../utils/battleEngine';

export default function Leaderboard({ factions, episode = 1, remainingCount = 189, onSelectCountry }) {
  // Sort by Wins
  const topWins = Object.values(factions)
    .filter(f => f.wins > 0)
    .sort((a, b) => b.wins - a.wins || b.area - a.area)
    .slice(0, 4);

  const displayWins = [...topWins];
  if (displayWins.length < 4) {
    const remaining = Object.values(factions)
      .filter(f => !displayWins.some(d => d.id === f.id))
      .sort((a, b) => b.population - a.population)
      .slice(0, 4 - displayWins.length);
    displayWins.push(...remaining);
  }

  // Sort by Territory Area
  const topTerritory = Object.values(factions)
    .sort((a, b) => b.area - a.area)
    .slice(0, 4);

  const getFlagUrl = (iso2) => {
    if (!iso2) return 'https://flagcdn.com/w160/un.png';
    return `https://flagcdn.com/w160/${iso2.toLowerCase()}.png`;
  };

  return (
    <div className="w-full max-w-[440px] mx-auto px-1 py-1 font-sans text-white select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <h2 className="text-xs sm:text-sm font-black tracking-tight text-white">
            {remainingCount} Empires Remaining
          </h2>
        </div>
        <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Ep. #{String(episode).padStart(2, '0')}
        </div>
      </div>

      {/* Leaderboard Columns */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Most Wins */}
        <div className="bg-slate-900/80 rounded-xl p-1.5 sm:p-2 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-400 tracking-wider uppercase mb-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>MOST WINS</span>
          </div>

          <div className="space-y-1">
            {displayWins.map((f, idx) => (
              <div
                key={f.id}
                className="flex items-center justify-between text-[10px] font-bold py-0.5"
              >
                <div className="flex items-center gap-1 truncate">
                  <span className="text-slate-500 font-mono text-[9px] w-2.5">
                    {idx + 1}
                  </span>
                  <div className="w-3.5 h-2.5 rounded overflow-hidden flex-shrink-0 border border-slate-700">
                    <img
                      src={getFlagUrl(f.code)}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="truncate text-slate-200 text-[10px]">
                    {f.name}
                  </span>
                </div>
                <span className="text-amber-400 font-mono font-black ml-1 text-[10px]">
                  {f.wins || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Territory */}
        <div className="bg-slate-900/80 rounded-xl p-1.5 sm:p-2 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-sky-400 tracking-wider uppercase mb-1">
            <Trophy className="w-3 h-3 text-sky-400" />
            <span>TERRITORY</span>
          </div>

          <div className="space-y-1">
            {topTerritory.map((f, idx) => (
              <div
                key={f.id}
                className="flex items-center justify-between text-[10px] font-bold py-0.5"
              >
                <div className="flex items-center gap-1 truncate">
                  <span className="text-slate-500 font-mono text-[9px] w-2.5">
                    {idx + 1}
                  </span>
                  <div className="w-3.5 h-2.5 rounded overflow-hidden flex-shrink-0 border border-slate-700">
                    <img
                      src={getFlagUrl(f.code)}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="truncate text-slate-200 text-[10px]">
                    {f.name}
                  </span>
                </div>
                <span className="text-sky-300 font-mono text-[9px] font-black whitespace-nowrap ml-1">
                  {formatArea(f.area)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}