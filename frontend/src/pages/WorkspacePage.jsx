// src/pages/WorkspacePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaces as wsApi, discovery as discoveryApi } from '../api/client';
import ICPForm from '../components/ICPForm';
import AgentProgress from '../components/AgentProgress';
import ResultsCards from '../components/ResultsCards';
import ResultsChatbot from '../components/ResultsChatbot';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [wsLoading, setWsLoading] = useState(true);

  // Pipeline state
  const [phase, setPhase] = useState('input'); // 'input' | 'running' | 'done'
  const [completedAgents, setCompletedAgents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState({});
  const [runError, setRunError] = useState('');

  // Fake streaming progress while waiting for backend (pipeline takes 30-90s)
  const AGENTS = ['market_intel', 'icp_qualifier', 'company_intel', 'contact_intel', 'buying_intent', 'recommendation'];

  useEffect(() => {
    if (workspaceId === 'new') {
      setWsLoading(false);
      return;
    }
    wsApi.get(workspaceId)
      .then(ws => {
        setWorkspace(ws);
        // Check if existing results
        return discoveryApi.results(workspaceId);
      })
      .then(data => {
        if (data.companies?.length > 0) {
          // Parse company data from DB
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

    // If "new", create workspace first
    if (workspaceId === 'new') {
      try {
        const industry = config.industry || 'Discovery';
        const ws = await wsApi.create(`${industry} — ${new Date().toLocaleDateString()}`);
        wsId = ws.id;
        setWorkspace(ws);
        navigate(`/workspace/${ws.id}`, { replace: true });
      } catch (err) {
        setRunError(err.message);
        setPhase('input');
        return;
      }
    }

    // Animate progress while API runs
    let agentIdx = 0;
    const ticker = setInterval(() => {
      if (agentIdx < AGENTS.length - 1) {
        agentIdx++;
        setCompletedAgents(AGENTS.slice(0, agentIdx));
      }
    }, 8000); // ~8s per agent step

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
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-400 spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-white">
              {workspace?.name || 'New discovery'}
            </h1>
            <p className="text-sm text-muted">
              {phase === 'input' && 'Describe your ideal customer to start discovery'}
              {phase === 'running' && 'Agents are running — this takes 1–2 minutes'}
              {phase === 'done' && `${recommendations.length} companies found`}
            </p>
          </div>
          {phase === 'done' && (
            <button onClick={() => setPhase('input')}
              className="ml-auto btn-ghost text-sm flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> New run
            </button>
          )}
        </div>

        {/* Error */}
        {runError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {runError}
          </div>
        )}

        {/* Phase: Input */}
        {phase === 'input' && (
          <ICPForm onSubmit={runPipeline} loading={false} />
        )}

        {/* Phase: Running */}
        {phase === 'running' && (
          <div className="space-y-4">
            <AgentProgress completedAgents={completedAgents} isRunning={true} />
            <div className="text-center text-xs text-muted animate-pulse">
              The pipeline searches the web, enriches company data, and finds contacts in real time — usually 60–90 seconds
            </div>
          </div>
        )}

        {/* Phase: Done */}
        {phase === 'done' && (
          <>
            <AgentProgress completedAgents={AGENTS} isRunning={false} />
            <ResultsCards recommendations={recommendations} summary={summary} />
          </>
        )}
      </div>

      {/* Floating chatbot — only when results are available */}
      {phase === 'done' && recommendations.length > 0 && (
        <ResultsChatbot recommendations={recommendations} summary={summary} />
      )}
    </div>
  );
}
