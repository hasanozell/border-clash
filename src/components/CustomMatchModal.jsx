import React, { useState } from 'react';
import { X, Swords } from 'lucide-react';

export default function CustomMatchModal({
  isOpen,
  onClose,
  factions,
  borderGraph,
  onStartCustomMatch
}) {
  const [selectedAttacker, setSelectedAttacker] = useState('');
  const [selectedDefender, setSelectedDefender] = useState('');

  if (!isOpen) return null;

  const activeFactions = Object.values(factions).sort((a, b) => a.name.localeCompare(b.name));

  let validDefenderIds = [];
  if (selectedAttacker) {
    const attackerFaction = factions[selectedAttacker];
    if (attackerFaction) {
      const neighborSet = new Set();
      attackerFaction.territories.forEach(tid => {
        (borderGraph[tid] || []).forEach(nId => {
          const ownerId = Object.keys(factions).find(fId =>
            factions[fId].territories.includes(nId)
          );
          if (ownerId && ownerId !== selectedAttacker) {
            neighborSet.add(ownerId);
          }
        });
      });
      validDefenderIds = Array.from(neighborSet);
    }
  }

  const validDefenders = validDefenderIds.map(id => factions[id]).filter(Boolean);

  const handleStart = () => {
    if (selectedAttacker && selectedDefender) {
      onStartCustomMatch(selectedAttacker, selectedDefender);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm text-white shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-base">Custom Matchup</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Attacker Selection */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
            Attacking Country
          </label>
          <select
            value={selectedAttacker}
            onChange={(e) => {
              setSelectedAttacker(e.target.value);
              setSelectedDefender('');
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">Select Country...</option>
            {activeFactions.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code.toUpperCase()}) - Pop: {f.population.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Defender Selection */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-sky-400 mb-1.5">
            Defending Country (Border Neighbors)
          </label>
          <select
            value={selectedDefender}
            disabled={!selectedAttacker}
            onChange={(e) => setSelectedDefender(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400 disabled:opacity-50"
          >
            <option value="">
              {!selectedAttacker ? 'Select Attacker First' : 'Select Neighboring Country...'}
            </option>
            {validDefenders.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code.toUpperCase()}) - Pop: {f.population.toLocaleString()}
              </option>
            ))}
          </select>
          {selectedAttacker && validDefenders.length === 0 && (
            <p className="text-[11px] text-amber-500 mt-1">
              No border neighbors left for this country!
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleStart}
          disabled={!selectedAttacker || !selectedDefender}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 disabled:opacity-40 transition"
        >
          Start Clash ⚔️
        </button>
      </div>
    </div>
  );
}
