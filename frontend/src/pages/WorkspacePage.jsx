// src/pages/WorkspacePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaces as wsApi, discovery as discoveryApi } from '../api/client';
import ICPForm from '../components/ICPForm';
import AgentProgress from '../components/AgentProgress';
import ResultsCards from '../components/ResultsCards';
import ResultsChatbot from '../components/ResultsChatbot';
import { RefreshCw, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AGENTS = ['market_intel', 'icp_qualifier', 'company_intel', 'contact_intel', 'buying_intent', 'recommendation'];

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [wsLoading, setWsLoading] = useState(true);
  const [phase, setPhase] = useState('input');
  const [completedAgents, setCompletedAgents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState({});
  const [runError, setRunError] = useState('');

  useEffect(() => {
    setPhase('input');
    setCompletedAgents([]);
    setRecommendations([]);
    setSummary({});
    setRunError('');
    setWorkspace(null);

    if (workspaceId === 'new') { setWsLoading(false); return; }

    setWsLoading(true);
    wsApi.get(workspaceId)
      .then(ws => { setWorkspace(ws); return discoveryApi.results(workspaceId); })
      .then(data => {
        if (data.companies?.length > 0) {
          const recs = data.companies.map(c => {
            try { return typeof c.data === 'string' ? JSON.parse(c.data) : c.data; }
            catch { return { company: c.name, intent_score: c.score || 0, contacts: [] }; }
          });
          setRecommendations(recs);
          setCompletedAgents(AGENTS);
          setPhase('done');
        }
      })
      .catch(() => {})
      .finally(() => setWsLoading(false));
  }, [workspaceId]);

  const runPipeline = async (config) => {
    setPhase('running');
    setCompletedAgents([]);
    setRunError('');

    let wsId = workspaceId;
    if (workspaceId === 'new') {
      try {
        const ws = await wsApi.create(`${config.industry || 'Discovery'} — ${new Date().toLocaleDateString()}`);
        wsId = ws.id;
        setWorkspace(ws);
        navigate(`/workspace/${ws.id}`, { replace: true });
      } catch (err) {
        setRunError(err.message);
        setPhase('input');
        return;
      }
    }

    let agentIdx = 0;
    const ticker = setInterval(() => {
      if (agentIdx < AGENTS.length - 1) {
        agentIdx++;
        setCompletedAgents(AGENTS.slice(0, agentIdx));
      }
    }, 8000);

    try {
      const result = await discoveryApi.start(wsId, config);
      clearInterval(ticker);
      setCompletedAgents(AGENTS);
      setRecommendations(result.recommendations || []);
      setSummary(result.summary || {});
      setPhase('done');
    } catch (err) {
      clearInterval(ticker);
      setRunError(err.message);
      setPhase('input');
    }
  };

  if (wsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center page-content">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7a4a6a, #935073)', boxShadow: '0 0 20px rgba(147,80,115,0.4)' }}>
            <Loader2 className="w-5 h-5 spin text-[#f0e6e0]" />
          </div>
          <span className="text-sm text-[#9a8a92]">Loading workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto page-content">
      <div className="max-w-4xl mx-auto p-8 space-y-6">

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {phase === 'running' && <Loader2 className="w-3.5 h-3.5 spin text-[#935073]" />}
              {phase === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-[#b5c9a8]" />}
              {phase === 'input' && <Sparkles className="w-3.5 h-3.5 text-[#935073]" />}
              <span className="text-xs font-semibold uppercase tracking-widest text-[#9a8a92]">
                {phase === 'input' && 'Configure'}
                {phase === 'running' && 'Processing'}
                {phase === 'done' && 'Results'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              <span className="text-[#f0e6e0]">
                {workspace?.name || 'New discovery'}
              </span>
            </h1>
            <p className="text-[15px] mt-1 text-[#b098a8]">
              {phase === 'input' && 'Describe your ideal customer to start AI discovery'}
              {phase === 'running' && 'Agents are searching, qualifying and enriching — 60–90 seconds'}
              {phase === 'done' && `${recommendations.length} companies found and qualified`}
            </p>
          </div>

          {phase === 'done' && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setPhase('input')}
              className="btn-outline text-sm flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> New run
            </motion.button>
          )}
        </motion.div>

        <AnimatePresence>
          {runError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)', color: '#f87171' }}>
              {runError}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <ICPForm onSubmit={runPipeline} loading={false} />
            </motion.div>
          )}

          {phase === 'running' && (
            <motion.div key="running" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
              className="space-y-4">
              <AgentProgress completedAgents={completedAgents} isRunning={true} />
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                className="text-center text-xs py-3 rounded-xl"
                style={{
                  color: '#9a8a92',
                  background: 'rgba(147,80,115,0.05)',
                  border: '1px solid rgba(147,80,115,0.08)',
                }}>
                🤖 The pipeline searches the web, enriches company data, and finds contacts in real time
              </motion.div>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
              className="space-y-6">
              <AgentProgress completedAgents={AGENTS} isRunning={false} />
              <ResultsCards recommendations={recommendations} summary={summary} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'done' && recommendations.length > 0 && (
        <ResultsChatbot recommendations={recommendations} summary={summary} />
      )}
    </div>
  );
}