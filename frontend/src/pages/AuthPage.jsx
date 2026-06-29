// src/pages/AuthPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FEATURES = [
  { icon: '🎯', text: 'AI-powered ICP qualification' },
  { icon: '🔍', text: 'Real-time company enrichment' },
  { icon: '👤', text: 'Decision-maker discovery' },
  { icon: '⚡', text: 'Buying intent scoring' },
];

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // ✅ NEW
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Password match validation
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

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
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#1f1522' }}>

      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(147,80,115,0.15) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(240,230,224,1) 1px, transparent 1px), linear-gradient(90deg, rgba(240,230,224,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />

        <div className="relative z-10 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7a4a6a, #935073)',
                boxShadow: '0 2px 24px rgba(147, 80, 115, 0.35)',
              }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f0e6e0" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#f0e6e0]">LeadSense AI</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h1 className="text-5xl font-extrabold leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
              <span className="text-[#f0e6e0]">Find your</span>
              <br />
              <span className="text-gradient">ideal customers</span>
              <br />
              <span className="text-[#f0e6e0]">with AI</span>
            </h1>
            <p className="text-base leading-relaxed mb-8 text-[#b098a8]">
              Describe your ideal customer in plain English.
              Our agents find, qualify, and enrich prospects automatically.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: 'rgba(147,80,115,0.12)', border: '1px solid rgba(147,80,115,0.15)' }}>
                  {f.icon}
                </div>
                <span className="text-sm font-medium text-[#d4c8c0]">{f.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-10 pt-8 flex items-center gap-8" style={{ borderTop: '1px solid rgba(147,80,115,0.15)' }}>
            {[
              { val: '6+', label: 'AI Agents' },
              { val: '< 2min', label: 'Per discovery' },
              { val: '100%', label: 'Automated' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-extrabold text-[#c4a0b8]">{s.val}</div>
                <div className="text-xs mt-0.5 text-[#9a8a92]">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(147,80,115,0.08) 0%, transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative w-full max-w-md">

          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7a4a6a, #935073)', boxShadow: '0 2px 20px rgba(147,80,115,0.3)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f0e6e0" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#f0e6e0]">LeadSense AI</span>
          </div>

          <div className="rounded-3xl p-8"
            style={{
              background: 'rgba(44, 30, 48, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(147, 80, 115, 0.12)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            }}>

            <div className="mb-7">
              <h2 className="text-2xl font-bold mb-1 text-[#f0e6e0]">
                {mode === 'login' ? 'Welcome back' : 'Get started'}
              </h2>
              <p className="text-sm text-[#b098a8]">
                {mode === 'login' ? 'Sign in to your LeadSense workspace' : 'Create your free account today'}
              </p>
            </div>

            <div className="flex rounded-xl p-1 mb-6"
              style={{ background: 'rgba(30,18,34,0.5)', border: '1px solid rgba(147,80,115,0.1)' }}>
              {['login', 'signup'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setConfirmPassword(''); }}
                  className="flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 relative overflow-hidden">
                  {mode === m && (
                    <motion.div layoutId="tab-indicator"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'linear-gradient(135deg, #7a4a6a, #935073)' }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }} />
                  )}
                  <span className="relative z-10" style={{ color: mode === m ? '#f0e6e0' : '#9a8a92' }}>
                    {m === 'login' ? 'Sign in' : 'Sign up'}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-[#9a8a92]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8a92]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required className="input-base pl-10" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-[#9a8a92]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8a92]" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={6} className="input-base pl-10" />
                </div>
              </div>

              {/* ✅ CONFIRM PASSWORD - Only show on signup */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-[#9a8a92]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8a92]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      minLength={6}
                      className="input-base pl-10"
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-400 mt-1">⚠️ Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-green-400 mt-1">✅ Passwords match</p>
                  )}
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)', color: '#f87171' }}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading}
                className="btn-primary w-full mt-2 py-3 text-sm">
                {loading ? <><Loader2 className="w-4 h-4 spin" />Authenticating…</>
                  : <>{mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="divider my-5" />

            <p className="text-center text-xs text-[#9a8a92]">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setConfirmPassword(''); }}
                className="font-semibold transition-colors text-[#c4a0b8] hover:text-[#f0e6e0]">
                {mode === 'login' ? 'Sign up free →' : 'Sign in →'}
              </button>
            </p>
          </div>

          <p className="text-center text-[11px] mt-4 text-[rgba(147,80,115,0.3)]">
            Powered by LangGraph · Groq · Tavily · Hunter.io
          </p>
        </motion.div>
      </div>
    </div>
  );
}