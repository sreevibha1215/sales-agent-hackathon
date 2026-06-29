// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaces as wsApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Briefcase, Target, Plus, ArrowRight, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-600/10 border-brand-600/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <div className="card-base flex items-start gap-4">
      <div className={`p-2.5 rounded-lg border ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm font-medium text-white/80 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <div className="font-medium text-white">{payload[0].payload.name}</div>
      <div className="text-brand-400 mt-1">{payload[0].value} leads</div>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [wsList, setWsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wsApi.list().then(setWsList).finally(() => setLoading(false));
  }, []);

  const totalLeads = wsList.reduce((s, w) => s + (w.lead_count || 0), 0);
  const chartData = wsList
    .filter(w => w.lead_count > 0)
    .slice(0, 8)
    .map(w => ({ name: w.name.length > 14 ? w.name.slice(0, 14) + '…' : w.name, leads: w.lead_count }));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Overview of your discovery workspaces</p>
        </div>
        <button onClick={() => navigate('/workspace/new')}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New workspace
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Workspaces" value={wsList.length} sub="total created" color="brand" />
        <StatCard icon={Target} label="Leads found" value={totalLeads} sub="across all workspaces" color="green" />
        <StatCard icon={Users} label="Avg per run" value={wsList.length ? Math.round(totalLeads / wsList.length) : 0} sub="companies per workspace" color="purple" />
        <StatCard icon={TrendingUp} label="Active" value={wsList.filter(w => w.lead_count > 0).length} sub="workspaces with results" color="amber" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card-base">
          <h2 className="text-sm font-semibold text-white mb-4">Leads by workspace</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(67,97,249,0.08)' }} />
              <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${230 + i * 8}, 80%, ${55 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workspace list */}
      <div className="card-base">
        <h2 className="text-sm font-semibold text-white mb-4">Recent workspaces</h2>
        {loading ? (
          <div className="text-center py-8 text-muted text-sm">Loading…</div>
        ) : wsList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm mb-3">No workspaces yet. Start your first discovery run.</p>
            <button onClick={() => navigate('/workspace/new')} className="btn-primary text-sm">
              Create workspace
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {wsList.map(ws => (
              <div key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-white/5 cursor-pointer border border-transparent hover:border-border transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-600/15 border border-brand-600/20 rounded-lg flex items-center justify-center text-brand-400 text-xs font-bold">
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{ws.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-muted" />
                      <span className="text-[11px] text-muted">
                        {new Date(ws.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ws.lead_count > 0 ? (
                    <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {ws.lead_count} leads
                    </span>
                  ) : (
                    <span className="badge bg-surface text-muted border border-border">no results</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
