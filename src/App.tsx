import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Server,
  Activity,
  Sliders,
  Trash2,
  HelpCircle,
  BookOpen,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Message, VoiceState, McpHealthInfo, VoiceSettings, McpCallRecord } from './types';
import { voiceService } from './services/voice';
import { VoiceOrb } from './components/VoiceOrb';
import { StatusIndicator } from './components/StatusIndicator';
import { ChatMessage } from './components/ChatMessage';
import { McpInspectorModal } from './components/McpInspectorModal';
import { VoiceSettingsDrawer } from './components/VoiceSettingsDrawer';
import { SubmissionModal } from './components/SubmissionModal';
import { Award } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'What is ActOne?', query: 'What is ActOne?' },
  { label: 'ActOne Setup Checklist', query: 'What are the step-by-step setup and installation steps for ActOne 10.2?' },
  { label: 'ActOne 10.2 vs 10.1 Matrix', query: 'Compare ActOne 10.2 and 10.1 capabilities and differences' },
  { label: 'How to import ActOne objects', query: 'How do I import new ActOne objects into ActOne?' },
  { label: 'What is DART?', query: 'What is DART in NICE Actimize?' },
  { label: 'AML SAM Alert Policies', query: 'How do I configure AML SAM alert policies?' },
  { label: 'What is AIS?', query: 'What is Analytics Intelligence Server (AIS)?' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! I am **ActWise**, your voice-enabled AI assistant connected directly to the **NICE Actimize DOCenter** documentation portal.\n\nYou can ask me questions about **ActOne, AML SAM, AIS, UDM, SURVEIL-X, IFM, CDD**, and 90+ other Actimize products. I answer strictly from verified documentation and provide source citations.\n\nTap the microphone orb above or click any question below to get started!',
      spokenText:
        'Hello! I am ActWise, your voice assistant connected to the NICE Actimize DOCenter documentation portal. You can speak to me or type any question about ActOne, AML, or other Actimize products.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [
        {
          title: 'NICE Actimize Documentation Portal (DOCenter)',
          url: 'https://docs.niceactimize.com',
          bundle: 'DOCenter',
        },
      ],
      followUps: [
        'What is ActOne?',
        'How do I import new ActOne objects?',
        'Tell me what products are in the catalog',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeTool, setActiveTool] = useState<{ tool: string; args: Record<string, any> } | undefined>(undefined);
  const [activeMcpCalls, setActiveMcpCalls] = useState<McpCallRecord[]>([]);

  // Health and Settings
  const [mcpHealth, setMcpHealth] = useState<McpHealthInfo | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const [settings, setSettings] = useState<VoiceSettings>({
    autoSpeak: true,
    continuousConversation: true,
    speechRate: 1.05,
    ttsEngine: 'gemini',
    geminiVoice: 'Aoede',
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Escape or Space to interrupt immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (voiceState === 'speaking' || voiceState === 'listening') {
          handleInterrupt();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState]);

  // Check MCP Health on mount
  useEffect(() => {
    checkMcpHealth();
    const interval = setInterval(checkMcpHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, statusMessage]);

  const checkMcpHealth = async () => {
    try {
      const res = await fetch('/api/mcp/health');
      const data = await res.json();
      setMcpHealth(data);
    } catch {
      setMcpHealth({ ok: false, latencyMs: 0, error: 'Connection check failed' });
    }
  };

  // Toggle voice listening
  const handleToggleListening = () => {
    if (voiceState === 'listening') {
      voiceService.stopListening();
      setVoiceState('idle');
      setMicVolume(0);
    } else {
      startListeningSession();
    }
  };

  // Start listening session
  const startListeningSession = () => {
    if (speakingMessageId) {
      voiceService.stopSpeaking();
      setSpeakingMessageId(null);
    }

    setVoiceState('listening');
    setInterimTranscript('');

    voiceService.startAudioAnalysis((vol) => {
      setMicVolume(vol);
    });

    voiceService.startListening({
      onInterim: (text) => {
        setInterimTranscript(text);
      },
      onFinal: (finalText) => {
        setInterimTranscript('');
        setMicVolume(0);
        if (finalText.trim().length > 0) {
          submitQuery(finalText.trim());
        } else {
          setVoiceState('idle');
        }
      },
      onError: (err) => {
        console.warn('Voice recognition notice:', err);
        setVoiceState('idle');
        setMicVolume(0);
      },
      onEnd: () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
          setMicVolume(0);
        }
      },
    });
  };

  // Handle interruption / barge-in
  const handleInterrupt = () => {
    voiceService.stopSpeaking();
    setSpeakingMessageId(null);
    setVoiceState('idle');
  };

  // Submit user query to backend & ActWise MCP
  const submitQuery = async (queryText: string) => {
    if (!queryText || queryText.trim().length === 0) return;

    // Interrupt any ongoing speech
    handleInterrupt();

    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setVoiceState('mcp_searching');
    setStatusMessage(`Connecting to ActWise DOCenter for "${queryText}"...`);
    setActiveMcpCalls([]);

    // Format history for agent
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      text: m.content,
    }));

    try {
      // Connect to SSE stream endpoint with chosen natural voice
      const eventSourceUrl = `/api/chat/stream?q=${encodeURIComponent(queryText)}&voice=${encodeURIComponent(
        settings.geminiVoice
      )}&history=${encodeURIComponent(JSON.stringify(historyPayload))}`;

      const eventSource = new EventSource(eventSourceUrl);

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          if (data.type === 'status') {
            setStatusMessage(data.message || 'Searching documentation...');
          } else if (data.type === 'tool_start') {
            setVoiceState('mcp_searching');
            setStatusMessage(data.message || 'Querying DOCenter MCP...');
            setActiveTool(data.toolCall);
          } else if (data.type === 'tool_progress') {
            setStatusMessage(data.message || 'Consulting NICE Actimize DOCenter...');
          } else if (data.type === 'tool_end') {
            setStatusMessage(data.message || 'Documentation retrieved');
            if (data.toolCall) {
              setActiveMcpCalls((prev) => [...prev, data.toolCall]);
            }
          } else if (data.type === 'complete') {
            eventSource.close();
            const assistantMessageId = `assistant-${Date.now()}`;
            const assistantMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: data.fullAnswer || "I couldn't find relevant documentation for that query.",
              spokenText: data.spokenText,
              audioBase64: data.audioBase64,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              citations: data.citations || [],
              followUps: data.followUps || [],
              mcpCalls: data.mcpCalls || [],
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setStatusMessage('');
            setActiveTool(undefined);

            // Trigger Voice response if autoSpeak is enabled
            if (settings.autoSpeak && data.spokenText) {
              executeVoicePlayback(data.spokenText, assistantMessageId, data.audioBase64);
            } else {
              setVoiceState('idle');
            }
          } else if (data.type === 'error') {
            eventSource.close();
            setVoiceState('idle');
            setStatusMessage('');
            setActiveTool(undefined);
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: `I couldn't reach the documentation service right now. Please try again in a moment.`,
              spokenText: "I couldn't reach the documentation service right now. Please try again in a moment.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
        } catch (err) {
          console.error('Failed to parse SSE event', err);
        }
      };

      eventSource.onerror = (e) => {
        console.error('SSE connection error', e);
        eventSource.close();
        setVoiceState('idle');
        setStatusMessage('');
      };
    } catch (err: any) {
      console.error('Query submission error', err);
      setVoiceState('idle');
      setStatusMessage('');
    }
  };

  const executeVoicePlayback = async (text: string, messageId: string, preloadedAudio?: string) => {
    setVoiceState('speaking');
    setSpeakingMessageId(messageId);

    const onPlaybackEnd = () => {
      setVoiceState('idle');
      setSpeakingMessageId(null);
      setMicVolume(0);
      if (settings.continuousConversation) {
        setTimeout(() => {
          startListeningSession();
        }, 450);
      }
    };

    if (settings.ttsEngine === 'gemini') {
      let audio = preloadedAudio;
      if (!audio) {
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice: settings.geminiVoice }),
          });
          const json = await res.json();
          audio = json.audioBase64;
        } catch {
          // fallback to browser voice if network fails
        }
      }

      if (audio) {
        voiceService.playNaturalVoice(audio, {
          rate: settings.speechRate,
          onStart: () => setVoiceState('speaking'),
          onEnd: onPlaybackEnd,
          onError: () => {
            // fallback
            voiceService.speakFallback(text, {
              rate: settings.speechRate,
              voiceName: settings.selectedVoiceName,
              onEnd: onPlaybackEnd,
            });
          },
          onVolumeChange: (vol) => setMicVolume(vol),
        });
        return;
      }
    }

    // Fallback or browser engine
    voiceService.speakFallback(text, {
      rate: settings.speechRate,
      voiceName: settings.selectedVoiceName,
      onStart: () => setVoiceState('speaking'),
      onEnd: onPlaybackEnd,
      onError: () => {
        setVoiceState('idle');
        setSpeakingMessageId(null);
      },
    });
  };

  const handleSpeakText = (text: string, messageId: string, audioBase64?: string) => {
    if (speakingMessageId === messageId) {
      handleInterrupt();
      return;
    }

    handleInterrupt();
    executeVoicePlayback(text, messageId, audioBase64);
  };

  const clearConversation = () => {
    handleInterrupt();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Conversation history cleared. Ready for your questions on NICE Actimize products!',
        spokenText: 'Conversation cleared. How can I help you with NICE Actimize documentation?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">ActWise Docs</h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                Voice Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400">NICE Actimize DOCenter Portal</p>
          </div>
        </div>

        {/* Status badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* MCP Health Indicator */}
          <button
            onClick={() => setIsInspectorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-xs text-slate-300 transition-colors cursor-pointer shadow-sm"
            title="Click to view MCP Inspector"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                mcpHealth?.ok ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-[11px] hidden sm:inline">DOCenter MCP:</span>
            <span className="font-mono text-[11px] text-cyan-300">
              {mcpHealth?.ok ? `${mcpHealth.latencyMs}ms` : 'Connecting'}
            </span>
          </button>

          {/* Hackathon Submission Package */}
          <button
            onClick={() => setIsSubmissionOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
            title="Export Hackathon Submission Package"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Submission Package</span>
          </button>

          {/* Voice Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Voice & Audio Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Clear Chat */}
          <button
            onClick={clearConversation}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-3 sm:p-5 gap-4">
        {/* Voice Agent Stage (Visualizer Orb) */}
        <div className="w-full rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 shadow-xl overflow-hidden py-4 sm:py-6">
          <VoiceOrb
            state={voiceState}
            volume={micVolume}
            statusMessage={statusMessage}
            interimTranscript={interimTranscript}
            onToggleListening={handleToggleListening}
            onInterrupt={handleInterrupt}
          />

          {/* Status Indicator for MCP calls */}
          <StatusIndicator
            statusText={statusMessage}
            activeTool={activeTool}
            mcpCalls={activeMcpCalls}
            isSearching={voiceState === 'mcp_searching'}
          />

          {/* Quick Voice Prompts */}
          <div className="mt-2 px-4 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Try asking:
            </span>
            {QUICK_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => submitQuery(item.query)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation History Stream */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[350px] max-h-[500px] scroll-smooth"
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isSpeakingThis={speakingMessageId === msg.id}
              onSpeak={(text, audio) => handleSpeakText(text, msg.id, audio)}
              onStopSpeaking={handleInterrupt}
              onSelectSuggestion={(sugg) => submitQuery(sugg)}
            />
          ))}
        </div>

        {/* Bottom Text & Voice Input Bar */}
        <div className="sticky bottom-2 z-30 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitQuery(inputQuery);
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md"
          >
            {/* Microphone button */}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                voiceState === 'listening'
                  ? 'bg-emerald-600 text-white animate-pulse shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={voiceState === 'listening' ? 'Stop listening' : 'Start speaking'}
            >
              {voiceState === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => {
                setInputQuery(e.target.value);
                if (voiceState === 'speaking') {
                  handleInterrupt();
                }
              }}
              placeholder="Ask ActWise about ActOne, AML SAM, AIS, installation, configuration..."
              disabled={voiceState === 'mcp_searching'}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || voiceState === 'mcp_searching'}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
              title="Submit query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-3 mt-1.5 font-normal">
            <span>Powered by ActWise Docs MCP & Gemini AI</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live DOCenter Grounding
            </span>
          </div>
        </div>
      </main>

      {/* Mcp Inspector Modal */}
      <McpInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        health={mcpHealth}
        onRefreshHealth={checkMcpHealth}
      />

      {/* Voice Settings Drawer */}
      <VoiceSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        voices={voiceService.getVoices()}
      />

      {/* Hackathon Submission Package Modal */}
      <SubmissionModal
        isOpen={isSubmissionOpen}
        onClose={() => setIsSubmissionOpen(false)}
        cloudRunUrl="https://actwise-live-218423701961.us-central1.run.app"
      />
    </div>
  );
}

