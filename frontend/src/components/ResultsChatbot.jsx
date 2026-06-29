// src/components/ResultsChatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, X } from 'lucide-react';

const SUGGESTED = [
  "Which company should I contact first?",
  "Summarize the top 3 companies",
  "Who are the best contacts to reach out to?",
  "What buying signals did you find?",
];

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
        ${isBot ? 'bg-brand-600/20 border border-brand-600/30' : 'bg-surface border border-border'}`}>
        {isBot ? <Bot className="w-3.5 h-3.5 text-brand-400" /> : <User className="w-3.5 h-3.5 text-muted" />}
      </div>
      <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed
        ${isBot ? 'bg-card border border-border text-white' : 'bg-brand-600/20 border border-brand-600/25 text-white'}`}>
        {msg.content}
      </div>
    </div>
  );
}

export default function ResultsChatbot({ recommendations = [], summary = {} }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I've analysed the ${recommendations.length} companies found. Ask me anything about the results — who to contact first, which companies are the best fit, or what next steps to take.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build context from results for the chatbot
  const buildContext = () => {
    const top = recommendations.slice(0, 5).map(r => ({
      company: r.company || r.name,
      score: r.intent_score,
      industry: r.industry,
      headquarters: r.headquarters,
      employees: r.employees,
      contacts: (r.contacts || []).slice(0, 3).map(c => `${c.name} (${c.title})`).join(', '),
      reasoning: r.reasoning,
    }));
    return JSON.stringify({ summary, top_companies: top });
  };
const sendMessage = async (text) => {
  if (!text.trim() || loading) return;
  const userMsg = { role: 'user', content: text };
  const newMessages = [...messages, userMsg];
  setMessages(newMessages);
  setInput('');
  setLoading(true);

  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch('http://127.0.0.1:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        context: buildContext()
      })
    });

    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
  } catch {
    setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
  } finally {
    setLoading(false);
  }
};
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl shadow-2xl shadow-brand-600/30 flex items-center justify-center transition-all hover:scale-105 z-50">
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-panel border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600/20 border border-brand-600/30 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Results Q&A</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full pulse-dot" />
              Ready to help
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="btn-ghost p-1.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 bg-brand-600/20 border border-brand-600/30 rounded-full flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-brand-400 spin" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="text-[10px] text-brand-400 bg-brand-600/10 border border-brand-600/20 hover:bg-brand-600/20 px-2.5 py-1.5 rounded-full transition-all">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about the results…"
            className="input-base text-sm py-2 flex-1"
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="btn-primary px-3 py-2 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
