'use client';

import { useState, useRef, useEffect } from 'react';
import { postChat, getCurrentUser } from '@/lib/api';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  data?: any[];
  citations?: string[];
  explanation?: any;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = getCurrentUser();
    if (!userData) {
      window.location.href = '/login';
      return;
    }
    setUser(userData);

    // Welcome message
    setMessages([
      {
        id: '0',
        type: 'assistant',
        text: `Welcome, ${userData.full_name}! Ask me about crime cases in your jurisdiction.`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await postChat({
        query: input,
        mode: 'text',
        language: 'en',
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: response.answer,
        data: (response as any).data || [],
        citations: (response as any).citations || [],
        explanation: response.explanation_contract,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: error.response?.data?.error || 'Sorry, an error occurred. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Crime Intelligence Chat</h1>
            <p className="text-sm text-foreground-muted mt-1">
              {user?.role} • {user?.station_id || 'Station'}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="btn btn-secondary text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>

              {/* Data Table */}
              {message.data && message.data.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs border border-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left">FIR No</th>
                        <th className="px-2 py-1 text-left">Date</th>
                        <th className="px-2 py-1 text-left">Station</th>
                        <th className="px-2 py-1 text-left">Crime Type</th>
                        <th className="px-2 py-1 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {message.data.slice(0, 10).map((row: any, idx: number) => (
                        <tr key={idx} className="border-t border-border hover:bg-muted/50">
                          <td className="px-2 py-1">{row.crimeno || row.CrimeNo}</td>
                          <td className="px-2 py-1">
                            {new Date(row.crimeregistereddate || row.CrimeRegisteredDate).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1">{row.stationname || row.StationName}</td>
                          <td className="px-2 py-1">{row.crimeheadname || row.CrimeHeadName}</td>
                          <td className="px-2 py-1">
                            <span className="px-2 py-0.5 bg-muted rounded text-xs">
                              {row.status || row.Status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {message.data.length > 10 && (
                    <p className="text-xs text-foreground-muted mt-2">
                      Showing 10 of {message.data.length} results
                    </p>
                  )}
                </div>
              )}

              {/* Explanation */}
              {message.explanation && (
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-foreground-muted hover:text-foreground">
                    View Explanation
                  </summary>
                  <div className="mt-2 p-2 bg-muted/50 rounded space-y-1">
                    {message.explanation.reasoning_sketch?.map((step: string, idx: number) => (
                      <p key={idx}>• {step}</p>
                    ))}
                  </div>
                </details>
              )}

              <p className="text-xs text-foreground-muted mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border px-6 py-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about crime cases, trends, or suspects..."
            className="input flex-1"
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
        <p className="text-xs text-foreground-muted mt-2">
          Try: "Show theft cases in last 30 days" or "How many cases this month?"
        </p>
      </div>
    </div>
  );
}
