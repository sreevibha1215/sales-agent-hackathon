// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Trash2, LayoutDashboard, LogOut, Loader2, MessageSquare } from 'lucide-react';
import { workspaces as wsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const location = useLocation();
  const [wsList, setWsList] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    wsApi.list().then(setWsList).catch(() => {});
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const ws = await wsApi.create(newName.trim());
      setWsList(prev => [ws, ...prev]);
      setNewName('');
      setShowInput(false);
      navigate(`/workspace/${ws.id}`);
    } finally {
      setCreating(false);
    }
  };

  const remove = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this workspace?')) return;
    await wsApi.delete(id);
    setWsList(prev => prev.filter(w => w.id !== id));
    if (workspaceId === id) navigate('/');
  };

  const isDashboard = location.pathname === '/';

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen relative"
      style={{
        background: 'linear-gradient(160deg, #251a28 0%, #1f1522 100%)',
        borderRight: '1px solid rgba(147, 80, 115, 0.15)',
      }}>

      <div className="relative p-5" style={{ borderBottom: '1px solid rgba(147, 80, 115, 0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7a4a6a, #935073)',
              boxShadow: '0 2px 16px rgba(147, 80, 115, 0.35)',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f0e6e0" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-[#f0e6e0]">
              LeadSense <span className="text-gradient">AI</span>
            </div>
            <div className="text-[10px] font-medium tracking-wider uppercase text-[#9a8a92]">
              Discovery Platform
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 pb-2">
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          className={`sidebar-item w-full ${isDashboard ? 'active' : ''}`}>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="font-medium">Dashboard</span>
        </motion.button>
      </div>

      <div className="mx-3 divider" />

      <div className="flex-1 overflow-y-auto px-3 pt-3">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[rgba(147,80,115,0.5)]">
            Workspaces
          </span>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowInput(v => !v)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors text-[#9a8a92] hover:text-[#f0e6e0]"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,80,115,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-3 overflow-hidden">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setShowInput(false); }}
                placeholder="Workspace name…"
                className="input-base text-xs py-2 mb-2"
              />
              <div className="flex gap-1.5">
                <button onClick={create} disabled={creating || !newName.trim()}
                  className="btn-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1">
                  {creating ? <Loader2 className="w-3 h-3 spin" /> : null}
                  Create
                </button>
                <button onClick={() => setShowInput(false)} className="btn-secondary text-xs py-1.5 px-2">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-0.5">
          <AnimatePresence initial={false}>
            {wsList.map((ws, i) => {
              const isActive = workspaceId === ws.id;
              const isHovered = hoveredId === ws.id;
              return (
                <motion.div
                  key={ws.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12, height: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => navigate(`/workspace/${ws.id}`)}
                  onMouseEnter={() => setHoveredId(ws.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`sidebar-item group relative ${isActive ? 'active' : ''}`}>
                  {isActive && (
                    <motion.div layoutId="active-bar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                      style={{ background: 'linear-gradient(180deg, #c4a0b8, #935073)' }} />
                  )}
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                  <span className="flex-1 truncate text-[15px] font-medium">{ws.name}</span>
                  {ws.lead_count > 0 && !isHovered && (
                    <span className="text-[12px] px-2 py-1 rounded-full shrink-0 font-semibold"
                      style={{ background: 'rgba(147,80,115,0.15)', color: '#d4c0c8', border: '1px solid rgba(147,80,115,0.2)' }}>
                      {ws.lead_count}
                    </span>
                  )}
                  {isHovered && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={e => remove(e, ws.id)}
                      className="shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors text-[#8a7a80] hover:text-[#e06050]">
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {wsList.length === 0 && !showInput && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 px-2">
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(147,80,115,0.08)', border: '1px solid rgba(147,80,115,0.1)' }}>
                <MessageSquare className="w-4 h-4 text-[#9a8a92]" />
              </div>
              <p className="text-[13px] mb-2 text-[#9a8a92]">No workspaces yet</p>
              <button onClick={() => setShowInput(true)} className="text-[13px] font-semibold text-[#c4a0b8]">
                + Create one
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-3" style={{ borderTop: '1px solid rgba(147, 80, 115, 0.1)' }}>
        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7a4a6a, #935073)',
              color: '#f0e6e0',
            }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate text-[#f0e6e0]">
              {user?.email?.split('@')[0]}
            </div>
            <div className="text-[12px] truncate text-[#9a8a92]">
              {user?.email}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 text-[#8a7a80] hover:text-[#e06050]">
            <LogOut className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}