import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Server,
  Activity,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  Search,
  BookOpen,
  Code,
} from 'lucide-react';
import { McpHealthInfo } from '../types';

interface McpInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: McpHealthInfo | null;
  onRefreshHealth: () => void;
}

export const McpInspectorModal: React.FC<McpInspectorModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefreshHealth,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'tools' | 'catalog'>('status');
  const [tools, setTools] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any>(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTools();
      fetchCatalog();
    }
  }, [isOpen]);

  const fetchTools = async () => {
    setLoadingTools(true);
    try {
      const res = await fetch('/api/mcp/tools');
      const data = await res.json();
      if (data.tools) setTools(data.tools);
    } catch (e) {
      console.error('Failed to fetch tools', e);
    } finally {
      setLoadingTools(false);
    }
  };

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const res = await fetch('/api/mcp/catalog');
      const data = await res.json();
      setCatalog(data);
    } catch (e) {
      console.error('Failed to fetch catalog', e);
    } finally {
      setLoadingCatalog(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/80 border border-cyan-700/50 rounded-lg text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                ActWise Docs MCP Inspector
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                https://actwise-dev-mcp.ps.actimize.services/mcp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-2 border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Connection
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'tools'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Available Tools ({tools.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'catalog'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Product Catalog ({catalog?.productCount || 91})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Connection Status</span>
                    {health?.ok ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Live & Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" /> Rechecking
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${health?.ok ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    DOCenter Gateway
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Ping Latency</span>
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-cyan-300 font-mono">
                    {health?.latencyMs !== undefined ? `${health.latencyMs} ms` : 'Measuring...'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security & Authentication</span>
                </div>
                <div className="space-y-1 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Endpoint Protocol:</span>
                    <span className="text-slate-200">HTTP JSON-RPC + SSE Stream</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Header:</span>
                    <span className="text-cyan-300">X-API-Key: poc-actwise-key-***</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Accept Headers:</span>
                    <span className="text-slate-200">application/json, text/event-stream</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={onRefreshHealth}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-test Connection
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-3">
              {loadingTools ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading tools...</div>
              ) : (
                tools.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono text-cyan-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-cyan-400" />
                        {t.name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">DOCenter</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line line-clamp-3">
                      {t.description?.split('\n')[0] || t.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter Actimize products (ActOne, AML, AIS, UDM)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {loadingCatalog ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading catalog...</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {catalog?.categories?.map((cat: any) => {
                    const filteredProducts = cat.products?.filter(
                      (p: any) =>
                        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                        p.slug.toLowerCase().includes(catalogSearch.toLowerCase())
                    );
                    if (filteredProducts?.length === 0) return null;

                    return (
                      <div key={cat.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                        <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {filteredProducts.length} product{filteredProducts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filteredProducts.map((p: any) => (
                            <div
                              key={p.slug}
                              className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-[11px]"
                            >
                              <div className="font-medium text-cyan-300">{p.name}</div>
                              <div className="text-[10px] text-slate-400 flex justify-between mt-1">
                                <span>Slug: <code className="text-slate-300">{p.slug}</code></span>
                                {p.latestVersion && <span>v{p.latestVersion}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
