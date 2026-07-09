/**
 * TypeScript Type Definitions for Ibha
 * -------------------------------------
 * Shared types for frontend-backend communication
 */

// ==================== Authentication ====================

export interface UserClaims {
  user_id: string;
  role: 'Constable' | 'SI' | 'Inspector' | 'DSP' | 'SCRB_Analyst' | 'Admin';
  station_id: string;
  district_id: string;
  email: string;
  full_name?: string;
}

// ==================== Chat ====================

export interface ChatRequest {
  query: string;
  mode: 'text' | 'voice';
  language: 'en' | 'kn';
  conversation?: Array<{ role: string; text: string }>;
}

export interface Citation {
  chunk_id: string;
  source: string;
  text: string;
  metadata?: {
    station_id?: string;
    date?: string;
    crime_type?: string;
    [key: string]: any;
  };
}

export interface ExplanationContract {
  reasoning_sketch: string[];
  tool_trail: string[];
  guardrails: string[];
  confidence: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  explanation_contract: ExplanationContract;
  data?: any[];
  metadata?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  explanation?: ExplanationContract;
}

// ==================== Audit ====================

export interface AuditRequest {
  user_id: string;
  query: string;
  answer_hash: string;
  tool_trail: string[];
  citations: Citation[];
}

export interface AuditLog {
  id: string;
  user_id: string;
  query: string;
  query_hash: string;
  tool_trail_json: string[];
  citations_json: Citation[];
  answer_hash: string;
  confidence: number;
  mode: 'text' | 'voice';
  language: 'en' | 'kn';
  ts: string;
}

// ==================== Knowledge Ingestion ====================

export interface DocumentUploadMeta {
  fir_number?: string;
  station_id: string;
  district_id: string;
  sensitivity: 'NORMAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  uploaded_by: string;
}

export interface DocumentPending {
  document_id: string;
  fir_number?: string;
  station_id: string;
  district_id: string;
  sensitivity: 'NORMAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  uploaded_by: string;
  uploaded_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  ocr_done: boolean;
  ocr_confidence?: number;
}

export interface Document {
  document_id: string;
  fir_number?: string;
  station_id: string;
  district_id: string;
  sensitivity: 'NORMAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  uploaded_by: string;
  approved_by?: string;
  approved_at?: string;
  indexed: boolean;
  indexed_at?: string;
  file_name: string;
  file_type: string;
  chunk_count?: number;
  created_at: string;
}

export interface IngestionReviewPayload {
  document_id: string;
  reviewed_by: string;
  notes?: string;
}

export interface IngestionAudit {
  id: string;
  document_id: string;
  action: 'UPLOADED' | 'APPROVED' | 'REJECTED' | 'INDEXED' | 'FAILED';
  performed_by: string;
  details_json?: any;
  ts: string;
}

// ==================== Network Analysis ====================

export interface GraphNode {
  id: string;
  label: string;
  type: 'Person' | 'Case' | 'Location' | 'MO';
  metadata?: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  strength: number;
  features?: any;
}

// ==================== Trends & Analytics ====================

export interface CrimeTrend {
  id: string;
  district_id: string;
  station_id: string;
  crime_type: string;
  date_bucket: string;
  bucket_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  incident_count: number;
  computed_at: string;
}

export interface Hotspot {
  location_id: string;
  name: string;
  lat: number;
  lon: number;
  incident_count: number;
  crime_types: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ==================== API Responses ====================

export interface ApiError {
  error: string;
  message: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  service: string;
  version: string;
  timestamp: string;
}
