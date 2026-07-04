# Problem Statement: Challenge 1

**KSP Datathon 2026 – Challenge 1**

**Platform**: Zoho Catalyst (Mandatory)

---

## Challenge Title

**Intelligent Conversational AI (Chatbot) for Karnataka State Police's Crime & Investigation Database**

---

## Problem Overview

Karnataka State Police requires an intelligent, conversational AI system that enables authorized personnel to interact with the State Crime Records Bureau (SCRB) database using natural language. The system must provide accurate, explainable insights while maintaining strict security and audit compliance.

---

## Required Capabilities

### 1. Multilingual NLP Chatbot
- **Languages**: English + Kannada
- **Code-Mixing**: Support for Kannada-English code-mixed queries
- **Voice**: Speech-to-Text (STT) and Text-to-Speech (TTS)
- **Context**: Multi-turn conversations with context retention

### 2. Crime Data Querying
Query capabilities include:
- **Pattern Discovery**: Identify recurring crime patterns, MO trends, temporal patterns
- **Criminal Networks**: Analyze connections between accused persons, co-offenders, associates
- **Socio-Demographic Insights**: Age, gender, location-based profiling
- **Behavioral Profiling**: Repeat offenders, crime specialization
- **Proactive Prevention**: Early warning indicators, risk scoring

### 3. Visual Analytics
- **Network Graphs**: Criminal network visualization with centrality measures
- **Geo-Mapping**: Crime hotspot detection, trend visualization
- **Temporal Charts**: Time-series analysis, seasonal patterns

### 4. Predictive Analytics
- **Crime Forecasting**: Predict crime likelihood by location and time
- **Risk Assessment**: Recidivism prediction for known offenders
- **Resource Allocation**: Suggest patrol routes based on hotspots

### 5. Explainability & Audit
- **Explanation Contract**: Reasoning steps, sources, confidence scores
- **Citations**: Link answers to specific FIRs, case documents
- **Audit Trail**: Log all queries and answers for compliance
- **PDF Export**: Conversation history with watermarks

### 6. Security & Access Control
- **Authentication**: OAuth 2.0
- **Role-Based Access (RBAC)**: Constable, SI, Inspector, DSP, SCRB_Analyst, Admin
- **Row-Level Security (RLS)**: Station/district-level data filtering
- **Sensitivity Levels**: NORMAL, CONFIDENTIAL, RESTRICTED

---

## Dataset

### Entity Relationship Diagram (ERD)
The SCRB database includes:
- **FIRs** (First Information Reports)
- **Accused Persons**
- **Victims**
- **Locations** (with geo-coordinates)
- **Modus Operandi** (crime methods)
- **Evidence** (documents, photos, forensics)

### Sample Data
- 20,000+ FIRs across Karnataka
- Multiple crime types: Theft, Robbery, Assault, Cyber Crime, Drug Trafficking, etc.
- Historical data: 2020-2026

---

## Judging Criteria

### 1. Accuracy & Depth of Insights (25%)
- Correctness of answers
- Pattern detection quality
- Network analysis accuracy
- Predictive model performance
- Proper citations

### 2. Multilingual & Voice Capabilities (15%)
- English + Kannada support
- Code-mixing handling
- STT/TTS quality
- Language detection

### 3. Explainability & Trust (20%)
- Reasoning transparency
- Citation accuracy
- Confidence scoring
- Audit trail completeness

### 4. Security & Access Control (20%)
- RBAC enforcement
- RLS implementation
- No data leaks
- Audit compliance

### 5. User Experience & Usability (15%)
- Intuitive interface
- Fast response times
- Role-aware features
- Mobile-friendly

### 6. Innovation & Scalability (5%)
- Graph analytics
- Predictive models
- Catalyst-native architecture
- Performance at scale

**Total**: 100%

---

## Technical Constraints

### Mandatory Requirements
1. **Platform**: Zoho Catalyst (all services)
2. **Data Store**: Catalyst Data Store (relational) + NoSQL (graph)
3. **AI/ML**: QuickML for RAG and LLM serving
4. **Voice**: Zia AI for STT/TTS
5. **Security**: Catalyst Auth for OAuth 2.0

### Optional Services
- SmartBrowz for PDF generation
- Circuits for workflow automation
- Cron Jobs for scheduled tasks
- API Gateway for rate limiting

---

## Deliverables

1. **Working Application**: Deployed on Catalyst
2. **Source Code**: GitHub repository
3. **Documentation**: Architecture, deployment guide, API docs
4. **Demo Video**: 5-minute walkthrough
5. **Presentation**: 10-minute pitch (architecture, features, judging criteria alignment)

---

## Evaluation Process

1. **Submission**: Upload code + video by deadline
2. **Initial Review**: Automated scoring (code quality, documentation)
3. **Demo Session**: Live demo with judges (15 minutes)
4. **Final Scoring**: Based on judging criteria

---

## Timeline

- **Registration**: January 2026
- **Submission Deadline**: March 15, 2026
- **Evaluation**: March 16-20, 2026
- **Finals**: March 25, 2026
- **Winner Announcement**: March 30, 2026

---

## Prizes

- **1st Place**: ₹2,00,000 + Trophy
- **2nd Place**: ₹1,00,000 + Trophy
- **3rd Place**: ₹50,000 + Trophy
- **Honorable Mentions**: Certificates

---

## Resources

- **Dataset Access**: Provided after registration
- **Catalyst Credits**: ₹10,000 credits for development
- **Support**: Dedicated Slack channel for queries

---

**Good Luck!**

*For questions, contact: scrb@ksp.gov.in*
