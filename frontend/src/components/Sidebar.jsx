// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Trash2, LayoutDashboard, Zap, LogOut, Loader2, MessageSquare } from 'lucide-react';
import { workspaces as wsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const location = useLocation();
  const [wsList, setWsList] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);

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
    <aside className="w-60 shrink-0 bg-panel border-r border-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600/20 border border-brand-600/30 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">ProspectAI</div>
            <div className="text-[10px] text-muted">Discovery Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="p-2 border-b border-border">
        <button onClick={() => navigate('/')}
          className={`sidebar-item w-full ${isDashboard ? 'active' : ''}`}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
      </div>

      {/* Workspaces */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Workspaces</span>
          <button onClick={() => setShowInput(true)}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-muted hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New workspace input */}
        {showInput && (
          <div className="px-1 mb-2">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setShowInput(false); }}
              placeholder="Workspace name..."
              className="input-base text-xs py-2"
            />
            <div className="flex gap-1 mt-1.5">
              <button onClick={create} disabled={creating || !newName.trim()}
                className="flex-1 btn-primary text-xs py-1.5 flex items-center justify-center gap-1">
                {creating ? <Loader2 className="w-3 h-3 spin" /> : null}
                Create
              </button>
              <button onClick={() => setShowInput(false)}
                className="btn-ghost text-xs py-1.5 px-2">Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-0.5">
          {wsList.map(ws => (
            <div key={ws.id}
              onClick={() => navigate(`/workspace/${ws.id}`)}
              className={`sidebar-item group ${workspaceId === ws.id ? 'active' : ''}`}>
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 truncate text-xs">{ws.name}</span>
              {ws.lead_count > 0 && (
                <span className="text-[10px] bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded-full shrink-0">
                  {ws.lead_count}
                </span>
              )}
              <button onClick={e => remove(e, ws.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {wsList.length === 0 && !showInput && (
            <p className="text-xs text-muted px-2 py-3 text-center">
              No workspaces yet.<br />
              <button onClick={() => setShowInput(true)} className="text-brand-400 hover:underline mt-1">
                Create one
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white truncate">{user?.email}</div>
          </div>
          <button onClick={logout} className="btn-ghost p-1.5" title="Log out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
