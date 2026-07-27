'use client';

import { useState, useRef, useEffect } from 'react';
import { postChat, getCurrentUser } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';
import EvidenceTrailPanel from '@/components/chat/EvidenceTrailPanel';
import { useMock, mockDelay } from '@/lib/mocks/useMock';
import {
  MOCK_CHAT_RESPONSE_EN,
  MOCK_CHAT_RESPONSE_KN,
  MOCK_CHAT_RESPONSE_FALLBACK,
} from '@/lib/mocks/fixtures';
import axios from 'axios';

interface OcrAnalytics {
  keywords?: string[];
  sentiment?: string;
  sentiment_score?: number;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'ocr';
  text: string;
  data?: any[];
  explanation?: any;
  language?: 'en' | 'kn';
  timestamp: Date;
  /** OCR-specific enrichments from Zia text analytics */
  ocrEngine?: string;
  ocrAnalytics?: OcrAnalytics;
}

const EXAMPLE_QUERIES = [
  'Show theft cases in my station in last 30 days',
  ' How many murder cases this month?',
  'List heinous crimes',
  'ಕಳೆದ 30 ದಿನಗಳಲ್ಲಿ ಕಳ್ಳತನದ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ',
];

const API_BASE = process.env.NEXT_PUBLIC_CATALYST_API_BASE_URL ?? '/api/v1';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [sessionId, setSessionId] = useState<string>('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const [isListening, setIsListening] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const isMockMode = useMock();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getCurrentUser() || {
      full_name: 'Inspector Vijay Kumar',
      role: 'Inspector',
      station_id: 3,
    };
    setUser(u);
    setMessages([
      {
        id: '0',
        type: 'assistant',
        text: `Good day, ${u.full_name}. You may query crime cases within your authorised jurisdiction.`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Debounce cooldown ──────────────────────────────────────────────────
  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000);
  };

  // ── Text query ──────────────────────────────────────────────────────────
  const send = async (text: string) => {
    if (!text.trim() || loading || cooldown) return;

    // Detect if input contains Kannada script
    const containsKannada = /[\u0C80-\u0CFF]/.test(text);
    const activeLang = containsKannada ? 'kn' : language;

    setMessages((p) => [
      ...p,
      { id: Date.now().toString(), type: 'user', text, timestamp: new Date() },
    ]);
    setInput('');
    setLoading(true);
    startCooldown();

    try {
      let res: any;

      if (isMockMode) {
        await mockDelay(700);
        if (activeLang === 'kn' || text.includes('ಕಳ್ಳತನ')) {
          res = MOCK_CHAT_RESPONSE_KN;
        } else if (text.toLowerCase().includes('fallback') || text.toLowerCase().includes('basic')) {
          res = MOCK_CHAT_RESPONSE_FALLBACK;
        } else {
          res = MOCK_CHAT_RESPONSE_EN;
        }
      } else {
        res = await postChat({
          query: text,
          mode: 'text',
          language: activeLang,
        });
      }

      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: res.answer,
          data: res.cases ?? res.data ?? [],
          explanation: res.explanation_contract,
          language: res.language ?? activeLang,
          timestamp: new Date(),
        },
      ]);
    } catch (e: any) {
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: e.response?.data?.error || 'An error occurred. Please retry.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Voice Speech-to-Text (STT) ──────────────────────────────────────────
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser Speech Recognition is not supported on this browser. Please use Chrome.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          send(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // ── Voice Text-to-Speech (TTS) ──────────────────────────────────────────
  const speakMessage = (text: string, lang: 'en' | 'kn' = 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  // ── PDF Print Export ─────────────────────────────────────────────────────
  const handleExportPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // ── OCR upload ──────────────────────────────────────────────────────────
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);

    setMessages((p) => [
      ...p,
      {
        id: Date.now().toString(),
        type: 'user',
        text: `📎 Uploaded document: ${file.name}`,
        timestamp: new Date(),
      },
    ]);

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
      const ocrEngine: string     = res.data.ocr_engine || 'unknown';
      const ocrAnalytics          = res.data.analytics  || {};

      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          type: 'ocr',
          text: extractedText,
          ocrEngine,
          ocrAnalytics,
          timestamp: new Date(),
        },
      ]);

      setInput(`Summarise: ${extractedText.slice(0, 120).trim()}`);
    } catch (e: any) {
      const msg =
        e.response?.status === 503
          ? 'OCR service is not available. Catalyst Zia OCR requires a live Catalyst environment; local fallback requires torch + transformers.'
          : e.response?.status === 422
          ? (e.response?.data?.error || 'Image failed content moderation and cannot be processed.')
          : e.response?.data?.error || 'OCR extraction failed';
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: `⚠ ${msg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setOcrLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <BaseLayout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 3.5rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">Intelligence Chat</h1>
              {isMockMode && (
                <span className="badge bg-amber-100 text-amber-800 border border-amber-300">
                  🧪 Mock Mode Active
                </span>
              )}
            </div>
            {user && (
              <p className="page-subtitle">
                {user.role} · Station {user.station_id ?? '—'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Selector */}
            <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  language === 'en'
                    ? 'bg-accent text-white font-medium'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('kn')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  language === 'kn'
                    ? 'bg-accent text-white font-medium'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                ಕನ್ನಡ (Kannada)
              </button>
            </div>

            {/* Print / PDF Export */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="btn btn-secondary text-xs gap-1.5"
              title="Export report as PDF"
            >
              📄 Export PDF
            </button>

            {/* OCR upload */}
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
              {ocrLoading ? (
                <>
                  <span className="spinner w-3.5 h-3.5" />
                  Extracting…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* OCR result block */}
              {msg.type === 'ocr' ? (
                <div className="max-w-2xl w-full card p-4 shadow-panel border-accent-border">
                  {/* Header row: title + engine badge */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-2xs font-semibold text-accent uppercase tracking-wider">
                      📄 OCR Extracted Text
                    </p>
                    {msg.ocrEngine && (
                      <span className={`text-2xs px-2 py-0.5 rounded border font-mono ${
                        msg.ocrEngine === 'zia'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {msg.ocrEngine === 'zia' ? '✓ Catalyst Zia OCR' : '⚠ Local TrOCR fallback'}
                      </span>
                    )}
                  </div>

                  {/* Extracted text */}
                  <pre className="text-xs text-ink whitespace-pre-wrap font-mono leading-relaxed bg-surface-muted rounded p-3 max-h-48 overflow-y-auto border border-slate-100">
                    {msg.text}
                  </pre>

                  {/* Zia Text Analytics enrichment */}
                  {msg.ocrAnalytics && (
                    (msg.ocrAnalytics.keywords?.length ?? 0) > 0 ||
                    msg.ocrAnalytics.sentiment
                  ) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {/* Keywords */}
                      {(msg.ocrAnalytics.keywords?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-2xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                            Zia Keywords Detected
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {msg.ocrAnalytics.keywords!.slice(0, 10).map((kw) => (
                              <button
                                key={kw}
                                type="button"
                                onClick={() => setInput(`Show cases related to: ${kw}`)}
                                className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-2xs hover:bg-blue-100 transition-colors"
                                title={`Query: Show cases related to ${kw}`}
                              >
                                {kw}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sentiment */}
                      {msg.ocrAnalytics.sentiment && (
                        <div className="flex items-center gap-2 text-2xs text-ink-muted">
                          <span className="font-semibold uppercase tracking-wider">Zia Sentiment:</span>
                          <span className={`px-2 py-0.5 rounded border font-medium ${
                            msg.ocrAnalytics.sentiment === 'positive'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : msg.ocrAnalytics.sentiment === 'negative'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {msg.ocrAnalytics.sentiment}
                            {msg.ocrAnalytics.sentiment_score != null &&
                              ` (${(msg.ocrAnalytics.sentiment_score * 100).toFixed(0)}%)`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-2xs text-ink-muted mt-2">
                    Text extracted · click a keyword or type in the input below to query this document
                  </p>
                </div>
              ) : (
                <div
                  className={`max-w-2xl rounded px-4 py-3 text-sm shadow-card ${
                    msg.type === 'user'
                      ? 'bg-navy text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-ink rounded-bl-none'
                  }`}
                >
                  {/* Message Body (with Kannada font support if language === 'kn') */}
                  <div className={msg.language === 'kn' ? 'lang-kn text-base' : ''}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* FIR Data Table */}
                  {msg.data && msg.data.length > 0 && (
                    <div className="mt-3 overflow-x-auto rounded border border-slate-200">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {['FIR No', 'Date', 'Station', 'Crime Type', 'Status'].map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.data.slice(0, 10).map((row: any, i: number) => (
                            <tr key={i}>
                              <td className="font-mono text-accent">
                                {row.crime_no ?? row.crimeno ?? row.CrimeNo ?? '—'}
                              </td>
                              <td>
                                {row.date || row.crimeregistereddate
                                  ? new Date(row.date || row.crimeregistereddate).toLocaleDateString('en-GB')
                                  : '—'}
                              </td>
                              <td>{row.station ?? row.stationname ?? row.StationName ?? '—'}</td>
                              <td>{row.crime_type ?? row.crimeheadname ?? row.CrimeHeadName ?? '—'}</td>
                              <td>
                                <span className="badge badge-neutral">{row.status ?? row.Status ?? '—'}</span>
                              </td>
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

                  {/* Evidence Trail Panel Component */}
                  {msg.type === 'assistant' && msg.explanation && (
                    <EvidenceTrailPanel explanation={msg.explanation} defaultExpanded={false} />
                  )}

                  {/* Timestamp & Speaker Action */}
                  <div className="flex items-center justify-between mt-2 pt-1 text-2xs text-ink-muted border-t border-slate-100">
                    <span>{msg.timestamp.toLocaleTimeString()}</span>
                    {msg.type === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => speakMessage(msg.text, msg.language)}
                        className="hover:text-accent flex items-center gap-1 transition-colors"
                        title="Read message aloud"
                      >
                        🔊 Read Aloud
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded rounded-bl-none px-4 py-3 shadow-card flex items-center gap-2 text-xs text-ink-secondary">
                <span className="spinner w-4 h-4" />
                Processing intent & RLS filters…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Example chips */}
        {messages.length <= 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-accent hover:text-accent rounded text-xs text-ink-secondary transition-colors shadow-card"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            {/* Mic button (Speech-to-Text) */}
            <button
              type="button"
              onClick={toggleListening}
              className={`btn px-3 text-xs ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-white border border-slate-300 text-ink-secondary hover:bg-slate-50'
              }`}
              title={isListening ? 'Listening… click to stop' : 'Click to speak query'}
            >
              🎤 {isListening ? 'Listening…' : ''}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'kn'
                  ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ…'
                  : 'Enter crime query or click mic to speak…'
              }
              disabled={loading}
              className={`input flex-1 ${language === 'kn' ? 'lang-kn' : ''}`}
            />
            <button
              type="submit"
              disabled={loading || cooldown || !input.trim()}
              className="btn btn-primary px-5"
            >
              {cooldown ? 'Wait…' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </BaseLayout>
  );
}
