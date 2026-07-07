'use client';

import { useState, useRef, useEffect } from 'react';
import { postChat, getCurrentUser } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  data?: any[];
  explanation?: any;
  timestamp: Date;
}

const EXAMPLE_QUERIES = [
  'Show theft cases in my station in last 30 days',
  'How many murder cases this month?',
  'List heinous crimes',
  'Cases from January 2024',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [user,     setUser]     = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { window.location.href = '/login'; return; }
    setUser(u);
    setMessages([{
      id: '0', type: 'assistant',
      text: `Welcome, ${u.full_name}! I can answer questions about crime cases in your jurisdiction. Try the examples below.`,
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', text, timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await postChat({ query: text, mode: 'text', language: 'en' });
      setMessages(p => [...p, {
        id:          (Date.now()+1).toString(),
        type:        'assistant',
        text:        res.answer,
        data:        (res as any).data ?? [],
        explanation: res.explanation_contract,
        timestamp:   new Date(),
      }]);
    } catch (e: any) {
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), type: 'assistant',
        text: e.response?.data?.error || 'Error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); send(input); };

  return (
    <BaseLayout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 3rem)' }}>

        {/* Page title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Crime Intelligence Chat</h1>
          {user && (
            <p className="text-slate-400 text-sm mt-0.5">
              {user.role} · Station {user.station_id ?? '—'}
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                {/* Data table */}
                {msg.data && msg.data.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900">
                          {['FIR No','Date','Station','Crime Type','Status'].map(h => (
                            <th key={h} className="px-2 py-1.5 text-left text-slate-400 font-semibold border-b border-slate-700">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.data.slice(0,10).map((row: any, i: number) => (
                          <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                            <td className="px-2 py-1.5 font-mono text-blue-300">{row.crimeno ?? row.CrimeNo ?? '—'}</td>
                            <td className="px-2 py-1.5 text-slate-300">{row.crimeregistereddate ? new Date(row.crimeregistereddate).toLocaleDateString() : '—'}</td>
                            <td className="px-2 py-1.5 text-slate-300">{row.stationname ?? row.StationName ?? '—'}</td>
                            <td className="px-2 py-1.5 text-slate-300">{row.crimeheadname ?? row.CrimeHeadName ?? '—'}</td>
                            <td className="px-2 py-1.5">
                              <span className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">{row.status ?? row.Status ?? '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {msg.data.length > 10 && (
                      <p className="text-xs text-slate-500 mt-1">Showing 10 of {msg.data.length} results</p>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {msg.explanation && (
                  <details className="mt-3">
                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200 select-none">
                      View explanation ›
                    </summary>
                    <div className="mt-2 space-y-1 text-xs text-slate-400 bg-slate-900/50 rounded-lg p-2">
                      {msg.explanation.reasoning_sketch?.map((s: string, i: number) => (
                        <p key={i}>· {s}</p>
                      ))}
                    </div>
                  </details>
                )}

                <p className="text-xs text-slate-500 mt-2">{msg.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Example queries */}
        {messages.length <= 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} onClick={() => send(q)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-xs text-slate-300 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about crime cases, trends, or suspects…"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </BaseLayout>
  );
}
