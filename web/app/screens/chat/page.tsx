'use client';

import { useState, useRef, useEffect } from 'react';
import { postChat, getCurrentUser } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';
import axios from 'axios';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'ocr';
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

const API_BASE = process.env.NEXT_PUBLIC_CATALYST_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export default function ChatPage() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [ocrLoading,  setOcrLoading]  = useState(false);
  const [user,        setUser]        = useState<any>(null);
  const [showOcr,     setShowOcr]     = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { window.location.href = '/login'; return; }
    setUser(u);
    setMessages([{
      id: '0', type: 'assistant',
      text: `Good day, ${u.full_name}. You may query crime cases within your authorised jurisdiction.`,
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Text query ──────────────────────────────────────────────────────────
  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(p => [...p, { id: Date.now().toString(), type: 'user', text, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await postChat({ query: text, mode: 'text', language: 'en' });
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), type: 'assistant',
        text: res.answer, data: (res as any).data ?? [],
        explanation: res.explanation_contract, timestamp: new Date(),
      }]);
    } catch (e: any) {
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), type: 'assistant',
        text: e.response?.data?.error || 'An error occurred. Please retry.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── OCR upload ──────────────────────────────────────────────────────────
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setShowOcr(false);

    setMessages(p => [...p, {
      id: Date.now().toString(), type: 'user',
      text: `📎 Uploaded document: ${file.name}`,
      timestamp: new Date(),
    }]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      const res = await axios.post(`${API_BASE}/ocr/extract`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const extractedText: string = res.data.text || '(No text extracted)';

      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), type: 'ocr',
        text: extractedText,
        timestamp: new Date(),
      }]);

      // Pre-fill input so officer can immediately query the extracted text
      setInput(`Summarise: ${extractedText.slice(0, 120).trim()}`);

    } catch (e: any) {
      const msg = e.response?.status === 503
        ? 'OCR service is not available on this server. Install torch + transformers to enable it.'
        : e.response?.data?.error || 'OCR extraction failed';
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), type: 'assistant',
        text: `⚠ ${msg}`, timestamp: new Date(),
      }]);
    } finally {
      setOcrLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <BaseLayout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 3.5rem)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="page-title">Intelligence Chat</h1>
            {user && <p className="page-subtitle">{user.role} · Station {user.station_id ?? '—'}</p>}
          </div>
          {/* OCR upload toggle */}
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleOcrUpload}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={ocrLoading}
              title="Upload scanned FIR or document for OCR"
              className="btn btn-secondary text-xs gap-1.5"
            >
              {ocrLoading
                ? <><span className="spinner w-3.5 h-3.5" />Extracting…</>
                : <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Upload Document
                  </>
              }
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>

              {/* OCR result block */}
              {msg.type === 'ocr' ? (
                <div className="max-w-2xl w-full card p-4 shadow-panel border-accent-border">
                  <p className="text-2xs font-semibold text-accent uppercase tracking-wider mb-2">
                    📄 OCR Extracted Text
                  </p>
                  <pre className="text-xs text-ink whitespace-pre-wrap font-mono leading-relaxed bg-surface-muted rounded p-3 max-h-48 overflow-y-auto border border-slate-100">
                    {msg.text}
                  </pre>
                  <p className="text-2xs text-ink-muted mt-2">
                    Text extracted · click input below to query this document
                  </p>
                </div>
              ) : (
                <div className={`max-w-2xl rounded px-4 py-3 text-sm shadow-card ${
                  msg.type === 'user'
                    ? 'bg-navy text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-ink rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* FIR table */}
                  {msg.data && msg.data.length > 0 && (
                    <div className="mt-3 overflow-x-auto rounded border border-slate-200">
                      <table className="data-table">
                        <thead>
                          <tr>{['FIR No','Date','Station','Crime Type','Status'].map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {msg.data.slice(0,10).map((row: any, i: number) => (
                            <tr key={i}>
                              <td className="font-mono text-accent">{row.crimeno ?? row.CrimeNo ?? '—'}</td>
                              <td>{row.crimeregistereddate ? new Date(row.crimeregistereddate).toLocaleDateString('en-GB') : '—'}</td>
                              <td>{row.stationname ?? row.StationName ?? '—'}</td>
                              <td>{row.crimeheadname ?? row.CrimeHeadName ?? '—'}</td>
                              <td><span className="badge badge-neutral">{row.status ?? row.Status ?? '—'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {msg.data.length > 10 && (
                        <p className="px-4 py-2 text-2xs text-ink-muted bg-slate-50">
                          Showing 10 of {msg.data.length} records
                        </p>
                      )}
                    </div>
                  )}

                  {msg.explanation && (
                    <details className="mt-3">
                      <summary className="text-xs text-ink-muted cursor-pointer select-none hover:text-ink">Query explanation ›</summary>
                      <div className="mt-2 text-xs text-ink-secondary bg-slate-50 rounded border border-slate-200 p-3 space-y-1">
                        {msg.explanation.reasoning_sketch?.map((s: string, i: number) => <p key={i}>· {s}</p>)}
                      </div>
                    </details>
                  )}

                  <p className="text-2xs text-ink-muted/60 mt-2">{msg.timestamp.toLocaleTimeString()}</p>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded rounded-bl-none px-4 py-3 shadow-card flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Example chips */}
        {messages.length <= 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} onClick={() => send(q)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-accent hover:text-accent rounded text-xs text-ink-secondary transition-colors shadow-card">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="mt-4">
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter query or use the examples above…"
              disabled={loading}
              className="input flex-1"
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary px-5">
              Submit
            </button>
          </form>
        </div>
      </div>
    </BaseLayout>
  );
}
