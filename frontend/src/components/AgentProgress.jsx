// src/components/AgentProgress.jsx
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AGENTS = [
  { key: 'market_intel',   label: 'Market Intelligence',  desc: 'Scanning web & market sources',       icon: '🌐' },
  { key: 'icp_qualifier',  label: 'ICP Qualification',    desc: 'Matching companies to your ICP',      icon: '🎯' },
  { key: 'company_intel',  label: 'Company Enrichment',   desc: 'Gathering detailed company data',     icon: '🏢' },
  { key: 'contact_intel',  label: 'Contact Discovery',    desc: 'Finding decision-makers',             icon: '👤' },
  { key: 'buying_intent',  label: 'Intent Scoring',       desc: 'Calculating buying intent scores',    icon: '⚡' },
  { key: 'recommendation', label: 'Recommendations',      desc: 'Building final action plan',          icon: '✨' },
];

export default function AgentProgress({ completedAgents = [], isRunning = false }) {
  const progress = (completedAgents.length / AGENTS.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'rgba(44, 30, 48, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(147, 80, 115, 0.1)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
      }}>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: isRunning
                ? 'linear-gradient(135deg, #7a4a6a, #935073)'
                : 'linear-gradient(135deg, #8aaa7a, #b5c9a8)',
              boxShadow: isRunning ? '0 2px 16px rgba(147,80,115,0.35)' : '0 2px 16px rgba(181,201,168,0.2)',
            }}>
            {isRunning
              ? <Loader2 className="w-4 h-4 spin text-[#f0e6e0]" />
              : <CheckCircle2 className="w-4 h-4 text-[#f0e6e0]" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f0e6e0]">
              {isRunning ? 'Agents working…' : 'Pipeline complete'}
            </h3>
            <p className="text-[13px] text-[#b098a8]">
              {isRunning
                ? `${completedAgents.length} of ${AGENTS.length} agents done`
                : `All ${AGENTS.length} agents completed successfully`}
            </p>
          </div>
        </div>

        <div className="text-sm font-extrabold px-3 py-1 rounded-full"
          style={{
            background: progress === 100 ? 'rgba(181,201,168,0.12)' : 'rgba(147,80,115,0.12)',
            color: progress === 100 ? '#b5c9a8' : '#c4a0b8',
            border: `1px solid ${progress === 100 ? 'rgba(181,201,168,0.15)' : 'rgba(147,80,115,0.15)'}`,
          }}>
          {Math.round(progress)}%
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {AGENTS.map((agent, i) => {
          const done = completedAgents.includes(agent.key);
          const running = i === completedAgents.length && isRunning;

          return (
            <motion.div
              key={agent.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={
                done
                  ? { background: 'rgba(181,201,168,0.06)', border: '1px solid rgba(181,201,168,0.1)' }
                  : running
                  ? { background: 'rgba(147,80,115,0.1)', border: '1px solid rgba(147,80,115,0.2)' }
                  : { background: 'rgba(30,18,34,0.3)', border: '1px solid rgba(147,80,115,0.05)', opacity: 0.5 }
              }>

              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={
                  done ? { background: 'rgba(181,201,168,0.08)', border: '1px solid rgba(181,201,168,0.1)' }
                  : running ? { background: 'rgba(147,80,115,0.15)', border: '1px solid rgba(147,80,115,0.2)' }
                  : { background: 'rgba(30,18,34,0.3)', border: '1px solid rgba(147,80,115,0.06)' }
                }>
                {agent.icon}
              </div>

              <div className="shrink-0">
                {done ? <CheckCircle2 className="w-4 h-4 text-[#b5c9a8]" />
                  : running ? <Loader2 className="w-4 h-4 spin text-[#c4a0b8]" />
                  : <Circle className="w-4 h-4 text-[#4a3a42]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold"
                  style={{ color: done ? '#b5c9a8' : running ? '#f0e6e0' : '#7a6a72' }}>
                  {agent.label}
                </div>
                <div className="text-[13px] truncate text-[#8a7a80]">{agent.desc}</div>
              </div>

              {done && (
                <span className="text-[12px] font-semibold px-3 py-1 rounded-full shrink-0"
                  style={{ background: 'rgba(181,201,168,0.1)', color: '#b5c9a8', border: '1px solid rgba(181,201,168,0.12)' }}>
                  Done
                </span>
              )}
              {running && (
                <span className="text-[12px] font-semibold px-3 py-1 rounded-full shrink-0 pulse-dot"
                  style={{ background: 'rgba(147,80,115,0.15)', color: '#c4a0b8', border: '1px solid rgba(147,80,115,0.2)' }}>
                  Running
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(147,80,115,0.1)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #7a4a6a, #935073, #c4a0b8)' }} />
        </div>
      </div>
    </motion.div>
  );
}