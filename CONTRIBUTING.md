# 🤝 Contributing to EduSphere Classroom

Thank you for contributing! This module is part of the larger **EduSphere** platform. Please read this guide before submitting changes.

---

## 📐 Branch Strategy

We follow a simplified **Git Flow** adapted for a feature module:

```
main          ← stable, production-ready code
  └── develop ← integration branch (all feature PRs merge here)
        ├── feature/your-feature-name
        ├── fix/bug-description
        └── chore/task-description
```

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Never commit directly. |
| `develop` | Integration branch. All PRs target this branch. |
| `feature/*` | New features. Branch off `develop`. |
| `fix/*` | Bug fixes. Branch off `develop`. |
| `chore/*` | Maintenance (deps, config). Branch off `develop`. |

---

## 🚀 Development Workflow

### 1. Fork & clone
```bash
git clone https://github.com/adarsh8081/edusphere-classroom.git
cd edusphere-classroom
```

### 2. Create your branch from `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 3. Set up your environment
```bash
npm install
cp .env.example .env
# Fill in your .env values
npm run db:push
npm run dev
```

### 4. Make your changes
- Keep commits small and focused
- Use clear commit messages: `feat: add quiz timer`, `fix: socket reconnect loop`

### 5. Push and open a Pull Request → `develop`
```bash
git push origin feature/your-feature-name
```
Then open a PR targeting the `develop` branch on GitHub.

---

## 📋 PR Checklist

Before submitting your PR, make sure:

- [ ] Code runs without errors (`npm run dev`)
- [ ] TypeScript compiles cleanly (`npm run check`)
- [ ] No `.env` or secrets committed
- [ ] New environment variables are added to `.env.example`
- [ ] UI changes are consistent with the existing design system (shadcn/ui + TailwindCSS)

---

## 🔐 Security

- **Never commit** `.env`, API keys, passwords, or tokens
- If you accidentally do, **rotate your keys immediately** and contact the project owner
- All secrets go in `.env` (gitignored). Use `.env.example` as the template.

---

## 📦 Project Context

This repository (`edusphere-classroom`) is a **feature module** within the broader EduSphere platform. When you see references to a parent project or shared services, that's intentional — integration points are documented in the code with `// TODO: integrate with EduSphere Platform` comments.

---

## 🙋 Questions?

Open a [GitHub Discussion](https://github.com/adarsh8081/edusphere-classroom/discussions) or reach out to the maintainer.
