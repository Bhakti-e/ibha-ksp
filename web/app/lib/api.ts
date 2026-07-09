/**
 * API Client for Ibha Backend
 * ----------------------------
 * Centralized API calls to Catalyst Serverless Functions
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

// Base URL from environment variable
const BASE_URL = process.env.NEXT_PUBLIC_CATALYST_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    // TODO: Replace with proper Catalyst Auth integration
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
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

export async function postChat(payload: ChatRequest): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>('/chat', payload);
  return response.data;
}

// ==================== Audit ====================

export async function postAudit(payload: AuditRequest): Promise<{ status: string }> {
  const response = await apiClient.post<{ status: string }>('/audit', payload);
  return response.data;
}

// ==================== Knowledge Ingestion ====================

export async function uploadDocument(
  file: File,
  metadata: DocumentUploadMeta
): Promise<{ status: string; document_id: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await apiClient.post('/ingest/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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
): Promise<{ documents: DocumentPending[]; total: number }> {
  const response = await apiClient.get('/ingest/pending', {
    params: { limit, offset },
  });
  return response.data;
}

// ==================== Authentication (Placeholder) ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    user_id: string;
    role: string;
    station_id: string;
    district_id: string;
    email: string;
    full_name: string;
  };
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  // Real login call to backend auth endpoint
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  window.location.href = '/login';
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
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

export async function getHotspots(days: number = 30): Promise<{ hotspots: Hotspot[]; period_days: number }> {
  const response = await apiClient.get('/trends/hotspots', {
    params: { days }
  });
  return response.data;
}

export async function getTrendsSummary(months: number = 12): Promise<{ trends: TrendData[]; period_months: number }> {
  const response = await apiClient.get('/trends/summary', {
    params: { months }
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

export async function getNetwork(personId: string): Promise<NetworkGraph> {
  const response = await apiClient.get(`/network/accused/${personId}`);
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
  filters_applied: any;
  result_count: number;
  timestamp: string;
}

export async function getAuditLogs(params?: {
  limit?: number;
  user_id?: string;
  from_date?: string;
  to_date?: string;
}): Promise<{ logs: AuditLog[]; count: number }> {
  const response = await apiClient.get('/admin/audit-logs', { params });
  return response.data;
}

export interface SystemStats {
  total_cases: number;
  total_users: number;
  total_queries_today: number;
  top_querying_users: Array<{ user_id: string; query_count: number }>;
  database_health: 'OK' | 'WARNING' | 'ERROR';
}

export async function getSystemStats(): Promise<SystemStats> {
  const response = await apiClient.get('/admin/stats');
  return response.data;
}

// ==================== Error Handling ====================

export function isApiError(error: any): error is AxiosError<ApiError> {
  return axios.isAxiosError(error);
}

export function getErrorMessage(error: any): string {
  if (isApiError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  return error?.message || 'An unknown error occurred';
}
