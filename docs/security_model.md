# Ibha Security Model

## Overview

Security is **paramount** for Ibha, as it handles sensitive police data. This document outlines the multi-layered security approach.

---

## 1. Authentication

### OAuth 2.0 via Catalyst Auth

- **Flow**: Authorization Code Flow
- **Token**: JWT with 1-hour expiration
- **Refresh**: Automatic refresh token rotation
- **Storage**: HttpOnly cookies (production) or localStorage (dev)

### User Credentials

- **Source**: Karnataka Police identity directory
- **MFA**: Optional multi-factor authentication
- **Password Policy**: Minimum 12 characters, complexity requirements

---

## 2. Authorization

### Role-Based Access Control (RBAC)

**Roles**:

| Role | Data Scope | Ingestion Access | Admin Access |
|------|-----------|------------------|--------------|
| Constable | Own station | ❌ | ❌ |
| SI | Station cluster | ❌ | ❌ |
| Inspector | Station cluster | ❌ | ❌ |
| DSP | District-wide | ❌ | ❌ |
| SCRB_Analyst | State-wide | ✅ | ❌ |
| Admin | State-wide | ✅ | ✅ |

**Endpoint Protection**:
- `/chat`, `/audit`: All authenticated roles
- `/ingest/*`: SCRB_Analyst, Admin only
- `/admin/*`: Admin only

**Enforcement**:
- API Gateway checks role before routing
- Serverless functions double-check role

### Row-Level Security (RLS)

**Filter Application**:

```python
def enforce_rls(user_claims, base_query):
    if user_claims.role == "Constable":
        base_query["station_id"] = user_claims.station_id
    elif user_claims.role == "DSP":
        base_query["district_id"] = user_claims.district_id
    elif user_claims.role in ["SCRB_Analyst", "Admin"]:
        pass  # No filter (state-wide access)
    return base_query
```

**RLS Scope**:
- Applied to ALL Data Store queries
- Applied to RAG retrieval (filters vector search)
- Applied to audit log queries

---

## 3. Data Protection

### Sensitivity Levels

**Classification**:
- **NORMAL**: General crime data (public interest)
- **CONFIDENTIAL**: Sensitive investigations (restricted sharing)
- **RESTRICTED**: High-profile cases, witness protection, etc.

**Access Control**:
- Users have a `clearance_level` field
- Queries filter by `sensitivity <= user.clearance_level`

### PII Masking

**Masked Fields**:
- Full names (partially masked: `Rajesh K***`)
- Phone numbers (`+91-98765-XXXXX`)
- Addresses (city/district only, no street)

**Masking Strategy**:
- Applied in LLM output (post-generation)
- Exceptions: When data is critical for investigation context

### Encryption

- **In Transit**: TLS 1.3 (HTTPS)
- **At Rest**: Catalyst Data Store encryption (AES-256)
- **Sensitive Columns**: Additional encryption layer (TODO)

---

## 4. Audit & Compliance

### Audit Logging

**What is Logged**:
- All chat queries and answers
- Document uploads, approvals, rejections
- Admin actions (user management, role changes)
- Authentication events (login, logout, failures)

**Audit Table Schema**:

```sql
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    query TEXT NOT NULL,
    query_hash VARCHAR(64),
    tool_trail_json JSON,
    citations_json JSON,
    answer_hash VARCHAR(64) NOT NULL,
    confidence DECIMAL(3,2),
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Retention**: 5 years (legal requirement)

**Integrity**: Answer hashes (SHA-256) prevent tampering

### Compliance

- **Indian IT Act 2000**: Data protection compliance
- **Criminal Procedure Code (CrPC)**: Evidence handling
- **RTI Act 2005**: Transparency requirements (with exemptions)

---

## 5. Rate Limiting

**Per-User Limits** (API Gateway):

| Role | Requests/Minute | Requests/Hour |
|------|-----------------|---------------|
| Constable | 60 | 500 |
| SI | 80 | 800 |
| Inspector | 100 | 1000 |
| DSP | 100 | 1200 |
| SCRB_Analyst | 120 | 1500 |
| Admin | 150 | 2000 |

**Purpose**: Prevent abuse, DoS attacks, accidental infinite loops

---

## 6. Input Validation

### Query Validation

- **Max Length**: 2000 characters
- **Sanitization**: Remove SQL injection patterns
- **Content Safety**: Block harmful instructions

### File Upload Validation

- **Allowed Types**: `.pdf`, `.docx`, `.txt`, `.png`, `.jpg`, `.jpeg`
- **Max Size**: 10 MB
- **Virus Scan**: Optional (if antivirus service available)

---

## 7. Output Safety

### Guardrails

**Content Safety**:
- Block personal attacks
- Block political bias
- Block harmful instructions

**Citation Requirement**:
- Every claim must have a source
- Answers without citations are flagged

**Confidence Threshold**:
- Low-confidence answers (< 0.7) include a warning

---

## 8. Controlled Knowledge Ingestion

**Security Rationale**:
- Prevents poisoning attacks (malicious documents)
- Ensures data quality (human review required)
- Provides audit trail (who uploaded, who approved, when indexed)

**Pipeline Security**:

```
Upload → Validation → OCR → Human Review → Batch Indexing
   ↓         ↓         ↓          ↓              ↓
 Auth    File Type   Zia AI   SCRB_Analyst    Cron Job
 RBAC      Size      Secure    Approval        System
```

**Access Control**:
- Only SCRB_Analyst and Admin can upload
- Documents cannot be indexed without approval
- Rejected documents are archived (not deleted) for audit

---

## 9. Network Security

### API Gateway

- **HTTPS Only**: All traffic encrypted (TLS 1.3)
- **CORS**: Whitelist frontend domain only
- **CSP**: Content Security Policy headers
- **HSTS**: HTTP Strict Transport Security

### Serverless Functions

- **VPC**: Functions run in isolated VPC (if supported by Catalyst)
- **IAM**: Least privilege access to Data Store, NoSQL, QuickML
- **Secrets**: Environment variables for sensitive config (no hardcoded secrets)

---

## 10. Incident Response

### Security Events

**Monitored Events**:
- Failed authentication (> 5 attempts)
- RLS violations (user tries to access out-of-scope data)
- Unusual query patterns (SQL injection attempts)
- Bulk data exports (> 100 records)

**Alerting**:
- Real-time alerts to security team (Slack/Email)
- Automatic account lockout (after 5 failed logins)
- Rate limit enforcement (block user for 1 hour)

### Incident Workflow

```
1. Detection (logs, alerts)
    ↓
2. Investigation (review audit logs)
    ↓
3. Containment (disable user, block IP)
    ↓
4. Remediation (fix vulnerability, patch)
    ↓
5. Post-Mortem (document incident, update policies)
```

---

## 11. Threat Model

### Threats & Mitigations

| Threat | Mitigation |
|--------|-----------|
| **Unauthorized Access** | OAuth 2.0, strong passwords, MFA |
| **Data Leakage** | RLS, PII masking, watermarked exports |
| **Poisoning Attacks** | Controlled ingestion, human review |
| **Prompt Injection** | Input sanitization, content safety filters |
| **DoS Attacks** | Rate limiting, API Gateway throttling |
| **SQL Injection** | Parameterized queries, input validation |
| **XSS Attacks** | CSP headers, React auto-escaping |
| **Man-in-the-Middle** | HTTPS only, HSTS |
| **Insider Threats** | Full audit logging, least privilege, RBAC |

---

## 12. Future Enhancements

### Planned Security Features

1. **Multi-Factor Authentication (MFA)**: SMS OTP or authenticator app
2. **Anomaly Detection**: ML-based detection of unusual access patterns
3. **Data Loss Prevention (DLP)**: Block bulk exports, flag sensitive queries
4. **Zero Trust Architecture**: Continuous verification, micro-segmentation
5. **Blockchain Audit Trail**: Immutable audit logs (future consideration)

---

## Security Checklist for Deployment

- [ ] Enable HTTPS (TLS 1.3) on all endpoints
- [ ] Configure OAuth 2.0 with Catalyst Auth
- [ ] Set up RBAC roles in Catalyst Auth console
- [ ] Enable RLS filtering in all Data Store queries
- [ ] Configure rate limiting in API Gateway
- [ ] Set up audit logging to Data Store
- [ ] Enable PII masking in LLM responses
- [ ] Configure watermarking for PDF exports
- [ ] Set up security alerts (failed logins, RLS violations)
- [ ] Review and test incident response procedures
- [ ] Conduct security audit / penetration testing

---

**Last Updated**: July 3, 2026

**Security Contact**: security@ksp.gov.in
