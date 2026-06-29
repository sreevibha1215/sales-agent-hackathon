// src/components/ResultsCards.jsx
import { useState } from 'react';
import { Building2, Users, MapPin, Mail, Linkedin, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function ScoreBadge({ score }) {
  const color = score >= 70 ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
    : score >= 40 ? 'border-amber-400 text-amber-300 bg-amber-500/10'
    : 'border-rose-400 text-rose-300 bg-rose-500/10';
  return <span className={`badge border text-sm font-bold ${color}`}>{score}%</span>;
}

function ContactRow({ contact }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[rgba(147,80,115,0.08)] last:border-0">
      <div className="w-7 h-7 bg-[rgba(147,80,115,0.15)] rounded-full flex items-center justify-center text-[#c4a0b8] text-xs font-bold shrink-0 mt-0.5">
        {contact.name?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-[#f0e6e0]">{contact.name || 'Unknown'}</div>
        <div className="text-[14px] text-[#b098a8] mt-0.5">{contact.title || '—'}</div>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {contact.email && (
            <a href={`mailto:${contact.email}`}
              className="flex items-center gap-1 text-[13px] text-[#c4a0b8] hover:text-[#d4c0c8]">
              <Mail className="w-3.5 h-3.5" />{contact.email}
            </a>
          )}
          {contact.linkedin && (
            <a href={contact.linkedin} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[13px] text-[#8aaac0] hover:text-[#aac0d0]">
              <Linkedin className="w-3.5 h-3.5" />LinkedIn
            </a>
          )}
        </div>
      </div>
      {contact.confidence && (
        <span className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="card-base">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-[rgba(147,80,115,0.12)] border border-[rgba(147,80,115,0.15)] rounded-xl flex items-center justify-center text-[#c4a0b8] text-sm font-bold shrink-0">
            {company[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold text-[#f0e6e0] truncate">{company}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {rec.headquarters && <span className="flex items-center gap-1 text-[14px] text-[#b098a8]"><MapPin className="w-3.5 h-3.5" />{rec.headquarters}</span>}
              {rec.industry && <span className="flex items-center gap-1 text-[14px] text-[#b098a8]"><Building2 className="w-3.5 h-3.5" />{rec.industry}</span>}
              {rec.employees > 0 && <span className="flex items-center gap-1 text-[14px] text-[#b098a8]"><Users className="w-3.5 h-3.5" />{rec.employees?.toLocaleString()} employees</span>}
            </div>
          </div>
        </div>
        <ScoreBadge score={rec.intent_score || 0} />
      </div>

      {rec.description && (
        <p className="text-[15px] text-[#c8b8b0] leading-relaxed mb-3 border-l-2 border-[rgba(147,80,115,0.2)] pl-3">
          {rec.description}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        {rec.revenue && rec.revenue !== 'Unknown' && (
          <div className="bg-[rgba(30,18,34,0.4)] rounded-lg px-3 py-2">
            <div className="text-[11px] text-[#9a8a92]">Revenue</div>
            <div className="text-[14px] font-medium text-[#f0e6e0] mt-0.5">{rec.revenue}</div>
          </div>
        )}
        {rec.funding_raised && rec.funding_raised !== 'Unknown' && (
          <div className="bg-[rgba(30,18,34,0.4)] rounded-lg px-3 py-2">
            <div className="text-[11px] text-[#9a8a92]">Funding</div>
            <div className="text-[14px] font-medium text-[#f0e6e0] mt-0.5">{rec.funding_raised}</div>
          </div>
        )}
        {rec.founding_year > 0 && (
          <div className="bg-[rgba(30,18,34,0.4)] rounded-lg px-3 py-2">
            <div className="text-[11px] text-[#9a8a92]">Founded</div>
            <div className="text-[14px] font-medium text-[#f0e6e0] mt-0.5">{rec.founding_year}</div>
          </div>
        )}
      </div>

      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {techStack.map(t => (
            <span key={t} className="badge bg-[rgba(30,18,34,0.4)] text-[#b098a8] border border-[rgba(147,80,115,0.08)] text-[12px]">
              {t}
            </span>
          ))}
        </div>
      )}

      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {reasons.map(r => (
            <span key={r} className="badge bg-[rgba(147,80,115,0.08)] text-[#c4a0b8] border border-[rgba(147,80,115,0.1)] text-[12px]">
              <Zap className="w-2.5 h-2.5" />{r}
            </span>
          ))}
        </div>
      )}

      {rec.reasoning && (
        <div className="bg-[rgba(30,18,34,0.4)] rounded-lg px-3 py-2 mb-3">
          <div className="text-[11px] text-[#9a8a92] mb-0.5">Intent reasoning</div>
          <div className="text-[14px] text-[#d4c8c0]">{rec.reasoning}</div>
        </div>
      )}

      {contacts.length > 0 && (
        <div>
          <button onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between text-[14px] font-medium text-[#f0e6e0] bg-[rgba(30,18,34,0.3)] hover:bg-[rgba(30,18,34,0.5)] px-3 py-2 rounded-lg border border-[rgba(147,80,115,0.08)] transition-all mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#c4a0b8]" />
              {contacts.length} contact{contacts.length > 1 ? 's' : ''} found
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#9a8a92]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9a8a92]" />}
          </button>
          {expanded && (
            <div className="bg-[rgba(30,18,34,0.3)] rounded-lg px-3 divide-y divide-[rgba(147,80,115,0.06)]">
              {contacts.map((c, i) => <ContactRow key={i} contact={c} />)}
            </div>
          )}
        </div>
      )}

      {rec.next_action && (
        <div className="mt-3 pt-3 border-t border-[rgba(147,80,115,0.08)]">
          <div className="text-[11px] text-[#9a8a92] font-medium uppercase tracking-wider mb-1">Next action</div>
          <div className="text-[14px] text-[#c8b8b0]">{rec.next_action}</div>
        </div>
      )}
    </motion.div>
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
      {summary.total_companies_found > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Companies found', val: summary.total_companies_found },
            { label: 'Qualified', val: summary.qualified_companies },
            { label: 'Contacts', val: summary.total_contacts },
            { label: 'Avg intent', val: `${summary.avg_intent_score}%` },
          ].map(({ label, val }) => (
            <div key={label} className="bg-[rgba(147,80,115,0.06)] border border-[rgba(147,80,115,0.1)] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-[#c4a0b8]">{val}</div>
              <div className="text-[13px] text-[#b098a8] mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] text-[#9a8a92]">Filter:</span>
        {['all', 'high', 'medium', 'low'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[14px] px-4 py-2 rounded-lg border capitalize transition-all
              ${filter === f ? 'bg-[rgba(147,80,115,0.12)] text-[#c4a0b8] border-[rgba(147,80,115,0.2)]' : 'text-[#9a8a92] border-[rgba(147,80,115,0.08)] hover:text-[#c4a0b8] hover:border-[rgba(147,80,115,0.15)]'}`}>
            {f === 'high' ? '🔥 High' : f === 'medium' ? '⚡ Medium' : f === 'low' ? '🌱 Low' : `All (${recommendations.length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-[#9a8a92] text-sm">No results match this filter.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((rec, i) => <CompanyCard key={i} rec={rec} />)}
        </div>
      )}
    </div>
  );
}