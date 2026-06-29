// src/components/AgentProgress.jsx
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const AGENTS = [
  { key: 'market_intel',   label: 'Market Intelligence',  desc: 'Scanning web & market sources' },
  { key: 'icp_qualifier',  label: 'ICP Qualification',    desc: 'Matching companies to your ICP' },
  { key: 'company_intel',  label: 'Company Enrichment',   desc: 'Gathering detailed company data' },
  { key: 'contact_intel',  label: 'Contact Discovery',    desc: 'Finding decision-makers' },
  { key: 'buying_intent',  label: 'Intent Scoring',       desc: 'Calculating buying intent scores' },
  { key: 'recommendation', label: 'Recommendations',      desc: 'Building final action plan' },
];

export default function AgentProgress({ completedAgents = [], isRunning = false }) {
  // Infer current running agent
  const lastCompleted = completedAgents[completedAgents.length - 1];
  const lastIdx = AGENTS.findIndex(a => a.key === lastCompleted);
  const currentIdx = isRunning ? lastIdx + 1 : -1;

  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-4">
        {isRunning && <Loader2 className="w-4 h-4 text-brand-400 spin" />}
        <h3 className="text-sm font-semibold text-white">
          {isRunning ? 'Agents working…' : 'Pipeline complete'}
        </h3>
        {isRunning && (
          <span className="ml-auto text-xs text-muted">
            {completedAgents.length}/{AGENTS.length} agents done
          </span>
        )}
      </div>

      <div className="space-y-2">
        {AGENTS.map((agent, i) => {
          const done = completedAgents.includes(agent.key);
          const running = i === currentIdx && isRunning;

          return (
            <div key={agent.key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${done ? 'bg-emerald-500/5 border border-emerald-500/15'
                : running ? 'bg-brand-600/10 border border-brand-600/25'
                : 'bg-surface border border-border opacity-50'}`}>
              <div className="shrink-0">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : running ? (
                  <Loader2 className="w-4 h-4 text-brand-400 spin" />
                ) : (
                  <Circle className="w-4 h-4 text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${done ? 'text-emerald-300' : running ? 'text-brand-300' : 'text-muted'}`}>
                  {agent.label}
                </div>
                <div className="text-[11px] text-muted truncate">{agent.desc}</div>
              </div>
              {done && <span className="text-[10px] text-emerald-400">Done</span>}
              {running && <span className="text-[10px] text-brand-400 pulse-dot">Running</span>}
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="mt-4">
        <div className="h-1 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
            style={{ width: `${(completedAgents.length / AGENTS.length) * 100}%` }}
          />
        </div>
        <div className="text-right text-[10px] text-muted mt-1">
          {Math.round((completedAgents.length / AGENTS.length) * 100)}%
        </div>
      </div>
    </div>
  );
}
