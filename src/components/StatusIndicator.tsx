import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, Database, CheckCircle2, Clock, Sparkles, Volume2, ArrowRight, Layers } from 'lucide-react';
import { McpCallRecord } from '../types';

interface StatusIndicatorProps {
  statusText?: string;
  spokenCue?: string;
  activeTool?: {
    tool: string;
    args: Record<string, any>;
  };
  mcpCalls?: McpCallRecord[];
  isSearching: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  statusText,
  spokenCue,
  activeTool,
  mcpCalls = [],
  isSearching,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isSearching) {
      const start = Date.now();
      setElapsedSeconds(0);
      timer = setInterval(() => {
        const diff = (Date.now() - start) / 1000;
        setElapsedSeconds(parseFloat(diff.toFixed(1)));
      }, 100);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isSearching]);

  if (!isSearching && mcpCalls.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto my-3 px-4">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-cyan-800/60 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-cyan-950/80 p-3.5 shadow-xl backdrop-blur-md text-slate-200"
      >
        {/* Animated scanning radar beam during tool search */}
        {isSearching && (
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent pointer-events-none"
          />
        )}

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
          {/* Active status & timer */}
          <div className="flex items-center gap-2.5 min-w-[240px]">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400 shadow-inner">
              {isSearching ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                  </span>
                </>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {isSearching ? 'Active MCP Tool Call' : 'DOCenter MCP Telemetry'}
                </span>
                {isSearching && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-cyan-300 bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-700/60">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {elapsedSeconds.toFixed(1)}s
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 font-medium line-clamp-1 mt-0.5">
                {statusText || (isSearching ? 'Querying NICE Actimize DOCenter portal...' : 'Live documentation retrieved.')}
              </p>
            </div>
          </div>

          {/* Active tool badge & live argument cue */}
          {activeTool && isSearching && (
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950 border border-cyan-700/80 rounded-lg text-[11px] font-mono text-cyan-200 shadow-sm">
                <Database className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="font-bold text-cyan-300">{activeTool.tool}</span>
              </div>
              {activeTool.args.product && (
                <span className="px-2 py-0.5 bg-sky-900/60 border border-sky-700/60 rounded text-[10px] font-mono text-sky-200 uppercase">
                  {activeTool.args.product}
                </span>
              )}
              {activeTool.args.query && (
                <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded text-[11px] font-mono text-slate-300 max-w-[160px] truncate">
                  "{activeTool.args.query}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Spoken cue audio notification pill */}
        <AnimatePresence>
          {isSearching && spokenCue && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative z-10 mt-2.5 pt-2 border-t border-cyan-900/40 flex items-center justify-between gap-2 text-[11px]"
            >
              <div className="flex items-center gap-2 text-cyan-300 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Cue:</span>
                <span className="text-slate-300 italic font-normal">"{spokenCue}"</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider">
                Live Feedback
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent completed tool calls summary */}
        {mcpCalls.length > 0 && !isSearching && (
          <div className="relative z-10 mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium">
                {mcpCalls.length} MCP operation{mcpCalls.length > 1 ? 's' : ''} executed
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
              {mcpCalls.map((c, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {c.tool} ({c.durationMs}ms)
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
