// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaces as wsApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Briefcase, Target, Plus, ArrowRight, Clock, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function StatCard({ icon: Icon, label, value, sub, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative rounded-2xl p-5 overflow-hidden cursor-default"
      style={{
        background: 'rgba(44, 30, 48, 0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(147, 80, 115, 0.12)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
      }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: `linear-gradient(135deg, ${gradient.split(',')[0].replace('linear-gradient(135deg,', '').trim()}, transparent)`,
          border: '1px solid rgba(147,80,115,0.2)',
        }}>
        <Icon className="w-5 h-5 text-[#f0e6e0]" />
      </div>
      <div className="text-3xl font-extrabold mb-1" style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: '-0.03em',
      }}>
        {value}
      </div>
      <div className="text-[15px] font-semibold text-[#f0e6e0]">{label}</div>
      {sub && <div className="text-[13px] mt-0.5 text-[#9a8a92]">{sub}</div>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs"
      style={{
        background: 'rgba(44, 30, 48, 0.9)',
        border: '1px solid rgba(147,80,115,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
      <div className="font-bold mb-1 text-[#f0e6e0]">{payload[0].payload.name}</div>
      <div className="font-semibold text-[#c4a0b8]">{payload[0].value} leads</div>
    </div>
  );
};

function WorkspaceRow({ ws, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-xl cursor-pointer group transition-all"
      style={{ border: '1px solid transparent' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(147,80,115,0.07)';
        e.currentTarget.style.borderColor = 'rgba(147,80,115,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${280 + index * 15}, 40%, 30%), hsl(${300 + index * 15}, 40%, 40%))`,
            border: '1px solid rgba(147,80,115,0.3)',
            color: '#d4c0c8',
          }}>
          {ws.name[0]?.toUpperCase()}
        </div>
        <div>
          <div className="text-[15px] font-semibold text-[#f0e6e0]">{ws.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3 text-[#9a8a92]" />
            <span className="text-[13px] text-[#9a8a92]">
              {new Date(ws.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {ws.lead_count > 0 ? (
          <span className="text-[13px] font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(181,201,168,0.1)',
              color: '#b5c9a8',
              border: '1px solid rgba(181,201,168,0.2)',
            }}>
            {ws.lead_count} leads
          </span>
        ) : (
          <span className="text-[13px] px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(147,80,115,0.08)',
              color: '#9a8a92',
              border: '1px solid rgba(147,80,115,0.1)',
            }}>
            no results
          </span>
        )}
        <motion.div whileHover={{ x: 3 }} className="text-[#9a8a92]">
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </div>
    </motion.div>
  );
}

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
    .map(w => ({
      name: w.name.length > 14 ? w.name.slice(0, 14) + '…' : w.name,
      leads: w.lead_count,
    }));

  const CHART_COLORS = ['#935073', '#7d4464', '#a85e82', '#c07090', '#502D55', '#6b3d72', '#8a5090', '#c4a0b8'];

  return (
    <div className="flex-1 overflow-y-auto page-content">
      <div className="max-w-5xl mx-auto p-8 space-y-8">

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#935073]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#9a8a92]">
                Overview
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              <span className="text-[#f0e6e0]">Your </span>
              <span className="text-gradient">Discovery Hub</span>
            </h1>
            <p className="text-[15px] mt-1.5 text-[#b098a8]">
              {wsList.length > 0
                ? `${wsList.length} workspace${wsList.length > 1 ? 's' : ''} · ${totalLeads} total leads`
                : 'Start your first B2B discovery run'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/workspace/new')}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            New workspace
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Workspaces" value={wsList.length}
            sub="total created" delay={0.05}
            gradient="linear-gradient(135deg, #935073, #502D55)" />
          <StatCard icon={Target} label="Leads found" value={totalLeads}
            sub="across all runs" delay={0.1}
            gradient="linear-gradient(135deg, #b5c9a8, #7aaa6a)" />
          <StatCard icon={Users} label="Avg per run"
            value={wsList.length ? Math.round(totalLeads / wsList.length) : 0}
            sub="companies per workspace" delay={0.15}
            gradient="linear-gradient(135deg, #c4a0b8, #935073)" />
          <StatCard icon={TrendingUp} label="Active"
            value={wsList.filter(w => w.lead_count > 0).length}
            sub="workspaces with results" delay={0.2}
            gradient="linear-gradient(135deg, #f6dbc0, #c4a0b8)" />
        </div>

        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(44, 30, 48, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(147, 80, 115, 0.12)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
            }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-[#f0e6e0]">Leads by workspace</h2>
                <p className="text-[13px] mt-0.5 text-[#9a8a92]">Companies discovered per run</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(147,80,115,0.15)',
                  color: '#c4a0b8',
                  border: '1px solid rgba(147,80,115,0.25)',
                }}>
                <Zap className="w-3 h-3" />
                {chartData.reduce((s, d) => s + d.leads, 0)} total
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#9a8a92', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9a8a92', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(147,80,115,0.06)', radius: 8 }} />
                <Bar dataKey="leads" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(44, 30, 48, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(147, 80, 115, 0.12)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
          }}>

          <div className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(147,80,115,0.1)' }}>
            <h2 className="text-base font-bold text-[#f0e6e0]">Recent workspaces</h2>
            {wsList.length > 0 && <span className="text-[13px] text-[#9a8a92]">{wsList.length} total</span>}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl">
                    <div className="w-9 h-9 rounded-xl shimmer" style={{ background: 'rgba(147,80,115,0.1)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full shimmer w-1/3" style={{ background: 'rgba(147,80,115,0.1)' }} />
                      <div className="h-2.5 rounded-full shimmer w-1/4" style={{ background: 'rgba(147,80,115,0.07)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : wsList.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center float"
                  style={{
                    background: 'linear-gradient(135deg, rgba(80,45,85,0.4), rgba(147,80,115,0.2))',
                    border: '1px solid rgba(147,80,115,0.3)',
                    boxShadow: '0 0 24px rgba(147,80,115,0.15)',
                  }}>
                  <Sparkles className="w-7 h-7 text-[#f6dbc0]" />
                </div>
                <h3 className="text-base font-bold mb-2 text-[#f0e6e0]">No workspaces yet</h3>
                <p className="text-sm mb-5 text-[#9a8a92]">Start your first AI-powered discovery run</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/workspace/new')}
                  className="btn-primary text-sm">
                  <Plus className="w-4 h-4" /> Create workspace
                </motion.button>
              </motion.div>
            ) : (
              <div className="divide-y divide-[rgba(147,80,115,0.08)]">
                {wsList.map((ws, i) => (
                  <WorkspaceRow key={ws.id} ws={ws} index={i} onClick={() => navigate(`/workspace/${ws.id}`)} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}