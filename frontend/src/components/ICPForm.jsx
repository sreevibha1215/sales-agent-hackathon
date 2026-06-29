// src/components/ICPForm.jsx
import { useState } from 'react';
import { config as configApi } from '../api/client';
import { Sparkles, Loader2, AlertCircle, ChevronDown, ChevronUp, X, Wand2, Rocket, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EXAMPLE_PROMPTS = [
  { label: 'SaaS CRM', text: 'Find SaaS companies in the US with 50-500 employees that might need a CRM. Target VP of Sales and CROs.' },
  { label: 'HR Software', text: 'We sell HR software to mid-size manufacturing firms in Germany. Looking for HR Managers and Operations Directors.' },
  { label: 'Fintech', text: 'Find fintech startups in India that recently raised funding. Target CTOs and Head of Engineering.' },
];

// ✅ NEW: Guided tips for users
const GUIDED_TIPS = [
  { icon: '🎯', label: 'Target industry', example: 'SaaS, Fintech, Manufacturing' },
  { icon: '📍', label: 'Target geography', example: 'India, USA, Europe' },
  { icon: '👥', label: 'Company size', example: '50-500 employees' },
  { icon: '👤', label: 'Target personas', example: 'VP of Sales, CRO, CTO' },
  { icon: '📦', label: 'Product/offering', example: 'CRM Software, AI Platform' },
  { icon: '🔧', label: 'Tech stack signals', example: 'Salesforce, AWS, HubSpot' },
  { icon: '🚀', label: 'Buying triggers', example: 'funding, hiring, expansion' },
];

const FORM_FIELDS = [
  { key: 'industry',      label: 'Industry',      placeholder: 'e.g. SaaS, Manufacturing',    type: 'text' },
  { key: 'geography',     label: 'Geography',     placeholder: 'e.g. United States, Germany', type: 'text' },
  { key: 'min_employees', label: 'Min employees', placeholder: '50',                           type: 'number' },
  { key: 'max_employees', label: 'Max employees', placeholder: '500',                          type: 'number' },
];

function TagInput({ label, values, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9a7da8' }}>
        {label}
      </label>
      <div
        className="flex flex-wrap gap-1.5 p-3 rounded-xl min-h-[48px] transition-all"
        style={{ background: 'rgba(18,9,21,0.6)', border: '1px solid rgba(147,80,115,0.2)' }}
        onClick={e => e.currentTarget.querySelector('input')?.focus()}>
        <AnimatePresence>
          {values.map(v => (
            <motion.span
              key={v}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(147,80,115,0.2)', color: '#F6DBC0', border: '1px solid rgba(147,80,115,0.35)' }}>
              {v}
              <button onClick={() => onChange(values.filter(x => x !== v))} style={{ color: '#9a7da8' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = '#9a7da8'}>
                <X className="w-2.5 h-2.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={values.length === 0 ? 'Type & press Enter…' : ''}
          className="bg-transparent text-xs outline-none min-w-[100px] flex-1"
          style={{ color: '#F8F4E9' }}
        />
      </div>
    </div>
  );
}

export default function ICPForm({ onSubmit, loading }) {
  const [prompt, setPrompt]             = useState('');
  const [extracting, setExtracting]     = useState(false);
  const [extractError, setExtractError] = useState('');
  const [formVisible, setFormVisible]   = useState(false);
  const [focused, setFocused]           = useState(false);
  const [showTips, setShowTips]         = useState(true); // ✅ NEW
  const [form, setForm] = useState({
    industry: '', geography: '', min_employees: '', max_employees: '',
    personas: [], triggers: [], product: '', tech_stack: [],
  });

  const extractFromNLP = async () => {
    if (!prompt.trim()) return;
    setExtracting(true);
    setExtractError('');
    try {
      const res = await configApi.extract(prompt);
      if (res.config) {
        const c = res.config;
        setForm({
          industry:      c.industry || '',
          geography:     c.geography || '',
          min_employees: c.min_employees || '',
          max_employees: c.max_employees || '',
          personas:      Array.isArray(c.personas) ? c.personas : [],
          triggers:      Array.isArray(c.triggers) ? c.triggers : [],
          product:       c.product || '',
          tech_stack:    Array.isArray(c.tech_stack) ? c.tech_stack : [],
        });
        setFormVisible(true);
      }
    } catch (err) {
      setExtractError(typeof err.message === 'string' ? err.message : 'Backend error — fill the form manually.');
      setFormVisible(true);
    } finally {
      setExtracting(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRun = () => {
    onSubmit({ ...form, min_employees: parseInt(form.min_employees) || 50, max_employees: parseInt(form.max_employees) || 500 });
  };

  return (
    <div className="space-y-5">
      {/* NLP Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(42,24,48,0.95), rgba(28,16,32,0.95))',
          border: focused ? '1px solid rgba(147,80,115,0.5)' : '1px solid rgba(147,80,115,0.2)',
          boxShadow: focused ? '0 0 32px rgba(147,80,115,0.15)' : '0 4px 24px rgba(0,0,0,0.3)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #935073, transparent)' }} />

        <div className="flex items-center gap-2.5 mb-4 relative">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #502D55, #935073)', boxShadow: '0 0 12px rgba(147,80,115,0.4)' }}>
            <Wand2 className="w-4 h-4" style={{ color: '#F8F4E9' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#F8F4E9' }}>Describe your ideal customer</h3>
            <p className="text-[11px]" style={{ color: '#9a7da8' }}>Plain English — AI extracts the ICP config</p>
          </div>
        </div>

        {/* ✅ GUIDED TIPS - What to include */}
        <div className="mb-3">
          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: '#9a7da8' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F6DBC0'}
            onMouseLeave={e => e.currentTarget.style.color = '#9a7da8'}>
            <Info className="w-3.5 h-3.5" />
            {showTips ? 'Hide tips' : 'Show tips'} — what to include
            {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <AnimatePresence>
            {showTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  {GUIDED_TIPS.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                      style={{
                        background: 'rgba(147,80,115,0.06)',
                        border: '1px solid rgba(147,80,115,0.08)',
                      }}>
                      <span>{tip.icon}</span>
                      <span style={{ color: '#b098a8' }}>{tip.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={3}
          placeholder="Describe your perfect customer"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none leading-relaxed"
          style={{
            background: 'rgba(18,9,21,0.6)',
            border: '1px solid rgba(147,80,115,0.2)',
            color: '#F8F4E9',
            lineHeight: '1.6',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(147,80,115,0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(147,80,115,0.2)'}
        />

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(154,125,168,0.5)', lineHeight: '26px' }}>Try:</span>
          {EXAMPLE_PROMPTS.map((p, i) => (
            <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setPrompt(p.text)}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all"
              style={{ background: 'rgba(147,80,115,0.08)', color: '#9a7da8', border: '1px solid rgba(147,80,115,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(147,80,115,0.18)'; e.currentTarget.style.color = '#F6DBC0'; e.currentTarget.style.borderColor = 'rgba(147,80,115,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(147,80,115,0.08)'; e.currentTarget.style.color = '#9a7da8'; e.currentTarget.style.borderColor = 'rgba(147,80,115,0.2)'; }}>
              {p.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {extractError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 mt-3 rounded-xl px-3 py-2.5 text-xs overflow-hidden"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {extractError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2.5 mt-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={extractFromNLP} disabled={!prompt.trim() || extracting}
            className="btn-primary text-sm">
            {extracting ? <><Loader2 className="w-4 h-4 spin" />Extracting…</> : <><Sparkles className="w-4 h-4" />Extract & configure</>}
          </motion.button>
          <button onClick={() => setFormVisible(v => !v)} className="btn-ghost text-sm flex items-center gap-1.5">
            {formVisible ? <><ChevronUp className="w-3.5 h-3.5" />Hide form</> : <><ChevronDown className="w-3.5 h-3.5" />Edit manually</>}
          </button>
        </div>
      </motion.div>

      {/* ICP Config Form */}
      <AnimatePresence>
        {formVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden">
            <div className="rounded-2xl p-6 space-y-5"
              style={{
                background: 'linear-gradient(145deg, rgba(42,24,48,0.9), rgba(28,16,32,0.9))',
                border: '1px solid rgba(147,80,115,0.15)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: 'rgba(147,80,115,0.15)', border: '1px solid rgba(147,80,115,0.25)', color: '#F6DBC0' }}>✎</div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#F8F4E9' }}>Review & refine ICP config</h3>
                  <p className="text-[11px]" style={{ color: '#9a7da8' }}>Edit extracted values or fill manually</p>
                </div>
              </div>
              <div className="divider" />
              <div className="grid grid-cols-2 gap-4">
                {FORM_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9a7da8' }}>{f.label}</label>
                    <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder} className="input-base text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9a7da8' }}>Product / offering</label>
                <input value={form.product} onChange={e => set('product', e.target.value)}
                  placeholder="e.g. CRM Software, HR Platform" className="input-base text-sm" />
              </div>
              <div className="space-y-4">
                <TagInput label="Target personas" values={form.personas} onChange={v => set('personas', v)} />
                <TagInput label="Buying triggers" values={form.triggers} onChange={v => set('triggers', v)} />
                <TagInput label="Tech stack signals" values={form.tech_stack} onChange={v => set('tech_stack', v)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run button */}
      <AnimatePresence>
        {formVisible && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
              onClick={handleRun}
              disabled={loading || (!form.industry && !form.geography)}
              className="w-full relative rounded-2xl py-4 text-sm font-bold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #502D55 0%, #935073 50%, #7d4464 100%)',
                color: '#F8F4E9',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(147,80,115,0.45), 0 0 48px rgba(147,80,115,0.2)',
                letterSpacing: '-0.01em',
              }}>
              {!loading && (
                <div className="absolute inset-0 opacity-20"
                  style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 2.5s ease-in-out infinite' }} />
              )}
              <span className="relative flex items-center justify-center gap-2.5">
                {loading ? <><Loader2 className="w-5 h-5 spin" />Running agents…</> : <><Rocket className="w-5 h-5" />Launch Discovery Pipeline</>}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}