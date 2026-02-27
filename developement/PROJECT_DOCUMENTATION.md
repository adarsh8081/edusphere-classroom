# EduSphere Classroom — Project Documentation

> **Version:** 1.0  
> **Last Updated:** February 26, 2026  
> **Status:** Active Development (Phase 5 Complete)

---

## 1. Project Overview

**EduSphere Classroom** is a full-stack, AI-powered Learning Management System (LMS) built for K-12 education. It connects **Teachers**, **Students**, and **Parents** through a unified platform that combines classroom management, real-time communication, data-driven analytics, and intelligent AI assistance.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Radix UI, Recharts, Framer Motion |
| **Backend** | Node.js, Express 5, TypeScript, Socket.io |
| **Database** | PostgreSQL (Neon Serverless), Drizzle ORM, pgvector |
| **AI** | Google Gemini API (`gemini-2.0-flash-lite`, `gemini-embedding-001`) |
| **Auth** | Passport.js (Local Strategy), Express Sessions |
| **Infra** | Redis (optional), BullMQ job queue, Docker Compose |

### User Roles

| Role | Description |
|------|-------------|
| **Teacher** | Creates classes, manages content, grades assignments, views analytics |
| **Student** | Joins classes, submits work, uses chatbot, participates in discussions |
| **Parent** | Views child's progress, grades, attendance via dedicated dashboard |
| **Super Admin** | Full system access across all classes |

---

## 2. Architecture

```
├── client/src/           # React frontend
│   ├── pages/            # 8 route pages
│   ├── components/       # 63+ UI components (Radix-based)
│   ├── hooks/            # 8 custom React hooks
│   └── lib/              # API client, query helpers
├── server/               # Express backend
│   ├── routes.ts         # 40+ REST API endpoints
│   ├── storage.ts        # Database access layer (Drizzle ORM)
│   ├── services/         # AI, Document Processing, Risk Assessment
│   ├── auth.ts           # Passport authentication
│   ├── socket.ts         # Real-time WebSocket events
│   ├── notification-service.ts
│   └── redis.ts          # Redis connection (optional)
├── shared/               # Shared types & API contracts
│   ├── schema.ts         # 28 database tables (Drizzle + Zod)
│   └── routes.ts         # Typed API route definitions
└── package.json
```

---

## 3. Feature Inventory

### ✅ Phase 1 — Core LMS (Complete)

The foundational classroom experience.

| Feature | Description | Key Files |
|---------|------------|-----------|
| **Authentication** | Email/password login & registration with role selection | `AuthPage.tsx`, `auth.ts` |
| **Class Management** | Create classes, generate join codes, enroll students | `Dashboard.tsx`, `routes.ts` |
| **Stream / Posts** | Class announcements with file attachments, comments, threaded replies | `StreamTab.tsx` |
| **Assignments** | Create assignments with due dates, file attachments, prerequisite chains | `ClassworkTab.tsx` |
| **Submissions** | Students submit work; teachers grade with feedback | `ClassworkTab.tsx` |
| **Attendance** | Teachers mark daily attendance (present/absent/late) | `AttendanceTab.tsx` |
| **Topics** | Organize class content into topic folders | `ClassworkTab.tsx` |
| **Resources** | Upload & manage learning materials per topic with versioning | `ClassworkTab.tsx` |

---

### ✅ Phase 2 — Engagement & Communication (Complete)

Transformed the platform into a high-engagement, data-driven system.

| Feature | Description | Key Files |
|---------|------------|-----------|
| **Teacher Analytics Dashboard** | Engagement trends (line charts), assignment stats (bar charts), activity monitoring | `AnalyticsTab.tsx` |
| **Multi-Channel Notifications** | In-app alerts, email dispatch (Nodemailer), notification center dropdown | `NotificationCenter.tsx`, `notification-service.ts` |
| **Notification Preferences** | Per-user toggle for in-app, email, and push per event type | `NotificationSettings.tsx` |
| **Direct Messaging** | 1:1 and group conversations between teachers, students, parents | `Messaging.tsx` |
| **Polls** | Create polls in posts, vote on options, view results | `Poll.tsx` |
| **Role-Based Dashboard Cards** | Teachers see enrollment & activity; students see pending work & latest grades | `Dashboard.tsx` |
| **Student Grades View** | Centralized view of all submissions, feedback, and scores | `GradesTab.tsx` |
| **User Search** | Find classmates and teachers for messaging | `routes.ts` |
| **Socket.io Real-time** | Live updates for messaging and notifications | `socket.ts` |

---

### ✅ Phase 3 — AI Intelligence & Parent Features (Complete)

Integrated AI-powered intelligence across the platform.

| Feature | Description | Key Files |
|---------|------------|-----------|
| **Sentiment Analysis** | Auto-classifies post/comment sentiment (positive/neutral/negative) | `aiService.ts` |
| **AI Content Summarization** | Generates bullet-point summaries of learning materials | `aiService.ts` |
| **AI Tag Suggestions** | Suggests relevant educational tags for content | `aiService.ts` |
| **Quiz Generation** | AI generates MCQ quizzes from any text content | `aiService.ts`, `ContentGenerator.tsx` |
| **Lesson Plan Generator** | Creates structured lesson plans from topic/grade/duration | `aiService.ts`, `ContentGenerator.tsx` |
| **Early Warning System** | AI-driven risk assessment identifies at-risk students | `riskService.ts` |
| **At-Risk Student Widget** | Teacher dashboard for proactively monitoring flagged students | `AnalyticsTab.tsx` |
| **Resource Recommendations** | "Students Also Viewed" suggestions based on peer behavior | `storage.ts` |
| **Parent-Student Linking** | Full invitation flow (email → token → registration → linking) | `ParentInvitationPage.tsx` |
| **Parent Dashboard** | Dedicated view of child's classes, grades, attendance, assignments | `ParentDashboard.tsx` |
| **Peer Review System** | Randomized peer review assignments with moderation tools | `ClassworkTab.tsx`, `routes.ts` |

---

### ✅ Phase 4 — AI Chatbot & Learning Paths (Complete)

Conversational AI and personalized learning experience.

| Feature | Description | Key Files |
|---------|------------|-----------|
| **Classroom Assistant Chatbot** | RAG-powered chatbot that answers student questions using class materials | `BotChatWidget.tsx`, `aiService.ts` |
| **Document Processing Pipeline** | Extracts text from uploaded resources, chunks it, and generates embeddings (pgvector) | `documentProcessor.ts` |
| **Semantic Search** | Searches document chunks by vector similarity for chatbot context | `storage.ts` |
| **Bot Conversation History** | Persists Q&A pairs per user per class for chat memory | `botConversations` table |
| **Personalized Learning Paths** | Auto-generated skill-based learning paths for each student | `LearningPathDashboard.tsx` |
| **Skill Tracking** | Tracks student skills and mastery levels | `skills`, `studentSkills` tables |

---

### ✅ Phase 5 — Wellbeing & Accessibility (Complete)

Student welfare and inclusive design features.

| Feature | Description | Key Files |
|---------|------------|-----------|
| **Wellbeing Check-ins** | Students submit mood scores with optional notes; AI analyzes sentiment | `WellbeingCheckinDialog.tsx` |
| **Wellbeing Dashboard** | Teacher view of class wellbeing trends, flagged students, mood analytics | `WellbeingDashboard.tsx` |
| **Auto-Flagging** | Automatically flags students with critically low mood or negative sentiment | `routes.ts` |
| **Teacher Alerts** | Automatic notifications sent to teachers for flagged wellbeing entries | `notification-service.ts` |
| **Accessibility Panel** | Accessibility controls for inclusive classroom experience | `AccessibilityPanel.tsx` |
| **Interactive Video Player** | Enhanced video player for classroom content | `InteractiveVideoPlayer.tsx` |

---

## 4. Current Updates (Feb 26, 2026)

### Bug Fixes Applied

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| **Chatbot 404 Error** — Embedding model not found | `text-embedding-004` deprecated by Google | Replaced with `gemini-embedding-001` |
| **Chatbot 429 Error** — API quota exhausted | `gemini-2.0-flash` free tier daily limit exceeded | Switched to `gemini-2.0-flash-lite` (lower quota footprint) |
| **No retry on rate limits** | API calls failed immediately on transient 429 errors | Added `retryWithBackoff()` helper with exponential backoff (up to 3 retries) |
| **Generic error messages** | Chatbot showed same error for all failure types | Improved to distinguish quota exhaustion vs. other failures |

### Files Modified

- `server/services/aiService.ts` — Model updates, retry logic, error handling

> **Note:** The 429 quota issue also requires ensuring the Google Gemini API key has sufficient quota. If using the free tier, the daily limit may need to be waited out or an upgrade to a paid plan is required.

---

## 5. Database Schema Overview

28 tables across 5 phases:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (teacher, student, parent, super_admin) |
| `parent_student_links` | Parent-child relationships |
| `parent_invitations` | Invitation tokens for parent linking |
| `classes` | Classroom metadata, codes, meeting URLs |
| `enrollments` | Student-class enrollment records |
| `posts` | Stream announcements and discussions |
| `post_attachments` | File attachments on posts |
| `comments` | Threaded comments on posts |
| `topics` | Content organization folders |
| `resources` | Learning materials (files, links) |
| `resource_recommendations` | AI-generated "also viewed" suggestions |
| `assignments` | Homework, projects, quizzes |
| `assignment_attachments` | File attachments on assignments |
| `submissions` | Student work submissions |
| `attendance` | Daily attendance records |
| `notifications` | In-app notification entries |
| `notification_preferences` | Per-user notification channel settings |
| `conversations` | Messaging conversation metadata |
| `conversation_participants` | Conversation membership |
| `messages` | Chat messages |
| `polls` | Polls attached to posts |
| `poll_options` | Poll answer choices |
| `poll_votes` | User votes on poll options |
| `peer_reviews` | Peer review assignments and scores |
| `student_risk` | AI risk assessment data |
| `user_activities` | Activity tracking for analytics |
| `document_chunks` | RAG pipeline — chunked resource text with embeddings |
| `bot_conversations` | Chatbot Q&A history |
| `skills` | Skill definitions for learning paths |
| `student_skills` | Per-student skill mastery tracking |
| `learning_path_items` | Personalized learning path entries |
| `wellbeing_checkins` | Student mood/wellbeing data |

---

## 6. API Endpoints Summary

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create new account |
| POST | `/api/login` | Sign in |
| POST | `/api/logout` | Sign out |
| GET | `/api/user` | Get current user |

### Classes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | List user's classes |
| POST | `/api/classes` | Create a class |
| GET | `/api/classes/:classId` | Get class details |
| POST | `/api/classes/join` | Join via class code |
| GET | `/api/classes/:classId/roster` | Get class members |

### Posts & Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes/:classId/posts` | List posts |
| POST | `/api/classes/:classId/posts` | Create post |
| POST | `/api/posts/:postId/translate` | Translate post content |
| POST | `/api/posts/:postId/comments` | Add comment |

### Assignments & Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes/:classId/assignments` | List assignments |
| POST | `/api/classes/:classId/assignments` | Create assignment |
| GET | `/api/assignments/:assignmentId` | Get assignment details |
| GET | `/api/assignments/:assignmentId/submissions` | List submissions |
| POST | `/api/assignments/:assignmentId/submissions` | Submit work |
| PATCH | `/api/submissions/:submissionId/grade` | Grade submission |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/summarize` | Summarize content |
| POST | `/api/ai/suggest-tags` | Generate tag suggestions |
| POST | `/api/ai/generate-quiz` | Generate quiz from text |
| POST | `/api/ai/lesson-plan` | Generate lesson plan |
| POST | `/api/ai/bot/ask` | Ask the classroom chatbot |
| GET | `/api/ai/bot/history/:classId` | Get chatbot history |

### Wellbeing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wellbeing/checkin` | Submit wellbeing check-in |
| GET | `/api/wellbeing/analytics/:classId` | Get wellbeing analytics |

### Notifications & Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| GET/PATCH | `/api/notifications/preferences` | Get/update preferences |
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Start conversation |
| GET | `/api/conversations/:id/messages` | Get messages |
| POST | `/api/conversations/:id/messages` | Send message |

### Analytics & Risk
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/:classId/engagement` | Engagement heatmap |
| GET | `/api/analytics/:assignmentId/stats` | Assignment statistics |
| POST | `/api/classes/:classId/analytics/risk-assessment` | Run risk assessment |
| GET | `/api/classes/:classId/analytics/at-risk` | Get at-risk students |

### Parents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parents/children` | Get linked children |
| GET | `/api/parents/dashboard/:studentId` | Get child dashboard |
| POST | `/api/parents/invite` | Send parent invitation |
| GET | `/api/parents/invitation/:token` | Validate invitation |
| POST | `/api/parents/link-student` | Complete parent linking |

---

## 7. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GOOGLE_GEMINI_API_KEY` | ✅ | Google Gemini API key for all AI features |
| `SESSION_SECRET` | ✅ | Express session secret |
| `REDIS_URL` | ❌ | Redis URL (optional, graceful fallback) |
| `SMTP_HOST` | ❌ | Email server host |
| `SMTP_PORT` | ❌ | Email server port |
| `SMTP_USER` | ❌ | Email credentials |
| `SMTP_PASS` | ❌ | Email credentials |

---

## 8. Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, GOOGLE_GEMINI_API_KEY, etc.

# Push database schema
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

---

## 9. Future Work / Roadmap

### Short-Term (Next Sprint)

| Item | Priority | Description |
|------|----------|-------------|
| **API Key Quota Management** | 🔴 High | Migrate to a paid Gemini API plan or implement API key rotation for reliable AI features |
| **File Upload Service** | 🔴 High | Integrate cloud storage (AWS S3 / Google Cloud Storage) for assignment & resource file uploads |
| **Production Email Provider** | 🟡 Medium | Replace mock Nodemailer with a production provider (SendGrid / AWS SES) |
| **Production Redis** | 🟡 Medium | Set up managed Redis for Socket.io adapter and BullMQ job queues |

### Medium-Term

| Item | Priority | Description |
|------|----------|-------------|
| **Google Classroom Import** | 🟡 Medium | Import classes, rosters, and assignments from Google Classroom via API |
| **Video Conferencing** | 🟡 Medium | Integrate Google Meet or Zoom for live class sessions |
| **Mobile Responsive Polish** | 🟡 Medium | Optimize all views for tablet and mobile breakpoints |
| **Advanced Analytics** | 🟢 Low | Student progress over time, comparative class analytics, exportable reports |
| **Rubric-Based Grading** | 🟢 Low | Create rubrics for assignments and apply them during grading |

### Long-Term

| Item | Priority | Description |
|------|----------|-------------|
| **Mobile App** | 🟢 Low | React Native companion app for push notifications and on-the-go access |
| **Multi-Language Support** | 🟢 Low | i18n for the full UI (currently English-only) |
| **LTI Integration** | 🟢 Low | Connect with external LMS tools via LTI standard |
| **Plagiarism Detection** | 🟢 Low | AI-powered plagiarism checking on student submissions |
| **Gamification** | 🟢 Low | Badges, leaderboards, and streak tracking for student engagement |

---

## 10. Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| Gemini API free tier quota limits | ⚠️ Mitigated | Retry logic added; requires paid plan or quota reset for consistent AI features |
| Redis connection warning on startup | ⚠️ Non-blocking | Falls back to in-memory gracefully; production should use managed Redis |
| Email notifications use mock provider | ℹ️ Expected | Logs to console; needs real SMTP provider for production |

---

*This document is maintained by the EduSphere development team. For questions, refer to the codebase or contact the project lead.*
