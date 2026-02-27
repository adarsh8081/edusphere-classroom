# 🎓 EduSphere Classroom

> **EduSphere Classroom** is a feature module of the larger EduSphere platform — a modern, AI-powered classroom management system built for educators and students.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)

---

## ✨ Features

- 📚 **Classroom Management** — Create classrooms, enroll students, manage posts and resources
- 🤖 **AI-Powered Tools** — AI chatbot, quiz generator, lesson plan creator (Google Gemini)
- 💬 **Real-Time Messaging** — Socket.io-based direct & classroom messaging
- 📝 **Assignments** — Create, submit, and grade assignments with file uploads
- 📊 **Analytics** — Attendance tracking, sentiment analysis, performance insights
- 🔐 **Auth** — Local auth + Google & GitHub OAuth
- 📧 **Notifications** — Email invitations, alerts via Resend
- ☁️ **Cloud Storage** — AWS S3 for file uploads (with local fallback)

---

## 🗂️ Tech Stack

| Layer       | Technology                     |
|-------------|-------------------------------|
| Frontend    | React 18, Vite, TailwindCSS, shadcn/ui |
| Backend     | Express 5, TypeScript, tsx    |
| Database    | PostgreSQL + Drizzle ORM      |
| Cache/Queue | Redis (Upstash compatible)    |
| Auth        | Passport.js (local + OAuth)   |
| Real-time   | Socket.io                     |
| AI          | Google Gemini API             |
| Email       | Resend (Nodemailer fallback)  |
| File Store  | AWS S3 (local `uploads/` fallback) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [PostgreSQL 15+](https://www.postgresql.org) (or a managed DB like [Neon](https://neon.tech))
- [Redis](https://redis.io) or [Upstash](https://upstash.com) (free cloud Redis)

### 1. Clone the repository
```bash
git clone https://github.com/adarsh8081/edusphere-classroom.git
cd edusphere-classroom
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env and fill in your credentials
```

See the [Environment Variables](#environment-variables) section below for details.

### 4. Set up the database
```bash
# Push the schema to your PostgreSQL database
npm run db:push
```

### 5. Start the development server
```bash
npm run dev
# App runs at http://localhost:3000
```

---

## 🏗️ Building for Production

```bash
npm run build
# Outputs to dist/index.cjs (server) and dist/public/ (client)

# Start production server
NODE_ENV=production npm start
```

---

## 🌍 Environment Variables

Copy `.env.example` to `.env` and fill in each value. Key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | Strong random string for session signing |
| `GOOGLE_GEMINI_API_KEY` | ✅ | Gemini AI key (from aistudio.google.com) |
| `REDIS_URL` | ⚠️ | Redis URL (falls back to in-memory if missing) |
| `RESEND_API_KEY` | ⚠️ | Email delivery (falls back to console mock) |
| `AWS_ACCESS_KEY_ID` + others | ⚠️ | S3 storage (falls back to local `uploads/`) |
| `GOOGLE_CLIENT_ID/SECRET` | ❌ | Google OAuth (optional) |
| `GITHUB_CLIENT_ID/SECRET` | ❌ | GitHub OAuth (optional) |
| `APP_URL` | ❌ | Public URL for email links |

---

## 📂 Project Structure

```
edusphere-classroom/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── hooks/
├── server/          # Express backend
│   ├── index.ts     # Entry point
│   ├── routes.ts    # API routes
│   ├── storage.ts   # DB operations
│   ├── auth.ts      # Passport.js auth
│   ├── redis.ts     # Redis client
│   └── services/    # AI, email, notifications
├── shared/          # Shared types & DB schema (Drizzle)
├── script/          # Build scripts
└── .env.example     # Environment template
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch strategy and development guidelines.

---

## 📄 License

MIT License. Part of the **EduSphere** platform.
