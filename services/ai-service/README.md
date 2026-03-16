# EduSphere AI Service

> Dedicated service for AI processing (Gemini, embeddings, grading).

## Status: Scaffold

Currently, AI operations run within the api-server. This directory is prepared for future extraction into a standalone service for:

- **Model switching** — Swap between Gemini, GPT, Claude without affecting API
- **GPU scaling** — Scale AI workloads on GPU instances separately
- **Async processing** — Queue-based AI jobs via BullMQ

## Architecture

```
services/ai-service/
├── src/
│   ├── chat/        ← Conversational AI (bot, Q&A)
│   ├── grading/     ← AI-assisted grading and feedback
│   ├── tutor/       ← Personal tutor, study plans
│   └── analytics/   ← Sentiment analysis, risk detection
```
