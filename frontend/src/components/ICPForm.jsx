// src/components/ICPForm.jsx
import { useState } from 'react';
import { config as configApi } from '../api/client';
import { Sparkles, Loader2, AlertCircle, ChevronDown, ChevronUp, X, Plus } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  "Find SaaS companies in the US with 50-500 employees that might need a CRM. Target VP of Sales and CROs.",
  "We sell HR software to mid-size manufacturing firms in Germany. Looking for HR Managers and Operations Directors.",
  "Find fintech startups in India that recently raised funding. Target CTOs and Head of Engineering.",
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
      <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 bg-surface border border-border rounded-lg min-h-[40px]">
        {values.map(v => (
          <span key={v} className="badge bg-brand-600/15 text-brand-300 border border-brand-600/20 gap-1">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="hover:text-red-400">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder="Add & press Enter"
          className="bg-transparent text-xs text-white placeholder-muted outline-none min-w-[100px] flex-1"
        />
      </div>
    </div>
  );
}

export default function ICPForm({ onSubmit, loading }) {
  const [prompt, setPrompt] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [formVisible, setFormVisible] = useState(false);

  const [form, setForm] = useState({
    industry: '',
    geography: '',
    min_employees: '',
    max_employees: '',
    personas: [],
    triggers: [],
    product: '',
    tech_stack: [],
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
          industry: c.industry || '',
          geography: c.region || c.geography || '',
          min_employees: c.company_size === 'small' ? '10' : c.company_size === 'medium' ? '50' : c.company_size === 'enterprise' ? '500' : '',
          max_employees: c.company_size === 'small' ? '50' : c.company_size === 'medium' ? '500' : c.company_size === 'enterprise' ? '5000' : '',
          personas: c.target_role ? [c.target_role] : [],
          triggers: c.keywords || [],
          product: c.company_type || '',
          tech_stack: [],
        });
        setFormVisible(true);
      }
    } catch (err) {
      setExtractError(err.message);
      setFormVisible(true); // Still show form for manual entry
    } finally {
      setExtracting(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRun = () => {
    const config = {
      ...form,
      min_employees: parseInt(form.min_employees) || 50,
      max_employees: parseInt(form.max_employees) || 500,
    };
    onSubmit(config);
  };

  return (
    <div className="space-y-5">
      {/* NLP Input */}
      <div className="card-base">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Describe your ideal customer</h3>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Find B2B SaaS companies in the US with 50–500 employees that might need a CRM solution. Target VP of Sales and CROs."
          className="input-base resize-none text-sm leading-relaxed"
        />

        {/* Example prompts */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => setPrompt(p)}
              className="text-[10px] text-muted hover:text-brand-400 bg-surface hover:bg-brand-600/10 border border-border hover:border-brand-600/30 px-2 py-1 rounded-full transition-all">
              Example {i + 1}
            </button>
          ))}
        </div>

        {extractError && (
          <div className="flex items-start gap-2 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {extractError} — fill the form manually below.
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button onClick={extractFromNLP} disabled={!prompt.trim() || extracting}
            className="btn-primary text-sm flex items-center gap-2">
            {extracting ? <Loader2 className="w-4 h-4 spin" /> : <Sparkles className="w-4 h-4" />}
            {extracting ? 'Extracting…' : 'Extract & configure'}
          </button>
          <button onClick={() => setFormVisible(v => !v)}
            className="btn-ghost text-sm flex items-center gap-1">
            {formVisible ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {formVisible ? 'Hide' : 'Edit manually'}
          </button>
        </div>
      </div>

      {/* Editable ICP Form */}
      {formVisible && (
        <div className="card-base space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-5 h-5 bg-brand-600/20 rounded flex items-center justify-center text-brand-400 text-xs">✎</span>
            Review & refine ICP config
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Industry</label>
              <input value={form.industry} onChange={e => set('industry', e.target.value)}
                placeholder="e.g. SaaS, Manufacturing" className="input-base text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Geography</label>
              <input value={form.geography} onChange={e => set('geography', e.target.value)}
                placeholder="e.g. United States, Germany" className="input-base text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Min employees</label>
              <input type="number" value={form.min_employees} onChange={e => set('min_employees', e.target.value)}
                placeholder="50" className="input-base text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Max employees</label>
              <input type="number" value={form.max_employees} onChange={e => set('max_employees', e.target.value)}
                placeholder="500" className="input-base text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Product / offering</label>
            <input value={form.product} onChange={e => set('product', e.target.value)}
              placeholder="e.g. CRM Software, HR Platform" className="input-base text-sm" />
          </div>

          <TagInput label="Target personas (press Enter to add)"
            values={form.personas} onChange={v => set('personas', v)} />
          <TagInput label="Buying triggers (press Enter to add)"
            values={form.triggers} onChange={v => set('triggers', v)} />
          <TagInput label="Tech stack signals (press Enter to add)"
            values={form.tech_stack} onChange={v => set('tech_stack', v)} />
        </div>
      )}

      {/* Run button */}
      {formVisible && (
        <button onClick={handleRun} disabled={loading || (!form.industry && !form.geography)}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {loading ? <Loader2 className="w-5 h-5 spin" /> : null}
          {loading ? 'Running agents…' : '🚀 Run discovery pipeline'}
        </button>
      )}
    </div>
  );
}
