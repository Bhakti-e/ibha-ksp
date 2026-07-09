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
  metadata?: any;
  timestamp: Date;
}

const getCaseNo = (row: any) => row.crimeno ?? row.CrimeNo ?? row.crime_no ?? '—';
const getCaseDate = (row: any) => row.crimeregistereddate ?? row.CrimeRegisteredDate ?? row.crime_registered_date;
const getCaseFacts = (row: any) => row.brieffacts ?? row.BriefFacts ?? row.brief_facts;
const isCaseRow = (row: any) => Boolean(row?.crimeno ?? row?.CrimeNo ?? row?.crime_no ?? row?.case_number);
const formatKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const formatValue = (value: any) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 80);
  return String(value);
};

const EXAMPLE_QUERIES = [
  'Show theft cases in last 12 months',
  'How many murder cases last 12 months?',
  'Show sociological breakdown last 12 months',
  'Profile accused 13',
  'Investigate case 31',
];

const API_BASE = process.env.NEXT_PUBLIC_CATALYST_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const CHAT_STORAGE_KEY = 'ibha-chat-messages';

export default function ChatPage() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [ocrLoading,  setOcrLoading]  = useState(false);
  const [user,        setUser]        = useState<any>(null);
  const [showOcr,     setShowOcr]     = useState(false);
  const [isListening, setIsListening]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { window.location.href = '/login'; return; }
    setUser(u);
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        setMessages(parsed);
        return;
      } catch {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    }
    setMessages([{ id: '0', type: 'assistant', text: `Good day, ${u.full_name}. You may query crime cases within your authorised jurisdiction.`, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Text query with conversation history for follow-up ───────────────
  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', text, timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const conversation = [...messages, userMsg].slice(-6).map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', text: m.text }));
      const res = await postChat({ query: text, mode: 'text', language: 'en', conversation } as any);
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), type: 'assistant',
        text: res.answer, data: (res as any).data ?? [],
        explanation: res.explanation_contract, metadata: (res as any).metadata, timestamp: new Date(),
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

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice not supported in this browser. Use Chrome.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (ev: any) => {
      const transcript = ev.results[0][0].transcript;
      setInput(transcript);
    };
    rec.start();
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('courier', 'normal');
    doc.setFontSize(14);
    doc.text(`IBHA Chat History - ${new Date().toLocaleString()}`, 10, 15);
    let y = 25;
    doc.setFontSize(10);
    messages.forEach((m) => {
      const prefix = m.type === 'user' ? 'User: ' : 'Ibha: ';
      const lines = doc.splitTextToSize(prefix + m.text, 180);
      if (y + lines.length*5 > 280) { doc.addPage(); y=15; }
      doc.text(lines, 10, y);
      y += lines.length*5 + 4;
      if (m.data && m.data.length>0) {
        doc.text(`  [${m.data.length} FIR rows]`, 10, y); y+=5;
      }
    });
    doc.save(`ibha-chat-${Date.now()}.pdf`);
  };

  // ── OCR upload ──────────────────────────────────────────────────────────
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setShowOcr(false);

    setMessages(p => [...p, {
      id: Date.now().toString(), type: 'user',
      text: `Uploaded document: ${file.name}`,
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
        text: `Warning: ${msg}`, timestamp: new Date(),
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
          {/* Actions: OCR, Voice, PDF */}
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleOcrUpload} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={ocrLoading} title="Upload FIR for OCR" className="btn btn-secondary text-xs gap-1.5">
              {ocrLoading ? <><span className="spinner w-3.5 h-3.5" />Extracting…</> : 'Upload'}
            </button>
            <button type="button" onClick={handleVoice} disabled={isListening} title="Voice input (EN/KN)" className={`btn text-xs gap-1.5 ${isListening?'btn-primary':'btn-secondary'}`}>
              {isListening ? 'Listening…' : 'Voice'}
            </button>
            <button type="button" onClick={exportPDF} disabled={messages.length<=1} title="Save conversation as PDF locally" className="btn btn-secondary text-xs gap-1.5">
              PDF
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>

              {/* OCR result block */}
              {msg.type === 'ocr' ? (
                <div className="max-w-2xl w-full card p-4 shadow-panel border-accent-border">
                  <p className="text-2xs font-semibold text-accent uppercase tracking-wider mb-2">
                    OCR Extracted Text
                  </p>
                  <pre className="text-xs text-ink whitespace-pre-wrap font-mono leading-relaxed bg-surface-muted rounded p-3 max-h-48 overflow-y-auto border border-navy-border/60">
                    {msg.text}
                  </pre>
                  <p className="text-2xs text-ink-muted mt-2">
                    Text extracted · click input below to query this document
                  </p>
                </div>
              ) : (
                <div className={`rounded px-4 py-3 text-sm shadow-card border ${
                  msg.type === 'user'
                    ? 'max-w-md bg-accent text-[#160A0B] border-accent rounded-br-none'
                    : 'w-full max-w-4xl bg-surface-card border-navy-border/60 text-ink rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* FIR table */}
                  {msg.data && msg.data.length > 0 && (
                    isCaseRow(msg.data[0]) ? (
                      <div className="mt-3 overflow-hidden rounded border border-navy-border/60">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th className="w-[31%]">FIR No</th>
                              <th className="w-[14%]">Date</th>
                              <th className="w-[22%]">Station</th>
                              <th className="w-[18%]">Crime Type</th>
                              <th className="w-[15%]">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {msg.data.slice(0,10).map((row: any, i: number) => (
                              <tr key={i}>
                                <td className="font-mono text-accent break-all" title={getCaseNo(row)}>{getCaseNo(row) !== '—' ? getCaseNo(row) : row.case_number ?? '—'}</td>
                                <td>{getCaseDate(row) ? new Date(getCaseDate(row)).toLocaleDateString('en-GB') : '—'}</td>
                                <td className="truncate" title={row.stationname ?? row.StationName ?? '—'}>{row.stationname ?? row.StationName ?? '—'}</td>
                                <td className="truncate" title={row.crimeheadname ?? row.CrimeHeadName ?? row.crime_type ?? '—'}>{row.crimeheadname ?? row.CrimeHeadName ?? row.crime_type ?? '—'}</td>
                                <td><span className="badge badge-neutral normal-case tracking-normal">{row.status ?? row.Status ?? '—'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {msg.data.length === 1 && getCaseFacts(msg.data[0]) && (
                          <div className="border-t border-navy-border/60 bg-surface-muted/70 p-3">
                            <p className="text-2xs font-bold uppercase tracking-wider text-accent mb-1">Brief Facts</p>
                            <p className="text-xs leading-relaxed text-ink-secondary whitespace-pre-wrap">{getCaseFacts(msg.data[0])}</p>
                          </div>
                        )}
                        {msg.data.length > 10 && <p className="px-4 py-2 text-2xs text-ink-muted bg-surface-muted">Showing 10 of {msg.data.length} records</p>}
                      </div>
                    ) : (
                      <div className="mt-3 overflow-hidden rounded border border-navy-border/60">
                        {(() => {
                          const columns = Object.keys(msg.data[0] || {}).filter(k => !['embedding', 'brieffacts', 'case_description'].includes(k)).slice(0, 5);
                          return (
                            <table className="data-table">
                              <thead><tr>{columns.map(col => <th key={col}>{formatKey(col)}</th>)}</tr></thead>
                              <tbody>{msg.data.slice(0, 10).map((row: any, i: number) => <tr key={i}>{columns.map(col => <td key={col} className="truncate" title={formatValue(row[col])}>{formatValue(row[col])}</td>)}</tr>)}</tbody>
                            </table>
                          );
                        })()}
                        {msg.data.length > 10 && <p className="px-4 py-2 text-2xs text-ink-muted bg-surface-muted">Showing 10 of {msg.data.length} records</p>}
                      </div>
                    )
                  )}

                  {msg.explanation && (
                    <details className="mt-3">
                      <summary className="text-xs text-ink-muted cursor-pointer select-none hover:text-accent">Query explanation ›</summary>
                      <div className="mt-2 text-xs text-ink-secondary bg-surface-muted rounded border border-navy-border/60 p-3 space-y-1">
                        {msg.explanation.reasoning_sketch?.map((s: string, i: number) => <p key={i}>· {s}</p>)}
                      </div>
                    </details>
                  )}

                  {msg.metadata?.tool_results?.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-ink-muted cursor-pointer select-none hover:text-accent">Tools used ›</summary>
                      <div className="mt-2 grid gap-1.5">
                        {msg.metadata.tool_results.map((tool: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-3 rounded border border-navy-border/50 bg-surface-muted px-2.5 py-1.5 text-2xs">
                            <span className="font-bold text-accent">{tool.tool}</span>
                            <span className={tool.ok ? 'text-ink-muted' : 'text-status-danger'}>
                              {tool.ok ? `${tool.record_count ?? 0} records` : tool.error || 'failed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <p className={`text-2xs mt-2 ${msg.type === 'user' ? 'text-[#5E2505]/70' : 'text-ink-muted/70'}`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-card border border-navy-border/60 rounded rounded-bl-none px-4 py-3 shadow-card flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"
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
                className="px-3 py-1.5 bg-surface-card border border-navy-border/60 hover:border-accent hover:text-accent rounded text-xs text-ink-secondary transition-colors shadow-card">
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
