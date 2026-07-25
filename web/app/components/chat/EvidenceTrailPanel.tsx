'use client';

import { useState } from 'react';
import { ExplanationContract } from '@/lib/types';

interface EvidenceTrailPanelProps {
  explanation: ExplanationContract;
  defaultExpanded?: boolean;
}

export default function EvidenceTrailPanel({
  explanation,
  defaultExpanded = false,
}: EvidenceTrailPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  if (!explanation) return null;

  const {
    reasoning_sketch = [],
    sql_executed,
    sql_params_redacted = [],
    rls_filters_applied,
    row_count_returned,
    llm_model_used,
    fallback_active = false,
    tool_trail = [],
    guardrails = [],
    confidence,
  } = explanation;

  const scope = rls_filters_applied?.scope ?? 'station';

  // Badge styles based on RLS scope
  const getRlsScopeBadge = () => {
    switch (scope.toLowerCase()) {
      case 'station':
        return (
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
            🛡️ Station-scoped RLS
          </span>
        );
      case 'district':
        return (
          <span className="badge bg-purple-50 text-purple-700 border border-purple-200">
            🛡️ District-scoped RLS
          </span>
        );
      case 'state':
        return (
          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
            🌐 State-wide Access
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral">
            🛡️ RLS Enforced
          </span>
        );
    }
  };

  const handleCopySql = () => {
    if (!sql_executed) return;
    navigator.clipboard.writeText(sql_executed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/70 overflow-hidden text-xs transition-all">
      {/* Header / Toggle Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none bg-slate-100/80 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink flex items-center gap-1">
            <svg
              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            Evidence Trail & Audit
          </span>

          {/* RLS Scope Badge */}
          {getRlsScopeBadge()}

          {/* Fallback Active Badge */}
          {fallback_active && (
            <span className="fallback-badge" title="Gemini API unavailable; keyword NLP fallback used">
              ⚠️ Basic mode (AI unavailable)
            </span>
          )}

          {/* Row Count Pill */}
          {row_count_returned !== undefined && (
            <span className="badge badge-neutral bg-white">
              {row_count_returned} {row_count_returned === 1 ? 'row' : 'rows'}
            </span>
          )}

          {/* LLM Model Pill */}
          {llm_model_used && (
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
              {llm_model_used}
            </span>
          )}
        </div>

        <span className="text-2xs text-ink-muted">
          {expanded ? 'Hide details ▲' : 'Show details ▼'}
        </span>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 space-y-3 bg-white border-t border-slate-200 animate-fade-in">
          {/* Reasoning Sketch */}
          {reasoning_sketch.length > 0 && (
            <div>
              <p className="text-2xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                🧠 Intent & Reasoning Steps
              </p>
              <ul className="space-y-1 pl-2 border-l-2 border-accent/40 text-ink-secondary">
                {reasoning_sketch.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    • {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Executed SQL (Params Redacted) */}
          {sql_executed && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-2xs font-semibold text-ink-secondary uppercase tracking-wider flex items-center gap-1">
                  💻 Executed SQL (Parameterized & Redacted)
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopySql();
                  }}
                  className="text-2xs text-accent hover:underline flex items-center gap-1"
                >
                  {copied ? '✓ Copied' : '📋 Copy SQL'}
                </button>
              </div>
              <pre className="p-2.5 rounded bg-slate-900 text-slate-100 font-mono text-2xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                {sql_executed}
              </pre>

              {/* Redacted Params List */}
              {sql_params_redacted.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-2xs text-ink-muted font-medium">Redacted Params:</span>
                  {sql_params_redacted.map((param, i) => (
                    <span
                      key={i}
                      className="font-mono text-2xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tool Trail */}
          {tool_trail.length > 0 && (
            <div>
              <p className="text-2xs font-semibold text-ink-secondary uppercase tracking-wider mb-1">
                ⚙️ Execution Pipeline Trail
              </p>
              <div className="flex flex-wrap items-center gap-1 text-2xs font-mono">
                {tool_trail.map((tool, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100">
                      {tool}
                    </span>
                    {i < tool_trail.length - 1 && (
                      <span className="text-slate-400 font-bold">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Guardrails Enforced */}
          {guardrails.length > 0 && (
            <div>
              <p className="text-2xs font-semibold text-ink-secondary uppercase tracking-wider mb-1">
                🔒 Security & Governance Guardrails
              </p>
              <div className="flex flex-wrap gap-1.5">
                {guardrails.map((g, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    ✓ {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* RLS Filter Details Footer */}
          {rls_filters_applied && (
            <div className="pt-2 border-t border-slate-100 text-2xs text-ink-muted flex flex-wrap justify-between gap-2">
              <span>
                Officer Role: <strong className="text-slate-700">{rls_filters_applied.role ?? 'Unknown'}</strong>
              </span>
              <span>
                Station Filter Applied: <strong className="text-slate-700">{rls_filters_applied.station_id_applied ? 'YES' : 'NO'}</strong>
              </span>
              <span>
                Heinous Excluded: <strong className="text-slate-700">{rls_filters_applied.heinous_excluded ? 'YES' : 'NO'}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
