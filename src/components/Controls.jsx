import React from 'react';
import { Play, Pause, Swords, RotateCcw, Volume2, VolumeX, Maximize2, Sliders, Smartphone, Monitor, Dices } from 'lucide-react';

export default function Controls({
  flowStep, // 'idle' | 'country_selected' | 'cycling_neighbors' | 'defender_chosen' | 'rolling_1' | 'rolling_2' | 'rolling_3' | 'multiplier' | 'winner'
  onSelectCountry,
  onStartBattle,
  isPlaying,
  onTogglePlay,
  onReset,
  speed,
  onChangeSpeed,
  isMuted,
  onToggleMute,
  viewMode,
  onToggleViewMode,
  onOpenCustomMatch,
  isVerticalMode,
  onToggleVerticalMode
}) {
  const isBusy =
    flowStep.startsWith('rolling') || flowStep === 'cycling_neighbors' || flowStep === 'multiplier' || flowStep === 'winner';

  return (
    <div
      className="w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
    >
      {/* Row 1: Primary Action & Auto Play */}
      <div className="flex items-center gap-2 w-full">
        {flowStep === 'country_selected' ? (
          /* Step 2: START CLASH */
          <button
            onClick={onStartBattle}
            disabled={isBusy}
            className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-lg shadow-rose-500/30 active:scale-98 transition-all"
          >
            <Swords className="w-4 h-4 animate-bounce" />
            <span>Start Clash ⚔️</span>
          </button>
        ) : (
          /* Step 1: SELECT COUNTRY */
          <button
            onClick={onSelectCountry}
            disabled={isBusy}
            className={`flex-1 py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg ${
              isBusy
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-500/30'
            }`}
          >
            <Dices className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
            <span>{isBusy ? 'Clash in Progress...' : '🎲 Select Country'}</span>
          </button>
        )}

        {/* Auto Play / Loop Button */}
        <button
          onClick={onTogglePlay}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md flex-shrink-0 ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
              : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/30'
          }`}
          title="Auto-play simulation loop"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span className="hidden xs:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              <span className="hidden xs:inline">Auto</span>
            </>
          )}
        </button>

        {/* Speed Selector */}
        <button
          onClick={onChangeSpeed}
          className="px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black font-mono transition active:scale-95 border border-slate-700 flex-shrink-0"
          title="Animation Speed"
        >
          {speed}x
        </button>
      </div>

      {/* Row 2: Secondary Tool Strip */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full pt-1 border-t border-slate-800/60">
        {/* Custom Match Picker */}
        <button
          onClick={onOpenCustomMatch}
          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95 border border-slate-700/80 truncate"
          title="Custom Country & Neighbor Matchup"
        >
          <Sliders className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">Custom</span>
        </button>

        {/* View Mode (Zoom vs World) */}
        <button
          onClick={onToggleViewMode}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 active:scale-95 border border-slate-700/80 truncate ${
            viewMode === 'world'
              ? 'bg-sky-500 text-slate-950 font-black'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Toggle World / Focus View"
        >
          <Maximize2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{viewMode === 'world' ? 'World' : 'Focus'}</span>
        </button>

        {/* 9:16 Vertical vs Widescreen (Desktop/Tablet) */}
        <button
          onClick={onToggleVerticalMode}
          className={`hidden sm:flex flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition items-center justify-center gap-1 active:scale-95 border border-slate-700/80 truncate ${
            isVerticalMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="9:16 Reels Frame / Widescreen"
        >
          {isVerticalMode ? <Smartphone className="w-3 h-3 text-amber-400 flex-shrink-0" /> : <Monitor className="w-3 h-3 text-sky-400 flex-shrink-0" />}
          <span className="truncate">{isVerticalMode ? '9:16' : 'Wide'}</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-95 border border-slate-700/80 flex-shrink-0"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-rose-400 flex items-center justify-center transition active:scale-95 border border-slate-700/80 flex-shrink-0"
          title="Reset Simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
