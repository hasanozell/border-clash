import React from 'react';
import { Trophy, Globe, Flame, Dices } from 'lucide-react';
import { formatArea } from '../utils/battleEngine';

export default function Leaderboard({ factions, episode = 1, remainingCount = 189, onSelectCountry }) {
  // Sort by Wins
  const topWins = Object.values(factions)
    .filter(f => f.wins > 0)
    .sort((a, b) => b.wins - a.wins || b.area - a.area)
    .slice(0, 5);

  const displayWins = [...topWins];
  if (displayWins.length < 5) {
    const remaining = Object.values(factions)
      .filter(f => !displayWins.some(d => d.id === f.id))
      .sort((a, b) => b.population - a.population)
      .slice(0, 5 - displayWins.length);
    displayWins.push(...remaining);
  }

  // Sort by Territory Area
  const topTerritory = Object.values(factions)
    .sort((a, b) => b.area - a.area)
    .slice(0, 5);

  const getFlagUrl = (iso2) => {
    if (!iso2) return 'https://flagcdn.com/w160/un.png';
    return `https://flagcdn.com/w160/${iso2.toLowerCase()}.png`;
  };

  return (
    <div className="w-full max-w-[440px] mx-auto px-2 py-2 font-sans text-white select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
            {remainingCount} Countries to Clash
          </h2>
        </div>
        <div className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Ep. #{String(episode).padStart(2, '0')}
        </div>
      </div>

      {/* Prominent Action Button inside Leaderboard */}
      {onSelectCountry && (
        <button
          onClick={onSelectCountry}
          className="w-full mb-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-98 transition transform"
        >
          <Dices className="w-5 h-5 fill-slate-950" />
          <span>🎲 Select Country & Start Clash</span>
        </button>
      )}

      {/* Leaderboard Columns */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Most Wins */}
        <div className="bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black text-amber-400 tracking-wider uppercase mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>MOST WINS</span>
          </div>

          <div className="space-y-1.5">
            {displayWins.map((f, idx) => (
              <div
                key={f.id}
                className="flex items-center justify-between text-xs font-bold py-0.5"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-500 font-mono text-[10px] w-3">
                    {idx + 1}
                  </span>
                  <div className="w-4 h-3 rounded overflow-hidden flex-shrink-0 border border-slate-700">
                    <img
                      src={getFlagUrl(f.code)}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="truncate text-slate-200 text-[10px] sm:text-[11px]">
                    {f.name}
                  </span>
                </div>
                <span className="text-amber-400 font-mono font-black ml-1 text-xs">
                  {f.wins || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Territory */}
        <div className="bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black text-sky-400 tracking-wider uppercase mb-2">
            <Trophy className="w-3.5 h-3.5 text-sky-400" />
            <span>MOST TERRITORY</span>
          </div>

          <div className="space-y-1.5">
            {topTerritory.map((f, idx) => (
              <div
                key={f.id}
                className="flex items-center justify-between text-xs font-bold py-0.5"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-500 font-mono text-[10px] w-3">
                    {idx + 1}
                  </span>
                  <div className="w-4 h-3 rounded overflow-hidden flex-shrink-0 border border-slate-700">
                    <img
                      src={getFlagUrl(f.code)}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="truncate text-slate-200 text-[10px] sm:text-[11px]">
                    {f.name}
                  </span>
                </div>
                <span className="text-sky-300 font-mono text-[10px] sm:text-[11px] font-black whitespace-nowrap ml-1">
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
