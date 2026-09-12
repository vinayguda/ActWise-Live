import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sliders, Sparkles, Volume2, Mic, Play, Square, Music } from 'lucide-react';
import { VoiceSettings } from '../types';
import { voiceService } from '../services/voice';
import { ambientMusicService } from '../services/ambientMusic';

interface VoiceSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
  voices: SpeechSynthesisVoice[];
}

export const GEMINI_NATURAL_VOICES = [
  { id: 'Aoede', name: 'Aoede', desc: 'Warm, natural & welcoming (Recommended)', tag: 'Warm' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Quick, nimble & friendly conversationalist', tag: 'Nimble' },
  { id: 'Puck', name: 'Puck', desc: 'Energetic, crisp & sharp tone', tag: 'Energetic' },
  { id: 'Kore', name: 'Kore', desc: 'Poised, professional & balanced', tag: 'Clear' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Deep, warm & authoritative', tag: 'Deep' },
];

export const VoiceSettingsDrawer: React.FC<VoiceSettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  voices,
}) => {
  const [testingVoice, setTestingVoice] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(ambientMusicService.isPlaying());
  const [musicVolume, setMusicVolume] = useState(ambientMusicService.getVolume());

  React.useEffect(() => {
    const unsub = ambientMusicService.addListener((playing, vol) => {
      setIsMusicPlaying(playing);
      setMusicVolume(vol);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleTestVoice = async () => {
    if (testingVoice) {
      voiceService.stopSpeaking();
      setTestingVoice(false);
      return;
    }

    setTestingVoice(true);
    const testPhrase =
      "Hello! I am ActWise. I can help you find answers and procedures across NICE Actimize documentation. What product can I check for you?";

    if (settings.ttsEngine === 'gemini') {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: testPhrase, voice: settings.geminiVoice }),
        });
        const data = await res.json();
        if (data.audioBase64) {
          voiceService.playNaturalVoice(data.audioBase64, {
            rate: settings.speechRate,
            onEnd: () => setTestingVoice(false),
            onError: () => setTestingVoice(false),
          });
        } else {
          fallbackSpeech(testPhrase);
        }
      } catch {
        fallbackSpeech(testPhrase);
      }
    } else {
      fallbackSpeech(testPhrase);
    }
  };

  const fallbackSpeech = (text: string) => {
    voiceService.speakFallback(text, {
      rate: settings.speechRate,
      voiceName: settings.selectedVoiceName,
      onEnd: () => setTestingVoice(false),
      onError: () => setTestingVoice(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg text-white">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Natural Voice & Interaction</h3>
              <p className="text-[11px] text-slate-400">Configure realistic human voice, speed & interruption</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Switch */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Voice Synthesis Engine
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onUpdateSettings({ ttsEngine: 'gemini' })}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                settings.ttsEngine === 'gemini'
                  ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200 shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-white flex items-center gap-1">
                <span>Gemini Natural Voice</span>
                <span className="text-[9px] bg-cyan-500 text-black px-1 rounded font-bold">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Studio-quality human inflection, warm, nimble and lifelike.
              </p>
            </button>

            <button
              onClick={() => onUpdateSettings({ ttsEngine: 'browser' })}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                settings.ttsEngine === 'browser'
                  ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200 shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-white">Browser Enhanced Voice</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Local device engine, zero latency, tuned pitch & cadence.
              </p>
            </button>
          </div>
        </div>

        {/* Gemini Voice Persona List */}
        {settings.ttsEngine === 'gemini' && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Natural Voice Persona</span>
              <span className="text-[10px] text-cyan-400 font-mono">24kHz Studio Audio</span>
            </div>
            <div className="space-y-1.5">
              {GEMINI_NATURAL_VOICES.map((v) => {
                const isSelected = settings.geminiVoice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onUpdateSettings({ geminiVoice: v.id })}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-500/80 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                      <div>
                        <span className="font-semibold text-white">{v.name}</span>
                        <span className="text-slate-400 text-[11px] ml-2 font-normal">{v.desc}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {v.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Browser Voice Selector if using browser engine */}
        {settings.ttsEngine === 'browser' && voices.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-200 block">Local Device Voice</label>
            <select
              value={settings.selectedVoiceName || ''}
              onChange={(e) => onUpdateSettings({ selectedVoiceName: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Default Natural Voice</option>
              {voices
                .filter((v) => v.lang.startsWith('en'))
                .map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Speed & Interruption Behavior */}
        <div className="space-y-3 text-xs">
          {/* Continuous Conversation */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="font-semibold text-slate-200">Instant Hands-Free Conversation</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Automatically resumes listening after answering. Interrupted immediately when you speak.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.continuousConversation}
                onChange={(e) => onUpdateSettings({ continuousConversation: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Tool Calling Acoustic & Spoken Cues */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="font-semibold text-slate-200">Natural Tool Calling Cues</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Announces tool progress in the exact same natural studio voice (or harmonic chimes).
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.audioCues ?? true}
                onChange={(e) => onUpdateSettings({ audioCues: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Light Ambient Background Music */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-cyan-400" />
                  <span>Ambient Background Music</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Relaxing, low-fi studio soundscape with smart auto-ducking when speaking.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMusicPlaying}
                  onChange={() => {
                    ambientMusicService.toggle();
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
            {isMusicPlaying && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Music Volume</span>
                  <span className="font-mono text-cyan-300">{Math.round(musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.6"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => ambientMusicService.setVolume(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Speech Rate */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between font-semibold text-slate-200">
              <span>Speech Cadence & Tempo</span>
              <span className="font-mono text-cyan-300">{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.9"
              max="1.3"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.9x (Deliberate)</span>
              <span>1.05x (Nimble & Conversational)</span>
              <span>1.3x (Brisk)</span>
            </div>
          </div>
        </div>

        {/* Footer Actions with Test Voice Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleTestVoice}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {testingVoice ? (
              <>
                <Square className="w-3.5 h-3.5 text-red-400 fill-current" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                <span>Preview Voice Sample</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
