# EduSphere Desktop App

> Electron wrapper for the EduSphere web application.

## Status: Scaffold

This directory is prepared for future Electron integration. The desktop app will wrap the existing React web UI using Electron.

## Getting Started (Future)

```bash
npm install
npm run dev     # Start Electron in dev mode
npm run build   # Build for distribution
```

## Architecture

```
apps/desktop/
├── electron/
│   ├── main.ts       ← Electron main process
│   └── preload.ts    ← Bridge between main and renderer
├── src/
│   └── renderer/     ← Shared React UI from @edusphere/web
└── assets/           ← App icons, splash screens
```

## Technology

- **Electron** for desktop packaging
- **electron-builder** for cross-platform distribution (.exe, .dmg, .AppImage)
- Shares 90% of frontend code with `apps/web/`
