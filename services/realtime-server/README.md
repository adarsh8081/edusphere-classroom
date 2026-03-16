# EduSphere Realtime Server

> Dedicated Socket.io server for messaging and notifications.

## Status: Scaffold

Currently, Socket.io runs within the api-server. This directory is prepared for future extraction into a standalone realtime server for independent scaling.

## Architecture

```
services/realtime-server/
├── src/
│   ├── socket/
│   │   ├── chat.gateway.ts         ← Chat events
│   │   └── notification.gateway.ts ← Notification events
│   └── redis/
│       └── pubsub.ts               ← Redis pub/sub for multi-instance sync
```

## Benefits of Separation

- **Independent scaling** — Scale websocket connections separately from API
- **Reduced memory pressure** — API server doesn't hold socket connections
- **Horizontal scaling** — Multiple realtime instances with Redis adapter
