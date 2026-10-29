import React from 'react';

// Pip layouts for dice values 1-6
const PIP_COORDS = {
  1: [{ row: 2, col: 2 }],
  2: [{ row: 1, col: 3 }, { row: 3, col: 1 }],
  3: [{ row: 1, col: 3 }, { row: 2, col: 2 }, { row: 3, col: 1 }],
  4: [{ row: 1, col: 1 }, { row: 1, col: 3 }, { row: 3, col: 1 }, { row: 3, col: 3 }],
  5: [{ row: 1, col: 1 }, { row: 1, col: 3 }, { row: 2, col: 2 }, { row: 3, col: 1 }, { row: 3, col: 3 }],
  6: [{ row: 1, col: 1 }, { row: 1, col: 3 }, { row: 2, col: 1 }, { row: 2, col: 3 }, { row: 3, col: 1 }, { row: 3, col: 3 }],
};

export default function Dice({ value, isRolling, isWinner, isLoser, isPending, size = "sm" }) {
  const pips = (value && PIP_COORDS[value]) ? PIP_COORDS[value] : [];

  const sizeClasses = {
    xs: "w-7 h-7 p-1 rounded-lg",
    sm: "w-8 h-8 p-1.5 rounded-lg",
    md: "w-11 h-11 p-2 rounded-xl",
    lg: "w-14 h-14 p-2.5 rounded-2xl"
  }[size] || "w-8 h-8 p-1.5 rounded-lg";

  const pipSize = {
    xs: "w-1.5 h-1.5",
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  }[size] || "w-1.5 h-1.5";

  if (isPending) {
    return (
      <div className={`${sizeClasses} flex items-center justify-center bg-slate-850/80 border border-slate-700/80 rounded-lg text-slate-500 font-bold text-xs shadow-inner select-none`}>
        🎲
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClasses} flex items-center justify-center transition-all duration-300 select-none shadow-md ${
        isRolling
          ? "animate-bounce scale-105 bg-gradient-to-br from-amber-100 to-amber-300 ring-2 ring-amber-400"
          : isWinner
          ? "bg-white ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)] scale-105"
          : isLoser
          ? "bg-slate-700/80 opacity-60 scale-95"
          : "bg-white text-gray-900"
      }`}
      style={{
        boxShadow: isWinner
          ? '0 0 12px rgba(52, 211, 153, 0.7), inset 0 1px 3px rgba(255,255,255,0.8)'
          : isRolling
          ? '0 0 12px rgba(245, 158, 11, 0.6)'
          : '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.9)'
      }}
    >
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center">
        {pips.map((pos, idx) => (
          <span
            key={idx}
            className={`${pipSize} rounded-full ${
              isLoser ? "bg-gray-400" : isRolling ? "bg-amber-900" : "bg-gray-950"
            }`}
            style={{
              gridRow: pos.row,
              gridColumn: pos.col
            }}
          />
        ))}
      </div>
    </div>
  );
}