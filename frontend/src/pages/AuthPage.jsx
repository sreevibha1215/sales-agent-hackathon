// src/pages/AuthPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#4361f9 1px, transparent 1px), linear-gradient(90deg, #4361f9 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600/20 border border-brand-600/30 rounded-2xl mb-4">
            <Zap className="w-6 h-6 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ProspectAI</h1>
          <p className="text-muted text-sm mt-1">B2B Customer Discovery Platform</p>
        </div>

        {/* Card */}
        <div className="card-base shadow-2xl shadow-black/40">
          {/* Tab toggle */}
          <div className="flex bg-surface rounded-lg p-1 mb-6">
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${mode === m ? 'bg-brand-600 text-white shadow' : 'text-muted hover:text-white'}`}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" required
                  className="input-base pl-9" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="input-base pl-9" />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader2 className="w-4 h-4 spin" /> : null}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-xs text-muted mt-4">
              No account?{' '}
              <button onClick={() => setMode('signup')} className="text-brand-400 hover:text-brand-300">
                Sign up free
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
