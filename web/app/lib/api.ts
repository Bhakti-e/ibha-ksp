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
const BASE_URL = process.env.NEXT_PUBLIC_CATALYST_API_BASE_URL || 'http://localhost:3000/api/v1';

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
  // TODO: Replace with real Catalyst Auth integration
  // For scaffold, simulate login
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = 'demo_token_' + Date.now();
      const mockUser = {
        user_id: 'USR_DEMO_001',
        role: credentials.email.includes('admin') ? 'Admin' : 'Constable',
        station_id: 'STN_KORAMANGALA',
        district_id: 'DIST_BANGALORE_SOUTH',
        email: credentials.email,
        full_name: 'Demo User',
      };
      resolve({ token: mockToken, user: mockUser });
    }, 1000);
  });
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
