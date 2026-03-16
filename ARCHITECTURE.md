# EduSphere Platform — Codebase Architecture

> A modern, multi-platform SaaS architecture for a full-stack TypeScript classroom management platform featuring AI, real-time messaging, gamification, and analytics.

---

## High-Level Architecture

The platform follows a Turborepo-based monorepo structure, moving away from a traditional monolithic client/server separating the concern into individual apps, modular services, and shared packages. 

```
                ┌───────────────────────┐
                │       API Gateway     │
                └──────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Auth Service       Classroom Service    Messaging Service
        │                  │                  │
   AI Service          Analytics Service   Notification Service
        │                  │                  │
                ┌───────────────┐
                │   PostgreSQL  │
                │   Redis Cache │
                │   Queue (Bull)│
                └───────────────┘

          ↑             ↑             ↑
          │             │             │

  Web App (React)   Desktop App    Mobile App
                    (Electron)     (React Native)
```

All client applications consume the same modular API backend, sharing core types, UI components, and API clients from the `packages/` directory.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo / Build** | Turborepo, Vite, tsc, esbuild |
| **Runtime** | Node.js + TypeScript (ESM) |
| **Web Client (`apps/web`)** | React 18, Vite 7, Wouter (routing), Tailwind CSS 3, Radix UI, TanStack Query |
| **API Server (`services/api-server`)** | Fastify / Express 5 |
| **Realtime (`services/realtime-server`)** | Socket.io |
| **Database** | PostgreSQL (Neon-compatible), Drizzle ORM |
| **Cache / PubSub** | Redis (Upstash TLS support) |
| **AI** | Google Gemini (`@google/generative-ai`) |
| **Auth** | Passport.js (Local + Google OAuth + GitHub OAuth) |
| **Storage / Email** | AWS S3, Resend (production), Nodemailer |

---

## Directory Structure

```
edusphere-platform/
├── apps/                    # Client Applications
│   ├── web/                 # React + Vite web application
│   ├── desktop/             # Electron + React application
│   └── mobile/              # React Native / Expo application
│
├── services/                # Backend API & Microservices
│   ├── api-server/          # Core backend REST API
│   ├── realtime-server/     # WebSockets / Socket.io server
│   └── ai-service/          # Dedicated AI processing service
│
├── packages/                # Shared Libraries (consumed by apps & services)
│   ├── ui/                  # Shared React components (Tailwind, Radix)
│   ├── api-client/          # Typed API SDK / Axios instances
│   ├── config/              # Shared configuration files
│   ├── utils/               # Shared helper functions
│   └── types/               # TypeScript interfaces & DTOs
│
├── database/                # Database Layer
│   ├── schemas/             # Drizzle schemas
│   ├── migrations/          # DB migration files
│   └── seed/                # Seed scripts
│
├── infrastructure/          # DevOps & Deployment
│   └── docker/              # Dockerfiles for services
│
├── package.json             # Root monorepo workspace config
└── turbo.json               # Turborepo pipeline configuration
```

---

## 1. Apps Layer (`apps/`)

### Web App (`apps/web`)
The primary browser-based interface.
- Includes ~18 top-level routes matching the platform's core modules (Dashboard, ClassView, Admin, Marketplace, Guilds, Forums).
- Relies on `packages/ui` for its design system and `packages/api-client` for network requests.

### Desktop App (`apps/desktop`)
- An Electron wrapper around the web UI. Provides native OS integration for Windows and macOS.
- Reuses the vast majority of `apps/web` application logic.

### Mobile App (`apps/mobile`)
- React Native/Expo framework application tailored for iOS and Android.
- Distant from DOM-based UI but highly reuses `packages/types`, `packages/utils`, and `packages/api-client`.

---

## 2. Services Layer (`services/`)

### API Server (`services/api-server`)
Modular service design mimicking ERP-level architecture.

- **Modules:** Organized by domain (`auth`, `classes`, `assignments`, `analytics`, `gamification`, `guilds`, `marketplace`, `parents`, etc.).
- **Infrastructure:** Adapts connections for DB, queues (BullMQ), email (Resend), and cloud storage (S3).

### Realtime Server (`services/realtime-server`)
Separated from the core API to manage WebSocket connections and Pub/Sub independently.
- Handles Chat Gateways, Notification Gateways.
- Scaled horizontally using Redis PubSub.

### AI Service (`services/ai-service`)
Standalone service for interacting with the Google Gemini API.
- Enables asynchronous processing of grading, lesson plan generation, and AI-driven analytics without blocking the main API loops.

---

## 3. Shared Packages (`packages/`)

- **`@edusphere/ui`**: Contains reusable Tailwind + Radix UI primitives. Ensures consistent design language across web and desktop.
- **`@edusphere/api-client`**: Abstracted API requests, allowing the front-ends to simply call `getClasses()` instead of manually executing `fetch`.
- **`@edusphere/types`**: The single source of truth for interfaces crossing the network boundary (e.g., User, Class, Message models).
- **`@edusphere/utils`**: Date formatters, Zod validation schemas, and calculation helpers.

---

## 4. Database Layer (`database/`)

The platform's data layer utilizes **Drizzle ORM** with **PostgreSQL**. The schema is split across domains:

| Domain | Key Entities |
|--------|--------------|
| **Core** | `users`, `classes`, `enrollments` |
| **Classroom** | `assignments`, `submissions`, `topics`, `resources`, `attendance` |
| **Communication** | `posts`, `comments`, `conversations`, `messages`, `notifications` |
| **Gamification** | `xp_transactions`, `user_levels`, `badges`, `skills` |
| **AI & Analytics**| `bot_conversations`, `document_chunks`, `learning_gaps`, `student_risk` |
| **Ecosystem** | `guilds`, `forum_posts`, `certificates`, `marketplace_items`, `portfolios` |

---

## CI/CD Pipeline & Deployment

Modern SaaS deployment strategy utilizing GitHub Actions and containerization.

```
GitHub Actions
   │
   ├─ Build Web / Desktop / Mobile
   └─ Build Docker Images (API, Realtime, AI) -> Container Registry
             │
             v
   Deployment Target (e.g., Kubernetes / ECS)
             │
   Cloudflare CDN ─> API Gateway ─> Node API Servers
```

### Environment Variables
Key values required to run the services:
- `DATABASE_URL` — PostgreSQL connection
- `REDIS_URL` — Upstash/Redis connection string
- `GOOGLE_GEMINI_API_KEY` — AI integration key
- `SESSION_SECRET` — Express session signing secret

---
