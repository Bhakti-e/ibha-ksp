'use client';

import { useState, useRef, useEffect } from 'react';
import { postChat, getCurrentUser } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';
import axios from 'axios';

// ── Types ──────────────────────────────────────────────────────────────────
interface RagChunk { text: string; source: string; score: number; }

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'ocr' | 'rag';
  text: string;
  data?: any[];
  explanation?: any;
  metadata?: any;
  ragChunks?: RagChunk[];
  timestamp: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const getCaseNo    = (r: any) => r.crimeno   ?? r.CrimeNo   ?? r.crime_no   ?? '—';
const getCaseDate  = (r: any) => r.crimeregistereddate ?? r.CrimeRegisteredDate ?? r.crime_registered_date;
const getCaseFacts = (r: any) => r.brieffacts ?? r.BriefFacts ?? r.brief_facts;
const isCaseRow    = (r: any) => Boolean(r?.crimeno ?? r?.CrimeNo ?? r?.crime_no ?? r?.case_number);
const fmtKey       = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const fmtVal       = (v: any) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 80);
  return String(v);
};

const EXAMPLE_QUERIES = [
  'Show theft cases in last 12 months',
  'How many murder cases last 12 months?',
  'Profile accused 13',
  'Investigate case 31',
  'Show sociological breakdown last 12 months',
];

const API_BASE        = process.env.NEXT_PUBLIC_CATALYST_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const CHAT_STORAGE_KEY = 'ibha-chat-messages';

// ── Component ──────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages,    setMessages]   = useState<Message[]>([]);
  const [input,       setInput]      = useState('');
  const [loading,     setLoading]    = useState(false);
  const [ocrLoading,  setOcrLoading] = useState(false);
  const [ragLoading,  setRagLoading] = useState(false);
  const [user,        setUser]       = useState<any>(null);
  const [isListening, setIsListening]= useState(false);
  const [ragEnabled,  setRagEnabled] = useState(false);
  const [micTooltip,  setMicTooltip] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const micTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load user + persisted messages
  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { window.location.href = '/login'; return; }
    setUser(u);
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        setMessages(parsed); return;
      } catch { localStorage.removeItem(CHAT_STORAGE_KEY); }
    }
    setMessages([{ id: '0', type: 'assistant',
      text: `Good day, ${u.full_name}. You may query crime cases within your authorised jurisdiction.`,
      timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Core chat send ─────────────────────────────────────────────────────
  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', text, timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const conversation = [...messages, userMsg].slice(-6)
        .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', text: m.text }));
      const res = await postChat({ query: text, mode: 'text', language: 'en', conversation } as any);
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), type: 'assistant',
        text: res.answer, data: (res as any).data ?? [],
        explanation: res.explanation_contract, metadata: (res as any).metadata,
        timestamp: new Date(),
      }]);
    } catch (e: any) {
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), type: 'assistant',
        text: e.response?.data?.error || 'An error occurred. Please retry.',
        timestamp: new Date(),
      }]);
    } finally { setLoading(false); }

    // Also query RAG if toggle is on
    if (ragEnabled) { await sendRag(text); }
  };

  // ── RAG search ─────────────────────────────────────────────────────────
  const sendRag = async (question: string) => {
    setRagLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.post(`${API_BASE}/rag/query`,
        { question, top_k: 4 },
        { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      const chunks: RagChunk[] = res.data.chunks ?? [];
      if (chunks.length > 0) {
        setMessages(p => [...p, {
          id: (Date.now()+2).toString(), type: 'rag',
          text: `Document search found ${chunks.length} relevant passage${chunks.length > 1 ? 's' : ''}.`,
          ragChunks: chunks, timestamp: new Date(),
        }]);
      }
    } catch (e: any) {
      const status = e.response?.status;
      if (status !== 503) {  // silently skip if RAG not available
        setMessages(p => [...p, {
          id: (Date.now()+2).toString(), type: 'assistant',
          text: `Document search error: ${e.response?.data?.error || e.message}`,
          timestamp: new Date(),
        }]);
      }
    } finally { setRagLoading(false); }
  };

  // ── Voice input (Web Speech API) ───────────────────────────────────────
  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      // Simulated STT for demo — show tooltip
      setMicTooltip(true);
      if (micTimer.current) clearTimeout(micTimer.current);
      micTimer.current = setTimeout(() => setMicTooltip(false), 3000);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onresult = (ev: any) => { setInput(ev.results[0][0].transcript); };
    rec.onerror  = () => {
      setIsListening(false);
      setMicTooltip(true);
      if (micTimer.current) clearTimeout(micTimer.current);
      micTimer.current = setTimeout(() => setMicTooltip(false), 3000);
    };
    rec.start();
  };

  // ── PDF export ─────────────────────────────────────────────────────────
  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('courier', 'normal');
    doc.setFontSize(14);
    doc.text(`IBHA Chat History — ${new Date().toLocaleString()}`, 10, 15);
    let y = 25;
    doc.setFontSize(10);
    messages.forEach(m => {
      const prefix = m.type === 'user' ? 'Officer: ' : 'Ibha: ';
      const lines  = doc.splitTextToSize(prefix + m.text, 180);
      if (y + lines.length * 5 > 280) { doc.addPage(); y = 15; }
      doc.text(lines, 10, y);
      y += lines.length * 5 + 4;
      if (m.data?.length) { doc.text(`  [${m.data.length} FIR rows]`, 10, y); y += 5; }
    });
    doc.save(`ibha-chat-${Date.now()}.pdf`);
  };

  // ── OCR upload ─────────────────────────────────────────────────────────
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setMessages(p => [...p, { id: Date.now().toString(), type: 'user', text: `Uploaded: ${file.name}`, timestamp: new Date() }]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');
      const res = await axios.post(`${API_BASE}/ocr/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const extractedText = res.data.text || '(No text extracted)';
      setMessages(p => [...p, { id: (Date.now()+1).toString(), type: 'ocr', text: extractedText, timestamp: new Date() }]);
      setInput(`Summarise: ${extractedText.slice(0, 120).trim()}`);
    } catch (e: any) {
      const msg = e.response?.status === 503
        ? 'OCR service unavailable. Install torch + transformers.'
        : e.response?.data?.error || 'OCR extraction failed';
      setMessages(p => [...p, { id: (Date.now()+1).toString(), type: 'assistant', text: `Warning: ${msg}`, timestamp: new Date() }]);
    } finally {
      setOcrLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <BaseLayout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 3.5rem)' }}>

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="page-title">Intelligence Chat</h1>
            {user && <p className="page-subtitle">{user.role} · Station {user.station_id ?? '—'}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleOcrUpload} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={ocrLoading}
              title="Upload scanned FIR for OCR text extraction"
              className="btn btn-secondary text-xs gap-1.5">
              {ocrLoading ? <><span className="spinner w-3.5 h-3.5" />Extracting…</> : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>Upload FIR</>
              )}
            </button>
            <button type="button" onClick={exportPDF} disabled={messages.length <= 1}
              title="Export conversation as PDF"
              className="btn btn-secondary text-xs gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>PDF
            </button>
          </div>
        </div>

        {/* ─── RAG toggle bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-2 rounded border border-slate-200 bg-slate-50 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <label htmlFor="rag-toggle" className="text-ink-secondary font-medium cursor-pointer select-none">
              Search documents (RAG)
            </label>
            <span className="text-ink-muted">— query FIR reports and crime docs alongside the database</span>
          </div>
          <div className="flex items-center gap-2">
            {ragLoading && <span className="spinner w-3.5 h-3.5" />}
            <button
              id="rag-toggle"
              type="button"
              onClick={() => setRagEnabled(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:ring-2 ${ragEnabled ? 'bg-accent' : 'bg-slate-300'}`}
              role="switch"
              aria-checked={ragEnabled}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${ragEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* ─── Message thread ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>

              {/* OCR result */}
              {msg.type === 'ocr' && (
                <div className="max-w-2xl w-full card p-4 shadow-panel border-l-4 border-l-accent">
                  <p className="text-2xs font-semibold text-accent uppercase tracking-wider mb-2">OCR — Extracted Text</p>
                  <pre className="text-xs text-ink whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 rounded p-3 max-h-48 overflow-y-auto border border-slate-200">
                    {msg.text}
                  </pre>
                  <p className="text-2xs text-ink-muted mt-2">Text extracted — input pre-filled below. Toggle RAG to search this document.</p>
                </div>
              )}

              {/* RAG result */}
              {msg.type === 'rag' && (
                <div className="max-w-3xl w-full card p-4 shadow-panel border-l-4 border-l-blue-400">
                  <p className="text-2xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
                    Document Search (RAG) — {msg.ragChunks?.length ?? 0} passages
                  </p>
                  <div className="space-y-3">
                    {msg.ragChunks?.map((chunk, i) => (
                      <div key={i} className="bg-slate-50 rounded border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xs font-semibold text-ink-secondary font-mono">{chunk.source}</span>
                          <span className={`badge text-2xs ${chunk.score >= 0.7 ? 'badge-low' : chunk.score >= 0.5 ? 'badge-medium' : 'badge-neutral'}`}>
                            {(chunk.score * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="text-xs text-ink leading-relaxed">{chunk.text}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-2xs text-ink-muted mt-2">{msg.timestamp.toLocaleTimeString()}</p>
                </div>
              )}

              {/* Normal messages */}
              {(msg.type === 'user' || msg.type === 'assistant') && (
                <div className={`rounded px-4 py-3 text-sm shadow-card border ${
                  msg.type === 'user'
                    ? 'max-w-md bg-navy text-white border-navy rounded-br-none'
                    : 'w-full max-w-4xl bg-white border-slate-200 text-ink rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* FIR data table */}
                  {msg.data && msg.data.length > 0 && (
                    isCaseRow(msg.data[0]) ? (
                      <div className="mt-3 overflow-hidden rounded border border-slate-200">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th className="w-[30%]">FIR No</th><th className="w-[14%]">Date</th>
                              <th className="w-[22%]">Station</th><th className="w-[18%]">Crime Type</th>
                              <th className="w-[16%]">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {msg.data.slice(0, 10).map((row: any, i: number) => (
                              <tr key={i}>
                                <td className="font-mono text-accent break-all">{getCaseNo(row) !== '—' ? getCaseNo(row) : row.case_number ?? '—'}</td>
                                <td>{getCaseDate(row) ? new Date(getCaseDate(row)).toLocaleDateString('en-GB') : '—'}</td>
                                <td className="truncate">{row.stationname ?? row.StationName ?? '—'}</td>
                                <td className="truncate">{row.crimeheadname ?? row.CrimeHeadName ?? row.crime_type ?? '—'}</td>
                                <td><span className="badge badge-neutral normal-case">{row.status ?? row.Status ?? '—'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {msg.data.length === 1 && getCaseFacts(msg.data[0]) && (
                          <div className="border-t border-slate-200 bg-slate-50 p-3">
                            <p className="text-2xs font-bold uppercase tracking-wider text-ink-secondary mb-1">Brief Facts</p>
                            <p className="text-xs leading-relaxed text-ink whitespace-pre-wrap">{getCaseFacts(msg.data[0])}</p>
                          </div>
                        )}
                        {msg.data.length > 10 && <p className="px-4 py-2 text-2xs text-ink-muted bg-slate-50">Showing 10 of {msg.data.length}</p>}
                      </div>
                    ) : (
                      <div className="mt-3 overflow-hidden rounded border border-slate-200">
                        {(() => {
                          const cols = Object.keys(msg.data[0] || {}).filter(k => !['embedding','brieffacts','case_description'].includes(k)).slice(0, 5);
                          return (
                            <table className="data-table">
                              <thead><tr>{cols.map(c => <th key={c}>{fmtKey(c)}</th>)}</tr></thead>
                              <tbody>{msg.data.slice(0, 10).map((r: any, i: number) => <tr key={i}>{cols.map(c => <td key={c} className="truncate">{fmtVal(r[c])}</td>)}</tr>)}</tbody>
                            </table>
                          );
                        })()}
                        {msg.data.length > 10 && <p className="px-4 py-2 text-2xs text-ink-muted bg-slate-50">Showing 10 of {msg.data.length}</p>}
                      </div>
                    )
                  )}

                  {/* Explanation */}
                  {msg.explanation && (
                    <details className="mt-3">
                      <summary className="text-xs text-ink-muted cursor-pointer select-none hover:text-accent">Query explanation ›</summary>
                      <div className="mt-2 text-xs text-ink-secondary bg-slate-50 rounded border border-slate-200 p-3 space-y-1">
                        {msg.explanation.reasoning_sketch?.map((s: string, i: number) => <p key={i}>· {s}</p>)}
                      </div>
                    </details>
                  )}

                  {/* Tools used */}
                  {msg.metadata?.tool_results?.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-ink-muted cursor-pointer select-none hover:text-accent">Tools used ›</summary>
                      <div className="mt-2 grid gap-1.5">
                        {msg.metadata.tool_results.map((t: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-2xs">
                            <span className="font-bold text-accent">{t.tool}</span>
                            <span className={t.ok ? 'text-ink-muted' : 'text-status-danger'}>{t.ok ? `${t.record_count ?? 0} records` : t.error || 'failed'}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <p className={`text-2xs mt-2 ${msg.type === 'user' ? 'text-white/60' : 'text-ink-muted/70'}`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {(loading || ragLoading) && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded rounded-bl-none px-4 py-3 shadow-card flex items-center gap-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
                {ragLoading && <span className="text-2xs text-ink-muted ml-1">searching docs…</span>}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ─── Example chips ────────────────────────────────────────────── */}
        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} onClick={() => send(q)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-accent hover:text-accent rounded text-xs text-ink-secondary transition-colors shadow-card">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ─── Input bar ────────────────────────────────────────────────── */}
        <div className="mt-3">
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2 items-center">

            {/* Mic button with simulated STT tooltip */}
            <div className="relative">
              <button
                type="button"
                onClick={handleVoice}
                disabled={loading}
                aria-label="Voice input"
                title="Voice input — speak your query"
                className={`btn text-xs h-10 w-10 p-0 flex items-center justify-center ${
                  isListening ? 'btn-primary animate-pulse' : 'btn-secondary'
                }`}
              >
                {isListening ? (
                  /* Recording indicator */
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" opacity="0.3"/>
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                ) : (
                  /* Mic icon */
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 014 4v4a4 4 0 01-8 0V7a4 4 0 014-4z"/>
                  </svg>
                )}
              </button>

              {/* Simulated STT tooltip */}
              {micTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-navy text-white text-xs rounded shadow-lg px-3 py-2 text-center z-20">
                  <p className="font-semibold">Speak now (simulated STT)</p>
                  <p className="text-white/70 mt-0.5">Type query manually for demo</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy" />
                </div>
              )}
            </div>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? 'Listening…' : ragEnabled ? 'Query database + documents…' : 'Enter query…'}
              disabled={loading}
              className="input flex-1"
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary px-5">
              Submit
            </button>
          </form>

          {/* Status line below input */}
          <p className="text-2xs text-ink-muted mt-1.5 flex items-center gap-3">
            {ragEnabled
              ? <span className="text-blue-600 font-medium">Document RAG enabled — results will appear below chat answers</span>
              : <span>Toggle "Search documents" above to include FIR/report search</span>
            }
            {isListening && <span className="text-status-danger font-medium animate-pulse">Listening…</span>}
          </p>
        </div>
      </div>
    </BaseLayout>
  );
}
