import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { ambientMusicService } from '../services/ambientMusic';

export const AmbientMusicToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(ambientMusicService.isPlaying());
  const [volume, setVolume] = useState<number>(ambientMusicService.getVolume());
  const [showVolumePopup, setShowVolumePopup] = useState<boolean>(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = ambientMusicService.addListener((playing, vol) => {
      setIsPlaying(playing);
      setVolume(vol);
    });
    return unsub;
  }, []);

  // Close volume popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowVolumePopup(false);
      }
    };
    if (showVolumePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumePopup]);

  const handleToggle = () => {
    ambientMusicService.toggle();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ambientMusicService.setVolume(val);
  };

  return (
    <div className="relative inline-flex items-center" ref={popupRef}>
      <button
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowVolumePopup(!showVolumePopup);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-sm cursor-pointer ${
          isPlaying
            ? 'bg-gradient-to-r from-cyan-950/90 via-sky-950/80 to-indigo-950/80 border-cyan-500/60 text-cyan-200 shadow-cyan-950/40 ring-1 ring-cyan-500/30'
            : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600 text-slate-400 hover:text-slate-200'
        }`}
        title={isPlaying ? 'Ambient Background Music: Playing (Click to mute, right-click for volume)' : 'Ambient Background Music: Muted (Click to play)'}
      >
        <div className="relative flex items-center justify-center">
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5 w-3.5">
              <motion.span
                animate={{ height: ['30%', '100%', '40%'] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                className="w-0.5 bg-cyan-400 rounded-full"
              />
              <motion.span
                animate={{ height: ['70%', '30%', '90%'] }}
                transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                className="w-0.5 bg-cyan-300 rounded-full"
              />
              <motion.span
                animate={{ height: ['40%', '80%', '20%'] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                className="w-0.5 bg-cyan-400 rounded-full"
              />
            </div>
          ) : (
            <Music className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>

        <span className="font-medium tracking-tight text-[11px]">
          {isPlaying ? 'Music: On' : 'Music: Off'}
        </span>

        {isPlaying && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowVolumePopup(!showVolumePopup);
            }}
            className="p-0.5 text-cyan-400/80 hover:text-cyan-200 rounded transition-colors"
            title="Adjust music volume"
          >
            <Volume2 className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Volume slider popover */}
      <AnimatePresence>
        {showVolumePopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            className="absolute right-0 top-full mt-2 z-50 w-48 p-3 rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl backdrop-blur-md text-slate-200"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Music className="w-3 h-3 text-cyan-400" />
                Ambient Volume
              </span>
              <span className="font-mono text-cyan-300">{Math.round(volume * 100)}%</span>
            </div>

            <input
              type="range"
              min="0.05"
              max="0.6"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />

            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
              <span>Soft</span>
              <span>Audible</span>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Auto-ducks when speaking</span>
              <button
                onClick={() => {
                  ambientMusicService.toggle();
                  setShowVolumePopup(false);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {isPlaying ? 'Mute' : 'Play'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
