import React, { useState } from 'react';
import { X, Copy, Check, Rocket, Video, Award, Share2 } from 'lucide-react';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudRunUrl: string;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ isOpen, onClose, cloudRunUrl }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const videoScript = `🎥 2-MINUTE DEMO VIDEO SCRIPT & STORYBOARD
  
0:00 - 0:25 (THE PROBLEM): "Most enterprise documentation forces users to search through PDF manuals or isolated chat boxes. Today, we built ActWise Live — an ambient, voice-enabled intelligence layer for NICE Actimize documentation."

0:25 - 1:15 (LIVE VOICE DEMO): "Tap the glowing Voice Orb or speak into your mic. Ask: 'What is ActOne 10.2 and how do I import objects?' ActWise connects live to the ActWise MCP server, streams real-time filler status messages, and speaks a short 2-sentence summary out loud while rendering interactive setup checklists and official portal URL citations on screen."

1:15 - 1:45 (BARGE-IN & AMBIENT CHANNELS): "Interrupt the agent mid-sentence — it immediately stops audio playback and answers your follow-up. Plus, with the ActWise Anywhere Chrome Extension, you can highlight text on any web page to invoke voice documentation Q&A."

1:45 - 2:00 (STACK & CLOUD RUN): "Built with Gemini 2.0 Flash Multimodal Live API, Node/Express, React 19, Tailwind, CopilotKit UI components, and deployed live on Google Cloud Run."`;

  const socialPost = `🚀 Built "ActWise Live" for the Agents, Everywhere Global Hackathon! 

An ambient, executive voice agent for NICE Actimize documentation powered by Gemini 2.0 Flash Multimodal Live API, ActWise MCP Server, CopilotKit UI components, and Google Cloud Run. 

🎙️ Instant barge-in interrupts
🔍 Real-time MCP portal doc retrieval
⚡ Interactive setup checklists & sidecar extension

Live Demo: ${cloudRunUrl || 'https://actwise-live-218423701961.us-central1.run.app'}

#AITinkerers #AgentsEverywhere #GoogleCloud #OpenAI #CopilotKit #GeminiAI`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Hackathon Submission Package</h2>
            <p className="text-xs text-slate-400">Agents, Everywhere Global Hackathon Materials</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Production Endpoint Card */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-semibold">Live Google Cloud Run Service</span>
                <h3 className="text-sm font-semibold text-slate-100 font-mono mt-0.5">{cloudRunUrl || 'https://actwise-live-218423701961.us-central1.run.app'}</h3>
              </div>
              <button
                onClick={() => copyToClipboard(cloudRunUrl || 'https://actwise-live-218423701961.us-central1.run.app', 'url')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 text-xs font-medium flex items-center gap-1.5"
              >
                {copiedSection === 'url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy URL
              </button>
            </div>
          </div>

          {/* 2-Minute Demo Video Script */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">2-Minute Demo Video Script & Storyboard</h3>
              </div>
              <button
                onClick={() => copyToClipboard(videoScript, 'script')}
                className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
              >
                {copiedSection === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Script
              </button>
            </div>
            <pre className="text-xs font-mono bg-slate-900/80 p-3 rounded-lg text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {videoScript}
            </pre>
          </div>

          {/* Social Media Post */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">Social Media Submission Post</h3>
              </div>
              <button
                onClick={() => copyToClipboard(socialPost, 'social')}
                className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
              >
                {copiedSection === 'social' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Post
              </button>
            </div>
            <pre className="text-xs font-mono bg-slate-900/80 p-3 rounded-lg text-slate-300 whitespace-pre-wrap leading-relaxed">
              {socialPost}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
