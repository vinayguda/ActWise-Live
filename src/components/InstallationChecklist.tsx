import React, { useState } from 'react';
import { CheckCircle2, Circle, ListChecks, Play } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  detail: string;
}

interface InstallationChecklistProps {
  productTitle: string;
  steps: Step[];
}

export const InstallationChecklist: React.FC<InstallationChecklistProps> = ({ productTitle, steps }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / (steps.length || 1)) * 100);

  return (
    <div className="my-4 rounded-xl border border-cyan-500/20 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-sm">{productTitle} — Interactive Setup Guide</h4>
            <p className="text-xs text-slate-400">Step-by-step verified procedure from DOCenter</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
          {completedCount} / {steps.length} Done ({progressPercent}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = !!completedSteps[step.id];
          return (
            <div
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/80 text-slate-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <div className="font-medium text-slate-100">
                  <span className="font-mono text-cyan-400 mr-1.5">Step {idx + 1}:</span>
                  {step.title}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">{step.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
