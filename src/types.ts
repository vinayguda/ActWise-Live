/**
 * Type definitions for ActWise Docs Voice Agent
 */

export interface McpCallRecord {
  tool: string;
  arguments: Record<string, any>;
  durationMs: number;
  data: any;
  isError?: boolean;
  errorMessage?: string;
}

export interface DocCitation {
  title: string;
  url: string;
  bundle?: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  spokenText?: string;
  audioBase64?: string;
  timestamp: string;
  citations?: DocCitation[];
  followUps?: string[];
  mcpCalls?: McpCallRecord[];
  isStreaming?: boolean;
  statusText?: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'mcp_searching' | 'speaking' | 'muted';

export interface McpHealthInfo {
  ok: boolean;
  latencyMs: number;
  toolsCount?: number;
  error?: string;
}

export interface VoiceSettings {
  autoSpeak: boolean;
  audioCues: boolean; // Acoustic and spoken cues during tool calling
  continuousConversation: boolean;
  speechRate: number;
  ttsEngine: 'gemini' | 'browser';
  geminiVoice: string; // 'Aoede' | 'Zephyr' | 'Puck' | 'Kore' | 'Charon' | 'Fenrir'
  selectedVoiceName?: string;
}
