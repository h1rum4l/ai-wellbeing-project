import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, VolumeX, Play, Pause, Music, ChevronDown, Sparkles } from 'lucide-react';
import { pandaSoundscapes, SOUNDSCAPE_TRACKS, SoundscapeTrack } from '../../utils/pandaSoundscapes';
import { triggerHaptic } from '../../utils/haptics';

interface PandaSoundscapesPlayerProps {
  compact?: boolean;
  className?: string;
}

export const PandaSoundscapesPlayer: React.FC<PandaSoundscapesPlayerProps> = ({
  compact = false,
  className = '',
}) => {
  const [state, setState] = useState(pandaSoundscapes.getState());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // The header uses backdrop-filter, which turns it into the containing block for
  // `position: fixed` children. The chooser is therefore rendered in a portal on
  // <body> and positioned from the trigger's on-screen rectangle.
  useEffect(() => {
    if (!dropdownOpen) return;
    const place = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 12;
      if (vw < 640) {
        // Mobile: full-width sheet pinned under the header
        setPopoverStyle({ left: margin, right: margin, top: 64, maxHeight: vh - 64 - margin });
      } else {
        const rect = anchorRef.current?.getBoundingClientRect();
        const width = 320;
        const left = rect
          ? Math.min(Math.max(margin, rect.right - width), vw - width - margin)
          : vw - width - margin;
        const top = rect ? rect.bottom + 8 : 64;
        setPopoverStyle({ left, top, width, maxHeight: vh - top - margin });
      }
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDropdownOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dropdownOpen]);

  useEffect(() => {
    const unsub = pandaSoundscapes.subscribe(() => {
      setState(pandaSoundscapes.getState());
    });
    return unsub;
  }, []);

  const handleToggle = () => {
    triggerHaptic('medium');
    pandaSoundscapes.togglePlay();
  };

  const handleSelectTrack = (trackId: string) => {
    triggerHaptic('selection');
    pandaSoundscapes.selectTrack(trackId);
    setDropdownOpen(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    pandaSoundscapes.setVolume(val);
  };

  if (compact) {
    return (
      <div ref={anchorRef} className={`relative inline-flex items-center ${className}`}>
        {/* Unified Pill Button */}
        <div className="inline-flex items-center rounded-full bg-white/85 hover:bg-white border border-white/90 shadow-2xs p-0.5 transition-all">
          {/* 1. Play / Pause Action Button */}
          <button
            type="button"
            onClick={handleToggle}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              state.isPlaying
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'hover:bg-emerald-50 text-emerald-800'
            }`}
            title={state.isPlaying ? `Playing: ${state.currentTrack.name} (Click to pause)` : 'Play Nature Soundscape'}
          >
            <span className="text-sm leading-none select-none">{state.currentTrack.emoji}</span>
            {state.isPlaying ? (
              <span className="flex items-center gap-0.5">
                <span className="w-0.5 sm:w-1 h-2.5 bg-white rounded-full animate-pulse" />
                <span className="w-0.5 sm:w-1 h-3.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="w-0.5 sm:w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              </span>
            ) : (
              <Play className="w-3 h-3 text-emerald-700" />
            )}
          </button>

          {/* 2. Choose Track Button (Opens Soundscape Chooser) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setDropdownOpen(!dropdownOpen);
            }}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-emerald-800 rounded-full cursor-pointer transition-colors"
            title="Choose Nature Soundscape"
          >
            <span className="hidden sm:inline truncate max-w-[90px]">
              {state.isPlaying ? state.currentTrack.name : 'Soundscapes'}
            </span>
            <span className="inline sm:hidden text-[10px] font-semibold text-slate-600">
              Tracks
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Responsive Soundscape Chooser Modal / Popover */}
        {dropdownOpen && createPortal(
          <>
            {/* Backdrop for tapping outside */}
            <div
              className="fixed inset-0 bg-slate-900/35 backdrop-blur-2xs z-[90]"
              onClick={() => setDropdownOpen(false)}
            />

            {/* Menu Popover (Fixed centered on mobile, right-aligned on desktop) */}
            <div
              // Inline position: .liquid-glass-card (unlayered CSS) sets position: relative and would beat Tailwind's `fixed`
              style={{ position: 'fixed', ...popoverStyle }}
              className="liquid-glass-card bg-white/95 backdrop-blur-2xl p-3.5 sm:p-4 rounded-3xl shadow-2xl border-2 border-emerald-300/80 z-[100] animate-fade-in text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-base select-none">🎋</span>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                      Choose Nature Soundscape
                    </span>
                    <span className="text-[10px] text-slate-500">Zero-latency generative Web Audio</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Close soundscape chooser"
                >
                  ✕
                </button>
              </div>

              {/* Track Selection List */}
              <div className="space-y-1 mb-3 max-h-[45vh] overflow-y-auto overscroll-contain">
                {SOUNDSCAPE_TRACKS.map((t) => {
                  const isCurrent = t.id === state.currentTrackId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTrack(t.id)}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-100/90 text-emerald-950 font-bold border border-emerald-300 shadow-2xs'
                          : 'hover:bg-white/90 text-slate-700'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5 select-none">{t.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate flex items-center justify-between">
                          <span>{t.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold">
                              {state.isPlaying ? 'Playing' : 'Selected'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{t.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volume & Playback Control Bar */}
              <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => pandaSoundscapes.setVolume(state.volume > 0 ? 0 : 0.5)}
                    className="text-slate-600 hover:text-emerald-700 shrink-0 cursor-pointer p-1"
                    title={state.volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {state.volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    aria-label="Soundscape Volume"
                  />
                  <span className="text-[10px] font-mono text-slate-500 w-8 text-right shrink-0">
                    {Math.round(state.volume * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggle}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
                    state.isPlaying
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  {state.isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  }

  // Full Card View for Corner / Breathing
  return (
    <div className={`liquid-glass-card p-4 sm:p-5 rounded-2xl border border-white shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xl shadow-xs shrink-0">
            {state.currentTrack.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">{state.currentTrack.name}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Panda Soundscape
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{state.currentTrack.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              state.isPlaying
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'liquid-button-sage text-white'
            }`}
          >
            {state.isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Soundscape</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Play Soundscape</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Track Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
        {SOUNDSCAPE_TRACKS.map((t) => {
          const isSelected = t.id === state.currentTrackId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTrack(t.id)}
              className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-xs'
                  : 'bg-white/70 border-slate-200/80 text-slate-700 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{t.emoji}</span>
                <span className="text-xs font-bold truncate">{t.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{t.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Volume slider */}
      <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center gap-3 text-xs">
        <Volume2 className="w-4 h-4 text-emerald-700 shrink-0" />
        <span className="text-[11px] font-semibold text-slate-600 shrink-0">Atmosphere Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={state.volume}
          onChange={handleVolumeChange}
          className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
        />
        <span className="text-[11px] font-bold text-slate-700 w-9 text-right shrink-0">
          {Math.round(state.volume * 100)}%
        </span>
      </div>
    </div>
  );
};
