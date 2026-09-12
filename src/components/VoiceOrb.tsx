import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Search, Sparkles } from 'lucide-react';
import { VoiceState } from '../types';

interface VoiceOrbProps {
  state: VoiceState;
  volume: number; // 0 to 100
  statusMessage?: string;
  interimTranscript?: string;
  onToggleListening: () => void;
  onInterrupt: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  volume,
  statusMessage,
  interimTranscript,
  onToggleListening,
  onInterrupt,
}) => {
  const isListening = state === 'listening';
  const isSearching = state === 'mcp_searching' || state === 'processing';
  const isSpeaking = state === 'speaking';

  // Dynamic scale calculated from audio volume
  const volumeScale = 1 + (volume / 100) * 0.35;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Orb container */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
        {/* Outer orbital rings for MCP search state */}
        <AnimatePresence>
          {isSearching && (
            <>
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 0.8, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-cyan-400/60 pointer-events-none"
              />
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 0.6, rotate: -360 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                className="absolute -inset-4 rounded-full border border-cyan-500/30 pointer-events-none"
              />
            </>
          )}
        </AnimatePresence>

        {/* Ambient background glow */}
        <motion.div
          animate={{
            scale: isListening ? [volumeScale, volumeScale * 1.1, volumeScale] : isSearching ? [1, 1.2, 1] : [1, 1.05, 1],
            opacity: isListening ? 0.7 : isSearching ? 0.85 : isSpeaking ? 0.75 : 0.4,
          }}
          transition={{ repeat: Infinity, duration: isSearching ? 1.5 : 3, ease: 'easeInOut' }}
          className={`absolute rounded-full blur-3xl pointer-events-none w-56 h-56 transition-colors duration-500 ${
            isSearching
              ? 'bg-gradient-to-tr from-cyan-600/40 via-sky-500/40 to-blue-600/40'
              : isListening
              ? 'bg-gradient-to-tr from-emerald-500/40 via-teal-500/40 to-cyan-500/40'
              : isSpeaking
              ? 'bg-gradient-to-tr from-blue-600/40 via-indigo-500/40 to-cyan-400/40'
              : 'bg-gradient-to-tr from-slate-400/20 via-sky-500/20 to-blue-500/20'
          }`}
        />

        {/* Ripple rings while listening or speaking */}
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
            className="absolute inset-2 rounded-full border border-teal-400/40 pointer-events-none"
          />
        )}
        {isSpeaking && (
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
            className="absolute inset-2 rounded-full border border-blue-400/40 pointer-events-none"
          />
        )}

        {/* Primary Tactile Orb Button */}
        <motion.button
          id="voice-agent-orb-button"
          onClick={isSpeaking ? onInterrupt : onToggleListening}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          animate={{
            scale: isListening ? volumeScale : 1,
          }}
          className={`relative z-10 w-40 h-40 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center cursor-pointer shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 ${
            isSearching
              ? 'bg-gradient-to-br from-cyan-700 via-sky-800 to-blue-950 text-white shadow-cyan-500/25 ring-cyan-400/30'
              : isListening
              ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-emerald-500/25 ring-teal-400/30'
              : isSpeaking
              ? 'bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white shadow-blue-500/25 ring-blue-400/30'
              : 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-slate-100 shadow-slate-950/40 ring-slate-700/50 hover:border-slate-600 border border-slate-700/60'
          }`}
          title={isSpeaking ? 'Click to interrupt' : isListening ? 'Click to stop listening' : 'Click to start speaking'}
        >
          {/* Inner glass highlight */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-t from-transparent via-white/5 to-white/20 pointer-events-none" />

          {/* Center icon / visualizer animation */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            {isSearching ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                >
                  <Search className="w-9 h-9 text-cyan-200" />
                </motion.div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-cyan-200">
                  DOCenter
                </span>
              </>
            ) : isListening ? (
              <>
                {/* Audio reactive sound bars */}
                <div className="flex items-center gap-1 h-8">
                  {[0.4, 0.9, 0.6, 1.0, 0.7, 0.5].map((mult, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        height: Math.max(8, (volume * mult * 0.4)),
                      }}
                      transition={{ duration: 0.1 }}
                      className="w-1.5 bg-white rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[11px] font-medium tracking-wide text-emerald-200">
                  Listening...
                </span>
              </>
            ) : isSpeaking ? (
              <>
                <Volume2 className="w-9 h-9 text-blue-200 animate-pulse" />
                <span className="text-[11px] font-medium tracking-wide text-blue-200">
                  Speaking
                </span>
                <span className="text-[10px] text-blue-300/80 underline font-normal">
                  Tap to mute
                </span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 text-slate-300 group-hover:text-white transition-colors" />
                <span className="text-[12px] font-medium text-slate-300">
                  Tap to Speak
                </span>
              </>
            )}
          </div>
        </motion.button>
      </div>

      {/* Live status badge & engaging cues */}
      <div className="mt-4 flex flex-col items-center max-w-md">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 px-4 py-1.5 bg-cyan-950/70 border border-cyan-700/50 rounded-full text-cyan-200 text-xs font-medium backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>{statusMessage || 'Searching NICE Actimize DOCenter portal...'}</span>
            </motion.div>
          ) : isListening ? (
            <motion.div
              key="listening"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-2 px-3.5 py-1 bg-emerald-950/60 border border-emerald-700/50 rounded-full text-emerald-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Listening — speak your question...</span>
              </div>
              {interimTranscript && (
                <p className="text-xs text-slate-300 italic max-w-sm text-center line-clamp-2 px-2 mt-1">
                  "{interimTranscript}"
                </p>
              )}
            </motion.div>
          ) : isSpeaking ? (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 px-4 py-1 bg-blue-950/70 border border-blue-700/50 rounded-full text-blue-200 text-xs font-medium"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Answering with live documentation</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-slate-400 font-normal"
            >
              Hands-free voice agent • Ask any question about NICE Actimize products
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
