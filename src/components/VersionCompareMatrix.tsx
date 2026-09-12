import React from 'react';
import { Layers, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface FeatureComparison {
  feature: string;
  verOld: string;
  verNew: string;
  status: 'added' | 'enhanced' | 'deprecated';
}

interface VersionCompareMatrixProps {
  product: string;
  oldVersion: string;
  newVersion: string;
  comparisons: FeatureComparison[];
}

export const VersionCompareMatrix: React.FC<VersionCompareMatrixProps> = ({
  product,
  oldVersion,
  newVersion,
  comparisons,
}) => {
  return (
    <div className="my-4 rounded-xl border border-indigo-500/20 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-100 text-sm">{product} — Version Matrix ({oldVersion} vs {newVersion})</h4>
          <p className="text-xs text-slate-400">Key capability and specification changes</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono">
              <th className="py-2 px-3 font-medium">Feature / Subsystem</th>
              <th className="py-2 px-3 font-medium">{product} {oldVersion}</th>
              <th className="py-2 px-3 font-medium text-cyan-400">{product} {newVersion}</th>
              <th className="py-2 px-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {comparisons.map((c, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-3 font-medium text-slate-200">{c.feature}</td>
                <td className="py-2.5 px-3 text-slate-400">{c.verOld}</td>
                <td className="py-2.5 px-3 text-cyan-300 font-medium">{c.verNew}</td>
                <td className="py-2.5 px-3 text-right">
                  {c.status === 'added' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      + NEW
                    </span>
                  )}
                  {c.status === 'enhanced' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      ⚡ ENHANCED
                    </span>
                  )}
                  {c.status === 'deprecated' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      ⚠️ DEPRECATED
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
