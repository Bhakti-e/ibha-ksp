/**
 * Mock API Fixtures for Ibha Frontend Development
 * ─────────────────────────────────────────────────
 * Use these during Track B frontend development so you can build
 * all UI components without waiting for the real backend.
 *
 * Usage pattern in any page/component:
 *   import { MOCK_CHAT_RESPONSE } from '@/lib/mocks/fixtures'
 *   // Replace with: const data = await postChat(payload)  when backend ready
 *
 * When your teammate's endpoint is ready, delete the mock import and
 * wire the real API call — the shape is identical.
 */

// ─────────────────────────────────────────────────────────────
// MOCK 1 — Chat Response (with Evidence Trail)
// Endpoint: POST /api/v1/chat
// Shape matches: ChatResponse in lib/types.ts
// ─────────────────────────────────────────────────────────────
export const MOCK_CHAT_RESPONSE_EN = {
  answer:
    'In the last 30 days, your station recorded **12 theft cases**. The peak was the week of July 1–7 with 5 cases, primarily around the Majestic bus stand area. 3 of these cases involve repeat accused on record.',
  intent: 'search_cases',
  result_count: 12,
  language: 'en',
  session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  explanation_contract: {
    reasoning_sketch: [
      'Detected intent: search_cases',
      'Crime type: theft (CrimeMinorHeadID: 1)',
      'Date range: last 30 days',
      'Location scope: my_station (RLS enforced)',
    ],
    sql_executed:
      'SELECT cm.CrimeNo, cm.CrimeRegisteredDate, cm.OffencePlace, ps.StationName ' +
      'FROM CaseMaster cm ' +
      'JOIN PoliceStation ps ON cm.PoliceStationID = ps.PoliceStationID ' +
      'WHERE cm.CrimeMinorHeadID IN (%s) ' +
      'AND cm.CrimeRegisteredDate >= %s ' +
      'AND cm.PoliceStationID = %s ' +
      'ORDER BY cm.CrimeRegisteredDate DESC LIMIT 50',
    sql_params_redacted: [
      '[crime_ids: [1]]',
      '[date_from: 2026-06-15]',
      '[station_id: FILTERED_BY_RLS]',
    ],
    rls_filters_applied: {
      role: 'Inspector',
      scope: 'station',
      station_id_applied: true,
      heinous_excluded: false,
    },
    row_count_returned: 12,
    llm_model_used: 'gemini-2.5-flash',
    fallback_active: false,
    tool_trail: [
      'llm_intent.extract_intent',
      'query_builder.build_search_query',
      'db.execute_query',
      'llm_intent.generate_answer',
    ],
    guardrails: [
      'RLS enforced (station scope)',
      'Parameterized queries (injection-safe)',
      'Result limit: 50 rows',
    ],
  },
  cases: [
    { case_id: 101, crime_no: 'KA/MJ/2026/0341', crime_type: 'Theft', date: '2026-07-12', place: 'Majestic Bus Stand', status: 'Under Investigation' },
    { case_id: 102, crime_no: 'KA/MJ/2026/0338', crime_type: 'Theft', date: '2026-07-10', place: 'City Market', status: 'Charge Sheet Filed' },
    { case_id: 103, crime_no: 'KA/MJ/2026/0330', crime_type: 'Theft', date: '2026-07-07', place: 'KSR Railway Station', status: 'Under Investigation' },
  ],
}

// ─────────────────────────────────────────────────────────────
// MOCK 1b — Chat Response in Kannada
// ─────────────────────────────────────────────────────────────
export const MOCK_CHAT_RESPONSE_KN = {
  answer:
    'ಕಳೆದ 30 ದಿನಗಳಲ್ಲಿ ನಿಮ್ಮ ಠಾಣೆಯಲ್ಲಿ **12 ಕಳ್ಳತನದ ಪ್ರಕರಣಗಳು** ದಾಖಲಾಗಿವೆ. ಜುಲೈ 1–7 ವಾರದಲ್ಲಿ 5 ಪ್ರಕರಣಗಳು ಅತಿ ಹೆಚ್ಚು, ಮುಖ್ಯವಾಗಿ ಮೆಜೆಸ್ಟಿಕ್ ಬಸ್ ನಿಲ್ದಾಣ ಪ್ರದೇಶದಲ್ಲಿ. ಈ ಪ್ರಕರಣಗಳಲ್ಲಿ 3 ಆರೋಪಿಗಳು ಹಿಂದಿನ ದಾಖಲೆಯುಳ್ಳ ವ್ಯಕ್ತಿಗಳು.',
  intent: 'search_cases',
  result_count: 12,
  language: 'kn',
  session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  explanation_contract: {
    reasoning_sketch: ['ಉದ್ದೇಶ ಪತ್ತೆಯಾಗಿದೆ: search_cases', 'ಅಪರಾಧ ವಿಧ: ಕಳ್ಳತನ', 'ಅವಧಿ: ಕಳೆದ 30 ದಿನ'],
    rls_filters_applied: { role: 'Inspector', scope: 'station', station_id_applied: true, heinous_excluded: false },
    row_count_returned: 12,
    llm_model_used: 'gemini-2.5-flash',
    fallback_active: false,
    tool_trail: ['llm_intent.extract_intent', 'query_builder.build_search_query', 'db.execute_query', 'llm_intent.generate_answer'],
    guardrails: ['RLS ಜಾರಿಯಲ್ಲಿದೆ (ಠಾಣೆ ವ್ಯಾಪ್ತಿ)', 'ಪ್ಯಾರಾಮೀಟರ್ ಕ್ವೆರಿಗಳು', 'ಫಲಿತಾಂಶ ಮಿತಿ: 50 ಸಾಲುಗಳು'],
    sql_executed: 'SELECT ... WHERE cm.PoliceStationID = %s',
    sql_params_redacted: ['[station_id: FILTERED_BY_RLS]'],
  },
  cases: [],
}

// ─────────────────────────────────────────────────────────────
// MOCK 1c — Chat Response with fallback_active = true
// (what it looks like when Gemini is unavailable)
// ─────────────────────────────────────────────────────────────
export const MOCK_CHAT_RESPONSE_FALLBACK = {
  answer: 'Found 8 cases matching your query.',
  intent: 'search_cases',
  result_count: 8,
  language: 'en',
  session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  explanation_contract: {
    reasoning_sketch: ['Fallback NLP used (keyword matching)', 'Gemini API unavailable'],
    rls_filters_applied: { role: 'Inspector', scope: 'station', station_id_applied: true, heinous_excluded: false },
    row_count_returned: 8,
    llm_model_used: 'nlp_simple (fallback)',
    fallback_active: true,          // ← triggers the amber "Basic mode" badge
    tool_trail: ['nlp_simple.extract_entities', 'query_builder.build_search_query', 'db.execute_query'],
    guardrails: ['RLS enforced (station scope)', 'Parameterized queries (injection-safe)'],
    sql_executed: 'SELECT ... WHERE cm.PoliceStationID = %s',
    sql_params_redacted: ['[station_id: FILTERED_BY_RLS]'],
  },
  cases: [],
}

// ─────────────────────────────────────────────────────────────
// MOCK 2 — Sociological Insights
// Endpoint: GET /api/v1/insights/socio
// ─────────────────────────────────────────────────────────────
export const MOCK_INSIGHTS = {
  period: { from: '2025-07-01', to: '2026-07-14' },
  crime_type_filter: null,
  demographic_breakdown: {
    by_time_of_day: [
      { bucket: 'Night (00–06)', count: 142 },
      { bucket: 'Morning (06–12)', count: 87 },
      { bucket: 'Afternoon (12–18)', count: 63 },
      { bucket: 'Evening (18–24)', count: 108 },
    ],
    by_occupation: [
      { occupation: 'Daily Wage Worker', count: 89 },
      { occupation: 'Unemployed', count: 74 },
      { occupation: 'Student', count: 41 },
      { occupation: 'Shop Owner/Trader', count: 33 },
      { occupation: 'Driver/Transport', count: 28 },
      { occupation: 'Other', count: 55 },
    ],
    by_age_group: [
      { group: 'Under 18', count: 22 },
      { group: '18–25', count: 121 },
      { group: '26–35', count: 108 },
      { group: '36–50', count: 64 },
      { group: 'Over 50', count: 5 },
    ],
    by_income_bracket: [
      { bracket: 'Below Poverty Line', count: 134 },
      { bracket: 'Low', count: 112 },
      { bracket: 'Middle', count: 56 },
      { bracket: 'High', count: 18 },
    ],
    by_area_type: [
      { type: 'Urban', count: 189 },
      { type: 'Semi-Urban', count: 98 },
      { type: 'Rural', count: 33 },
    ],
    by_education: [
      { level: 'None', count: 48 },
      { level: 'Primary', count: 97 },
      { level: 'Secondary', count: 111 },
      { level: 'Graduate', count: 56 },
      { level: 'Post-Graduate', count: 8 },
    ],
  },
  victim_profile: {
    by_occupation: [
      { occupation: 'Homemaker', count: 67 },
      { occupation: 'Shop Owner/Trader', count: 54 },
      { occupation: 'Student', count: 38 },
      { occupation: 'Daily Wage Worker', count: 31 },
      { occupation: 'Other', count: 48 },
    ],
    by_area_type: [
      { type: 'Urban', count: 162 },
      { type: 'Semi-Urban', count: 59 },
      { type: 'Rural', count: 17 },
    ],
  },
  llm_narrative:
    'Theft and assault cases are most frequently reported during night hours (00–06), accounting for 35% of all incidents — consistent with reduced civilian and patrol presence. Accused aged 18–35 represent 72% of all cases, with daily wage workers and the unemployed forming the largest occupational groups. Victims are disproportionately urban, with shop owners and homemakers accounting for the majority of reported victims. These patterns suggest a concentration of opportunistic property crime in commercial and residential urban zones during low-visibility hours.',
  data_grounded: true,
}

// ─────────────────────────────────────────────────────────────
// MOCK 3 — Case Summary + Similar Cases
// Endpoint: GET /api/v1/support/case-summary/:id
// ─────────────────────────────────────────────────────────────
export const MOCK_CASE_SUMMARY = {
  case_id: 101,
  crime_no: 'KA/MJ/2026/0341',
  crime_type: 'Theft under IPC Section 379',
  registered_date: '2026-07-12',
  station: 'Majestic Police Station',
  status: 'Under Investigation',
  investigating_officer: 'SI Priya Nair',
  offence_place: 'Platform 4, KSR Railway Station, Bengaluru',
  llm_summary:
    'Case KA/MJ/2026/0341 involves the theft of a mobile phone and cash (₹4,200) from a commuter at KSR Railway Station on July 12, 2026. The accused, Ramesh Babu (AccusedID: 42), was apprehended at the scene after being identified by a witness. Ramesh Babu has 3 prior FIR entries for theft at railway premises in the same district. The case is currently under investigation; the stolen items have not been recovered. Charge sheet is expected within 30 days per station SOP.',
  accused: [
    {
      accused_id: 42,
      name: 'Ramesh Babu',
      age: 28,
      prior_firs: 3,
      risk_tier: 'HIGH',
      risk_score: 52.3,
    },
  ],
  victims: [
    { name: 'Suresh Kumar', age: 34, occupation: 'IT Professional', area_type: 'Urban' },
  ],
}

export const MOCK_SIMILAR_CASES = {
  case_id: 101,
  similar_cases: [
    { case_id: 89,  crime_no: 'KA/MJ/2026/0291', crime_type: 'Theft', date: '2026-06-04', place: 'KSR Railway Station', similarity_reason: 'Same station, same crime type, within 6 months' },
    { case_id: 76,  crime_no: 'KA/MJ/2026/0201', crime_type: 'Theft', date: '2026-04-18', place: 'Majestic Bus Stand', similarity_reason: 'Same station, same crime type, within 6 months' },
    { case_id: 58,  crime_no: 'KA/MJ/2025/0889', crime_type: 'Theft', date: '2025-11-22', place: 'KSR Railway Station', similarity_reason: 'Same station, same crime type, within 6 months' },
    { case_id: 47,  crime_no: 'KA/MJ/2025/0712', crime_type: 'Theft', date: '2025-09-01', place: 'City Market', similarity_reason: 'Same station, same crime type' },
    { case_id: 31,  crime_no: 'KA/MJ/2025/0501', crime_type: 'Theft', date: '2025-06-14', place: 'Gandhi Nagar', similarity_reason: 'Same station, same crime type' },
  ],
}

// ─────────────────────────────────────────────────────────────
// MOCK 4 — Trend Forecast
// Endpoint: GET /api/v1/trends/forecast
// ─────────────────────────────────────────────────────────────
export const MOCK_TREND_FORECAST = {
  method: 'linear_ols_projection',
  crime_type: 'All',
  historical: [
    { month: '2025-08', case_count: 38 },
    { month: '2025-09', case_count: 42 },
    { month: '2025-10', case_count: 45 },
    { month: '2025-11', case_count: 41 },
    { month: '2025-12', case_count: 39 },
    { month: '2026-01', case_count: 44 },
    { month: '2026-02', case_count: 47 },
    { month: '2026-03', case_count: 51 },
    { month: '2026-04', case_count: 53 },
    { month: '2026-05', case_count: 58 },
    { month: '2026-06', case_count: 61 },
    { month: '2026-07', case_count: 64 },
  ],
  projection: [
    { month: '2026-08', case_count: 67, is_projected: true },
    { month: '2026-09', case_count: 70, is_projected: true },
    { month: '2026-10', case_count: 73, is_projected: true },
  ],
  // early_warning is non-null when projected month > 1.5× trailing 6-month average
  early_warning:
    'Projected case volume for August–October 2026 (67–73 cases/month) is 18% above the 6-month rolling average of 56 cases. The upward trend has been consistent for 7 consecutive months. Consider reviewing patrol allocation and increasing presence in previously identified hotspot areas before August.',
  trailing_6mo_avg: 56.2,
}

// ─────────────────────────────────────────────────────────────
// MOCK 5 — Network Graph with Risk Scores
// Endpoint: GET /api/v1/network/accused/:id
// Extends the existing NetworkGraph type in lib/api.ts
// ─────────────────────────────────────────────────────────────
export const MOCK_NETWORK_WITH_RISK = {
  nodes: [
    {
      data: {
        id: 'person_42',
        label: 'Ramesh Babu',
        type: 'person',
        age: 28,
        is_central: true,
        risk_tier: 'HIGH',
        risk_score: 52.3,
        score_explanation: {
          prior_fir_capped_contribution: 30.0,
          recency_decay_contribution: 2.3,
          violent_crime_contribution: 0.0,
          degree_centrality_contribution: 20.0,
          total_risk_score: 52.3,
          note: 'Attention-routing heuristic only. Not for legal use.',
        },
      },
    },
    {
      data: {
        id: 'person_55',
        label: 'Vijay S.',
        type: 'person',
        age: 31,
        is_central: false,
        risk_tier: 'CRITICAL',
        risk_score: 74.1,
        score_explanation: {
          prior_fir_capped_contribution: 50.0,
          recency_decay_contribution: 4.1,
          violent_crime_contribution: 20.0,
          degree_centrality_contribution: 0.0,
          total_risk_score: 74.1,
          note: 'Attention-routing heuristic only. Not for legal use.',
        },
      },
    },
    { data: { id: 'person_61', label: 'Anand R.', type: 'person', age: 24, is_central: false, risk_tier: 'LOW', risk_score: 10.0, score_explanation: null } },
    { data: { id: 'case_101', label: 'KA/MJ/2026/0341\nTheft', type: 'case', crime_type: 'Theft' } },
    { data: { id: 'case_89',  label: 'KA/MJ/2026/0291\nTheft', type: 'case', crime_type: 'Theft' } },
  ],
  edges: [
    { data: { id: 'e1', source: 'person_42', target: 'case_101', relationship: 'ACCUSED_IN', case_id: '101' } },
    { data: { id: 'e2', source: 'person_55', target: 'case_101', relationship: 'ACCUSED_IN', case_id: '101' } },
    { data: { id: 'e3', source: 'person_42', target: 'case_89',  relationship: 'ACCUSED_IN', case_id: '89' } },
    { data: { id: 'e4', source: 'person_61', target: 'case_89',  relationship: 'ACCUSED_IN', case_id: '89' } },
    { data: { id: 'e5', source: 'person_42', target: 'person_55', relationship: 'CO_ACCUSED', case_id: '101' } },
  ],
  central_person_id: 'person_42',
  metadata: { total_nodes: 5, total_edges: 5, cases_count: 2 },
}

// ─────────────────────────────────────────────────────────────
// MOCK 6 — Financial Transactions Overlay
// Endpoint: GET /api/v1/network/financial/:accused_id
// ─────────────────────────────────────────────────────────────
export const MOCK_FINANCIAL_LINKS = {
  accused_id: 55,
  transactions: [
    { txn_id: 1, sender_name: 'Vijay S.',   receiver_name: 'Kiran M.',   amount: 9800,  txn_date: '2026-05-01', txn_type: 'UPI',           is_suspicious: true,  suspicion_flag: 'Structuring — below ₹10k threshold' },
    { txn_id: 2, sender_name: 'Vijay S.',   receiver_name: 'Kiran M.',   amount: 9800,  txn_date: '2026-05-03', txn_type: 'UPI',           is_suspicious: true,  suspicion_flag: 'Structuring — below ₹10k threshold' },
    { txn_id: 3, sender_name: 'Vijay S.',   receiver_name: 'Kiran M.',   amount: 9800,  txn_date: '2026-05-05', txn_type: 'Bank Transfer', is_suspicious: true,  suspicion_flag: 'Structuring — below ₹10k threshold' },
    { txn_id: 4, sender_name: 'Kiran M.',   receiver_name: 'Ramesh Babu', amount: 28900, txn_date: '2026-05-06', txn_type: 'Cash',          is_suspicious: true,  suspicion_flag: 'Round-trip — returned to network within 72h' },
    { txn_id: 5, sender_name: 'Ramesh Babu', receiver_name: 'Vijay S.',  amount: 27500, txn_date: '2026-05-07', txn_type: 'UPI',           is_suspicious: true,  suspicion_flag: 'Round-trip — returned to origin' },
    { txn_id: 6, sender_name: 'Vijay S.',   receiver_name: 'Unknown',    amount: 1200,  txn_date: '2026-06-10', txn_type: 'UPI',           is_suspicious: false, suspicion_flag: null },
  ],
}

// ─────────────────────────────────────────────────────────────
// MOCK 7 — Hotspots (already wired, included for completeness)
// Endpoint: GET /api/v1/trends/hotspots
// ─────────────────────────────────────────────────────────────
export const MOCK_HOTSPOTS = {
  period_days: 30,
  hotspots: [
    { station_id: 3, station_name: 'Majestic PS',       crime_count: 64, heinous_count: 4, risk_level: 'HIGH',   reason: 'Sustained rise — 7 consecutive months above baseline', change_percentage: 18 },
    { station_id: 7, station_name: 'Shivajinagar PS',   crime_count: 51, heinous_count: 2, risk_level: 'MEDIUM', reason: 'Above district average for theft and assault',           change_percentage: 9 },
    { station_id: 12, station_name: 'Yelahanka PS',     crime_count: 39, heinous_count: 1, risk_level: 'LOW',    reason: 'Stable — within normal seasonal range',                  change_percentage: -3 },
  ],
}
