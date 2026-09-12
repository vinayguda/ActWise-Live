import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, FileText, Database, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { McpCallRecord } from '../types';

interface StatusIndicatorProps {
  statusText?: string;
  activeTool?: {
    tool: string;
    args: Record<string, any>;
  };
  mcpCalls?: McpCallRecord[];
  isSearching: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  statusText,
  activeTool,
  mcpCalls = [],
  isSearching,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isSearching) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
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
        className="rounded-xl border border-cyan-900/60 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-cyan-950/70 p-3.5 shadow-lg backdrop-blur-md text-slate-200"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Active status */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
              {isSearching ? (
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  {isSearching ? 'ActWise Docs MCP Active' : 'DOCenter MCP Telemetry'}
                </span>
                {isSearching && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300/80 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                    <Clock className="w-3 h-3" />
                    {elapsedSeconds}s
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
                {statusText || (isSearching ? 'Querying DOCenter documentation portal...' : 'Live documentation retrieved.')}
              </p>
            </div>
          </div>

          {/* Active tool badge */}
          {activeTool && isSearching && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/80 border border-cyan-800/60 rounded-md text-[11px] font-mono text-cyan-200">
              <Database className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold text-cyan-300">{activeTool.tool}</span>
              {activeTool.args.query && (
                <span className="text-slate-400 max-w-[140px] truncate">
                  "{activeTool.args.query}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Steps visualizer during search */}
        {isSearching && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-cyan-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live DOCenter Search
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-500" />
              Full Page Retrieval
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-500" />
              Verified Citations
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
