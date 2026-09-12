import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import {
  Volume2,
  VolumeX,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Bookmark,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';
import { Message, DocCitation } from '../types';
import { InstallationChecklist } from './InstallationChecklist';
import { VersionCompareMatrix } from './VersionCompareMatrix';

interface ChatMessageProps {
  message: Message;
  isSpeakingThis: boolean;
  onSpeak: (text: string, audioBase64?: string) => void;
  onStopSpeaking: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isSpeakingThis,
  onSpeak,
  onStopSpeaking,
  onSelectSuggestion,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMcpDetails, setShowMcpDetails] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    if (isSpeakingThis) {
      onStopSpeaking();
    } else {
      voiceService.primeAudio();
      const textToSpeak = message.spokenText || message.content;
      onSpeak(textToSpeak, message.audioBase64);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} my-3`}
    >
      <div
        className={`relative max-w-3xl w-full rounded-2xl p-4 sm:p-5 transition-all shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-slate-800 to-slate-800/90 text-slate-100 border border-slate-700/70 ml-8'
            : 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 text-slate-100 border border-slate-800/80 mr-4'
        }`}
      >
        {/* Header with avatar & role */}
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold ${
                isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white'
              }`}
            >
              {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-medium text-slate-300">
              {isUser ? 'You' : 'ActWise Docs Agent'}
            </span>
            <span className="text-[10px] text-slate-500">{message.timestamp}</span>
          </div>

          {/* Action buttons */}
          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleSpeak}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                  isSpeakingThis
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isSpeakingThis ? 'Stop speaking' : 'Read aloud with voice'}
              >
                {isSpeakingThis ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">Voice Replay</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy markdown text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {isUser ? (
          <p className="text-sm text-slate-200 font-normal leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div className="markdown-body prose prose-invert max-w-none text-sm leading-relaxed text-slate-200 space-y-2">
            <Markdown
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 break-all"
                  >
                    <span>{props.children}</span>
                    <ExternalLink className="w-3 h-3 inline-block shrink-0" />
                  </a>
                ),
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 text-slate-200" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 text-slate-200" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mt-3 mb-1" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-base font-semibold text-white mt-3 mb-1" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-sm font-semibold text-cyan-200 mt-2 mb-1" {...props} />,
                code: ({ node, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1] : '';
                  const content = String(children).replace(/\n$/, '');

                  if (lang === 'checklist') {
                    try {
                      const data = JSON.parse(content);
                      return <InstallationChecklist productTitle={data.productTitle} steps={data.steps} />;
                    } catch (e) {
                      console.warn('Failed to parse checklist block', e);
                    }
                  }

                  if (lang === 'matrix') {
                    try {
                      const data = JSON.parse(content);
                      return (
                        <VersionCompareMatrix
                          product={data.product}
                          oldVersion={data.oldVersion}
                          newVersion={data.newVersion}
                          comparisons={data.comparisons}
                        />
                      );
                    } catch (e) {
                      console.warn('Failed to parse matrix block', e);
                    }
                  }

                  const isInline = !className && !String(children).includes('\n');
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs" {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code className={`block text-xs font-mono text-cyan-200 ${className || ''}`} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ node, children, ...props }: any) => {
                  const firstChild = React.Children.toArray(children)[0] as any;
                  const className = firstChild?.props?.className || '';
                  if (className.includes('language-checklist') || className.includes('language-matrix')) {
                    return <div>{children}</div>;
                  }
                  return (
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto text-cyan-200 my-2" {...props}>
                      {children}
                    </pre>
                  );
                },
              }}
            >
              {message.content}
            </Markdown>
          </div>
        )}

        {/* Verified DOCenter Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified NICE Actimize Documentation Sources ({message.citations.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((cite, i) => (
                <a
                  key={i}
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-cyan-300 hover:text-cyan-200 transition-colors shadow-sm group"
                  title={cite.bundle ? `Bundle: ${cite.bundle}` : cite.title}
                >
                  <ExternalLink className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                  <span className="font-medium max-w-[240px] truncate">{cite.title}</span>
                  {cite.bundle && (
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded hidden sm:inline">
                      {cite.bundle.split('_')[1] || cite.bundle}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Follow-up chips */}
        {!isUser && message.followUps && message.followUps.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Suggested Follow-ups:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.followUps.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSelectSuggestion?.(prompt)}
                  className="px-3 py-1 rounded-full text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-cyan-950 hover:border-cyan-700/70 hover:text-cyan-200 border border-slate-700/70 transition-all text-left flex items-center gap-1.5 group"
                >
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible MCP Execution Telemetry */}
        {!isUser && message.mcpCalls && message.mcpCalls.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/60">
            <button
              onClick={() => setShowMcpDetails(!showMcpDetails)}
              className="flex items-center justify-between w-full text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <Cpu className="w-3 h-3 text-cyan-400" />
                DOCenter MCP Tool Telemetry ({message.mcpCalls.length} tool call{message.mcpCalls.length > 1 ? 's' : ''})
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                {showMcpDetails ? 'Hide details' : 'View payload'}
                {showMcpDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </span>
            </button>

            {showMcpDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 space-y-2 text-xs"
              >
                {message.mcpCalls.map((call, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300"
                  >
                    <div className="flex items-center justify-between text-cyan-300 font-semibold mb-1">
                      <span>{call.tool}</span>
                      <span className="text-[10px] text-slate-400">{call.durationMs}ms</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Arguments: {JSON.stringify(call.arguments)}
                    </div>
                    {call.isError ? (
                      <div className="text-red-400 mt-1">Error: {call.errorMessage}</div>
                    ) : (
                      <div className="text-slate-400 text-[10px] mt-1 truncate">
                        Response: {call.data?.results ? `${call.data.results.length} results returned` : call.data?.title ? `Page: ${call.data.title}` : 'Success'}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
