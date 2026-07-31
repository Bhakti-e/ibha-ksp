/**
 * API Client for Ibha Backend
 * ---------------------------
 * Centralized API calls to the Catalyst/AppSail backend.
 */

import axios, { AxiosError } from 'axios';
import type {
  ChatRequest,
  ChatResponse,
  AuditRequest,
  DocumentUploadMeta,
  DocumentPending,
  IngestionReviewPayload,
  HealthResponse,
  ApiError,
} from './types';

// The frontend uses the same-domain Next.js rewrite by default.
// In production, /api/v1/* is forwarded by next.config.js to AppSail.
const BASE_URL =
  process.env.NEXT_PUBLIC_CATALYST_API_BASE_URL?.trim() || '/api/v1';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isUsableToken(token: string | null): token is string {
  if (!token) return false;

  const normalized = token.trim().toLowerCase();

  return (
    normalized !== '' &&
    normalized !== 'undefined' &&
    normalized !== 'null' &&
    normalized !== '[object object]'
  );
}

function clearStoredAuthentication(): void {
  if (!isBrowser()) return;

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

function redirectToLogin(): void {
  if (!isBrowser()) return;

  // Avoid repeatedly reloading the login page.
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

// Create one Axios instance for all backend calls.
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add the saved bearer token to protected requests.
apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';

    const isLoginRequest =
      requestUrl.includes('/auth/login');

    if (
      status === 401 &&
      !isLoginRequest &&
      isBrowser()
    ) {
      clearStoredAuthentication();

      if (window.location.pathname !== '/login') {
        window.location.replace(
          `/login?reason=session_expired`
        );
      }
    }

    return Promise.reject(error);
  }
);
// Handle expired, missing, or rejected authentication.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      clearStoredAuthentication();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

// ==================== Health Check ====================

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}

// ==================== Chat ====================

export async function postChat(
  payload: ChatRequest
): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>('/chat', payload);
  return response.data;
}

// ==================== Audit ====================

export async function postAudit(
  payload: AuditRequest
): Promise<{ status: string }> {
  const response = await apiClient.post<{ status: string }>(
    '/audit',
    payload
  );

  return response.data;
}

// ==================== Knowledge Ingestion ====================

export async function uploadDocument(
  file: File,
  metadata: DocumentUploadMeta
): Promise<{
  status: string;
  document_id: string;
  message: string;
}> {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await apiClient.post(
    '/ingest/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export async function approveDocument(
  payload: IngestionReviewPayload
): Promise<{ status: string; document_id: string }> {
  const response = await apiClient.post('/ingest/approve', {
    ...payload,
    action: 'approve',
  });

  return response.data;
}

export async function rejectDocument(
  payload: IngestionReviewPayload
): Promise<{ status: string; document_id: string }> {
  const response = await apiClient.post('/ingest/reject', {
    ...payload,
    action: 'reject',
  });

  return response.data;
}

export async function getPendingDocuments(
  limit: number = 50,
  offset: number = 0
): Promise<{
  documents: DocumentPending[];
  total: number;
}> {
  const response = await apiClient.get('/ingest/pending', {
    params: { limit, offset },
  });

  return response.data;
}

// ==================== Authentication ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  user_id: string;
  role: string;
  station_id: string;
  district_id: string;
  email: string;
  full_name: string;
}

export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}

function parseJsonString(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

/**
 * Catalyst/AppSail responses may arrive in different wrappers:
 *
 * { token, user }
 * { data: { token, user } }
 * { body: { token, user } }
 * { body: "{\"token\":\"...\",\"user\":{...}}" }
 * { data: { body: "..." } }
 *
 * This function safely unwraps those forms.
 */
function unwrapLoginResponse(value: unknown): LoginResponse | null {
  let current: unknown = value;

  for (let depth = 0; depth < 8; depth += 1) {
    if (typeof current === 'string') {
      const parsed = parseJsonString(current);

      if (parsed === current) {
        return null;
      }

      current = parsed;
      continue;
    }

    if (!current || typeof current !== 'object') {
      return null;
    }

    const record = current as Record<string, unknown>;

    const possibleToken =
      record.token ??
      record.access_token ??
      record.auth_token ??
      record.accessToken;

    const possibleUser =
      record.user ??
      record.user_data ??
      record.profile;

    if (
      typeof possibleToken === 'string' &&
      isUsableToken(possibleToken) &&
      possibleUser &&
      typeof possibleUser === 'object'
    ) {
      return {
        token: possibleToken,
        user: possibleUser as AuthenticatedUser,
      };
    }

    if ('data' in record) {
      current = record.data;
      continue;
    }

    if ('body' in record) {
      current = record.body;
      continue;
    }

    if ('result' in record) {
      current = record.result;
      continue;
    }

    if ('response' in record) {
      current = record.response;
      continue;
    }

    return null;
  }

  return null;
}

export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  // Remove any old broken token before a fresh login attempt.
  clearStoredAuthentication();

  const response = await apiClient.post<unknown>(
    '/auth/login',
    credentials
  );

  const loginData = unwrapLoginResponse(response.data);

  if (!loginData) {
    console.error('Unexpected login response:', response.data);

    throw new Error(
      'Login failed because the server did not return a valid authentication token.'
    );
  }

  return loginData;
}

export function saveAuthentication(
  authentication: LoginResponse
): void {
  if (!isBrowser()) {
    throw new Error(
      'Authentication can only be saved in the browser.'
    );
  }

  if (!isUsableToken(authentication.token)) {
    clearStoredAuthentication();

    throw new Error(
      'The server returned an invalid authentication token.'
    );
  }

  if (!authentication.user) {
    clearStoredAuthentication();

    throw new Error(
      'The server did not return the signed-in user information.'
    );
  }

  localStorage.setItem(AUTH_TOKEN_KEY, authentication.token);
  localStorage.setItem(
    USER_DATA_KEY,
    JSON.stringify(authentication.user)
  );
}

export function logout(): void {
  clearStoredAuthentication();
  redirectToLogin();
}

export function getAuthToken(): string | null {
  if (!isBrowser()) return null;

  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!isUsableToken(token)) {
    clearStoredAuthentication();
    return null;
  }

  return token;
}

export function getCurrentUser(): AuthenticatedUser | null {
  if (!isBrowser()) return null;

  const userData = localStorage.getItem(USER_DATA_KEY);

  if (
    !userData ||
    userData === 'undefined' ||
    userData === 'null'
  ) {
    localStorage.removeItem(USER_DATA_KEY);
    return null;
  }

  try {
    const parsed = JSON.parse(userData);

    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(USER_DATA_KEY);
      return null;
    }

    return parsed as AuthenticatedUser;
  } catch {
    // The old code removed "user" instead of "user_data".
    localStorage.removeItem(USER_DATA_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken() && getCurrentUser());
}

// ==================== Trends & Hotspots ====================

export interface Hotspot {
  station_id: number;
  station_name: string;
  crime_count: number;
  heinous_count: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  change_percentage: number;
}

export interface TrendData {
  month: string;
  case_count: number;
  crime_type: string;
  unique_crimes: number;
}

export async function getHotspots(
  days: number = 30
): Promise<{
  hotspots: Hotspot[];
  period_days: number;
}> {
  const response = await apiClient.get('/trends/hotspots', {
    params: { days },
  });

  return response.data;
}

export async function getTrendsSummary(
  months: number = 12
): Promise<{
  trends: TrendData[];
  period_months: number;
}> {
  const response = await apiClient.get('/trends/summary', {
    params: { months },
  });

  return response.data;
}

// ==================== Criminal Network ====================

export interface NetworkNode {
  data: {
    id: string;
    label: string;
    type: 'person' | 'case';
    age?: number;
    is_central?: boolean;
    crime_type?: string;
    description?: string;
  };
}

export interface NetworkEdge {
  data: {
    id: string;
    source: string;
    target: string;
    relationship: 'ACCUSED_IN' | 'CO_ACCUSED';
    case_id?: string;
  };
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  central_person_id: string;
  metadata: {
    total_nodes: number;
    total_edges: number;
    cases_count: number;
  };
}

export async function getNetwork(
  personId: string
): Promise<NetworkGraph> {
  const response = await apiClient.get(
    `/network/accused/${personId}`
  );

  return response.data;
}

// ==================== Admin ====================

export interface AuditLog {
  log_id: number;
  user_id: string;
  role: string;
  station_id: number;
  district_id: number;
  query_text: string;
  intent: string;
  filters_applied: unknown;
  result_count: number;
  timestamp: string;
}

export async function getAuditLogs(params?: {
  limit?: number;
  user_id?: string;
  from_date?: string;
  to_date?: string;
}): Promise<{
  logs: AuditLog[];
  count: number;
}> {
  const response = await apiClient.get('/admin/audit-logs', {
    params,
  });

  return response.data;
}

export interface SystemStats {
  total_cases: number;
  total_users: number;
  total_queries_today: number;
  top_querying_users: Array<{
    user_id: string;
    query_count: number;
  }>;
  database_health: 'OK' | 'WARNING' | 'ERROR';
}

export async function getSystemStats(): Promise<SystemStats> {
  const response = await apiClient.get('/admin/stats');
  return response.data;
}

// ==================== Sociological Insights ====================

export async function getSocioInsights(params?: {
  crime_type?: string;
  date_from?: string;
  date_to?: string;
}): Promise<unknown> {
  const response = await apiClient.get('/insights/socio', {
    params,
  });

  return response.data;
}

// ==================== Decision Support ====================

export async function getCaseSummary(
  caseId: string | number
): Promise<unknown> {
  const response = await apiClient.get(
    `/support/case-summary/${caseId}`
  );

  return response.data;
}

export async function getSimilarCases(
  caseId: string | number
): Promise<unknown> {
  const response = await apiClient.get(
    `/support/similar-cases/${caseId}`
  );

  return response.data;
}

// ==================== Trend Forecasting ====================

export async function getTrendForecast(params?: {
  crime_type?: string;
  months?: number;
}): Promise<unknown> {
  const response = await apiClient.get('/trends/forecast', {
    params,
  });

  return response.data;
}

// ==================== Financial Crime ====================

export async function getFinancialLinks(
  accusedId: string | number
): Promise<unknown> {
  const response = await apiClient.get(
    `/network/financial/${accusedId}`
  );

  return response.data;
}

// ==================== Error Handling ====================

export function isApiError(
  error: unknown
): error is AxiosError<ApiError> {
  return axios.isAxiosError(error);
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const responseData = error.response?.data;

    if (
      responseData &&
      typeof responseData === 'object' &&
      'message' in responseData &&
      typeof responseData.message === 'string'
    ) {
      return responseData.message;
    }

    return error.message || 'An API error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred.';
}

export default apiClient;