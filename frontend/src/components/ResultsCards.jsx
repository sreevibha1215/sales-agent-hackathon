// src/components/ResultsCards.jsx
import { useState } from 'react';
import {
  Building2, Users, MapPin, DollarSign, TrendingUp,
  Mail, Phone, Linkedin, ChevronDown, ChevronUp,
  ExternalLink, Zap, Globe, Calendar
} from 'lucide-react';

function ScoreBadge({ score }) {
  const color = score >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : score >= 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-red-400 bg-red-500/10 border-red-500/20';
  return (
    <span className={`badge border text-sm font-bold ${color}`}>
      {score}%
    </span>
  );
}

function ContactRow({ contact }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="w-7 h-7 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold shrink-0 mt-0.5">
        {contact.name?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{contact.name || 'Unknown'}</div>
        <div className="text-xs text-muted mt-0.5">{contact.title || contact.department || '—'}</div>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {contact.email && (
            <a href={`mailto:${contact.email}`}
              className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300">
              <Mail className="w-3 h-3" />{contact.email}
            </a>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Phone className="w-3 h-3" />{contact.phone}
            </span>
          )}
          {contact.linkedin && (
            <a href={contact.linkedin} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300">
              <Linkedin className="w-3 h-3" />LinkedIn
            </a>
          )}
        </div>
      </div>
      {contact.confidence && (
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
          {contact.confidence}% conf.
        </span>
      )}
    </div>
  );
}

function CompanyCard({ rec }) {
  const [expanded, setExpanded] = useState(false);

  const company = rec.company || rec.name || 'Unknown';
  const contacts = rec.contacts || [];
  const techStack = rec.tech_stack || [];
  const reasons = rec.icp_reasons || [];
  const nextActions = rec.next_actions || [];

  return (
    <div className="card-base hover:border-brand-600/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-brand-600/15 border border-brand-600/20 rounded-xl flex items-center justify-center text-brand-400 text-sm font-bold shrink-0">
            {company[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{company}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {rec.headquarters && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <MapPin className="w-3 h-3" />{rec.headquarters}
                </span>
              )}
              {rec.industry && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Building2 className="w-3 h-3" />{rec.industry}
                </span>
              )}
              {rec.employees > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Users className="w-3 h-3" />{rec.employees?.toLocaleString()} employees
                </span>
              )}
            </div>
          </div>
        </div>
        <ScoreBadge score={rec.intent_score || 0} />
      </div>

      {/* Description */}
      {rec.description && (
        <p className="text-sm text-muted leading-relaxed mb-3 border-l-2 border-brand-600/30 pl-3">
          {rec.description}
        </p>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {rec.revenue && rec.revenue !== 'Unknown' && (
          <div className="bg-surface rounded-lg px-3 py-2">
            <div className="text-[10px] text-muted">Revenue</div>
            <div className="text-xs font-medium text-white mt-0.5">{rec.revenue}</div>
          </div>
        )}
        {rec.funding_raised && rec.funding_raised !== 'Unknown' && (
          <div className="bg-surface rounded-lg px-3 py-2">
            <div className="text-[10px] text-muted">Funding</div>
            <div className="text-xs font-medium text-white mt-0.5">{rec.funding_raised}</div>
          </div>
        )}
        {rec.founding_year > 0 && (
          <div className="bg-surface rounded-lg px-3 py-2">
            <div className="text-[10px] text-muted">Founded</div>
            <div className="text-xs font-medium text-white mt-0.5">{rec.founding_year}</div>
          </div>
        )}
      </div>

      {/* Tech stack */}
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {techStack.map(t => (
            <span key={t} className="badge bg-surface text-muted border border-border text-[10px]">{t}</span>
          ))}
        </div>
      )}

      {/* ICP reasons */}
      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {reasons.map(r => (
            <span key={r} className="badge bg-brand-600/10 text-brand-400 border border-brand-600/20 text-[10px]">
              <Zap className="w-2.5 h-2.5" />{r}
            </span>
          ))}
        </div>
      )}

      {/* Reasoning */}
      {rec.reasoning && (
        <div className="bg-surface rounded-lg px-3 py-2 mb-3">
          <div className="text-[10px] text-muted mb-0.5">Intent reasoning</div>
          <div className="text-xs text-white/80">{rec.reasoning}</div>
        </div>
      )}

      {/* Contacts toggle */}
      {contacts.length > 0 && (
        <div>
          <button onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between text-xs font-medium text-white bg-surface hover:bg-white/5 px-3 py-2 rounded-lg border border-border transition-all mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              {contacts.length} contact{contacts.length > 1 ? 's' : ''} found
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />}
          </button>
          {expanded && (
            <div className="bg-surface rounded-lg px-3 divide-y divide-border">
              {contacts.map((c, i) => <ContactRow key={i} contact={c} />)}
            </div>
          )}
        </div>
      )}

      {/* Next actions */}
      {nextActions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[10px] text-muted font-medium uppercase tracking-wider mb-2">Recommended actions</div>
          <div className="space-y-1">
            {nextActions.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                <span className="text-brand-400 shrink-0 mt-0.5">→</span>{a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsCards({ recommendations = [], summary = {} }) {
  const [filter, setFilter] = useState('all');

  const filtered = recommendations.filter(r => {
    if (filter === 'high') return r.intent_score >= 70;
    if (filter === 'medium') return r.intent_score >= 40 && r.intent_score < 70;
    if (filter === 'low') return r.intent_score < 40;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      {summary.total_companies_found > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Companies found', val: summary.total_companies_found },
            { label: 'Qualified', val: summary.qualified_companies },
            { label: 'Contacts', val: summary.total_contacts },
            { label: 'Avg intent', val: `${summary.avg_intent_score}%` },
          ].map(({ label, val }) => (
            <div key={label} className="bg-brand-600/10 border border-brand-600/20 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-brand-300">{val}</div>
              <div className="text-[11px] text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Filter:</span>
        {['all', 'high', 'medium', 'low'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all
              ${filter === f ? 'bg-brand-600/20 text-brand-400 border-brand-600/30' : 'text-muted border-border hover:text-white hover:border-muted'}`}>
            {f === 'high' ? '🔥 High' : f === 'medium' ? '⚡ Medium' : f === 'low' ? '🌱 Low' : `All (${recommendations.length})`}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted text-sm">No results match this filter.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((rec, i) => <CompanyCard key={i} rec={rec} />)}
        </div>
      )}
    </div>
  );
}
