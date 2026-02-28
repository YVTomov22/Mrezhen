# Mrezhen Real-Time Messaging Service

Production-ready WebSocket server for direct messaging between authenticated users.

## Folder Structure

```
realtime-messaging/
├── server.js                 # Entry point — Express + WS server
├── generate-token.js         # Dev utility — create JWT tokens
├── client-example.html       # Browser demo client
├── package.json
├── README.md
└── lib/
    ├── auth.js               # JWT sign / verify / extract
    ├── store.js              # In-memory store (Redis-ready interface)
    ├── presence.js           # User presence tracking + broadcasts
    ├── messaging.js          # Message routing, queuing, history
    ├── rate-limiter.js       # Per-user sliding window rate limiter
    └── validation.js         # Input parsing + validation
```

## Quick Start

```bash
cd realtime-messaging
npm install
```

### 1. Generate test tokens

```bash
node generate-token.js user_alice Alice
node generate-token.js user_bob   Bob
```

### 2. Start the server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
JWT_SECRET=your-production-secret node server.js
```

### 3. Test with the browser client

Open `client-example.html` in two browser tabs. Paste a different token in each tab, set the other user as the recipient, and start chatting.

## Protocol Reference

All messages are JSON over WebSocket.

### Client → Server

| Type | Payload | Description |
|------|---------|-------------|
| `direct_message` | `{ type, to, content }` | Send a message to another user |
| `get_history` | `{ type, with, limit? }` | Fetch conversation history |
| `get_online_users` | `{ type }` | Request current online user list |
| `ping` | `{ type }` | Application-level keep-alive |

### Server → Client

| Type | Payload | Description |
|------|---------|-------------|
| `direct_message` | `{ type, message: { id, from, content, timestamp }, queued? }` | Incoming message |
| `message_ack` | `{ type, messageId, to, timestamp, status }` | Delivery confirmation (`delivered` or `queued`) |
| `presence` | `{ type, userId, status, onlineUsers }` | User came online/offline |
| `online_users` | `{ type, users }` | Full online user list |
| `message_history` | `{ type, with, messages }` | Conversation history |
| `pong` | `{ type, timestamp }` | Keep-alive response |
| `error` | `{ type, code, message }` | Structured error |

### Error Codes

| Code | Meaning |
|------|---------|
| `INVALID_JSON` | Frame is not valid JSON |
| `INVALID_FORMAT` | Not a JSON object |
| `MISSING_TYPE` | No `type` field |
| `UNKNOWN_TYPE` | Unrecognized message type |
| `MISSING_RECIPIENT` | `to` field missing |
| `EMPTY_CONTENT` | Empty message body |
| `CONTENT_TOO_LONG` | Exceeds 5000 chars |
| `SELF_MESSAGE` | Sending to yourself |
| `RATE_LIMITED` | Too many messages |
| `INTERNAL_ERROR` | Server-side failure |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `mrezhen-dev-secret-change-in-production` | JWT signing key |
| `JWT_ISSUER` | `mrezhen` | JWT issuer claim |
| `WS_PORT` | `3001` | Server port |
| `RATE_LIMIT_MESSAGES` | `30` | Max messages per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |

## Security

- **JWT validation on upgrade** — unauthenticated TCP connections are rejected before the WS handshake completes, never reaching the message handler.
- **Sender identity from JWT** — the `from` field is always taken from the verified token, never from the client payload. Spoofing is impossible.
- **Rate limiting** — sliding window per user prevents message flooding.
- **Input validation** — every frame is parsed, type-checked, and length-capped before processing.
- **Max payload** — raw WS frames are capped at 64 KB at the protocol level.

## Architecture Decisions

### Why `ws` instead of Socket.io?

| Aspect | `ws` | Socket.io |
|--------|------|-----------|
| **Size** | ~40 KB, zero deps | ~300 KB + engine.io |
| **Protocol** | Standard RFC 6455 WebSocket | Custom protocol on top of WS |
| **Fallbacks** | None (WS only) | Long-polling, SSE fallbacks |
| **Control** | Full control over upgrade, framing, auth | Opinionated — rooms, namespaces, auto-reconnect built in |
| **Performance** | Minimal overhead | Extra encoding/decoding layer |
| **Interop** | Any WS client (browser, mobile, IoT) | Requires Socket.io client library |

**Tradeoff summary:** Socket.io is faster to prototype with (built-in rooms, reconnection, broadcasting), but `ws` gives you zero magic — you control the protocol, the auth flow, and the scaling strategy. For a production system where you need to control every byte and integrate with non-JS clients, `ws` is the right choice.

### Why separate modules?

Each concern (auth, presence, messaging, store, rate-limiting) is isolated behind a clean interface. This means:

- **Testing** — each module can be unit-tested in isolation.
- **Swappability** — the `MemoryStore` can be replaced with `RedisStore` without touching any other file.
- **Readability** — the server.js orchestrator is ~250 lines, easy to audit.

## Scaling to Multiple Nodes

### Current: Single Node

```
Client A ──► [ Node 1 ] ──► Client B
                 │
            MemoryStore
```

### Target: Multi-Node with Redis

```
Client A ──► [ Node 1 ] ──► Redis Pub/Sub ──► [ Node 2 ] ──► Client B
                 │                                  │
             Local Map                          Local Map
                 │               │                  │
                 └──────► Redis Store ◄─────────────┘
```

### Migration Steps

1. **Install `ioredis`** and create a `RedisStore` class that implements the same interface as `MemoryStore` (async methods: `queueMessage`, `drainQueue`, `storeMessage`, `getHistory`).

2. **Presence** — on connect/disconnect, `SADD`/`SREM` the user in a Redis set. `PUBLISH` presence events to a `presence` channel. Each node `SUBSCRIBE`s and forwards to local clients.

3. **Message delivery** — when `sendDirect()` doesn't find the recipient locally, `PUBLISH` the message to `dm:<recipientId>`. Each node subscribes to channels for its locally connected users and delivers.

4. **Load balancer** — use Nginx or HAProxy with `ip_hash` or `Upgrade` header-aware routing. Sticky sessions are NOT required because Redis handles cross-node communication.

5. **Rate limiting** — switch from the in-memory `Map` to `INCR`+`EXPIRE` on Redis keys: `ratelimit:<userId>:<windowKey>`.

Every public method in the `lib/` modules has inline comments marking the exact Redis command that replaces it.

## Adding Group Chat Later

The architecture supports group chat with minimal changes:

1. **Store** — add a `groups` collection: `{ groupId, name, members[], createdBy }`.

2. **New message type** — `group_message` with `{ type, groupId, content }`.

3. **Delivery** — iterate `group.members`, call `sendDirect()` for each (or batch via Redis `PUBLISH` to a `group:<groupId>` channel).

4. **Presence** — add `group_presence` events so members see who in the group is online.

5. **Validation** — verify the sender is a member of the group before accepting the message.

The modular design means you'd add a new `lib/groups.js` module and a new `case "group_message"` in the server's switch — existing code stays untouched.

## Health Check

```bash
curl http://localhost:3001/health
```

```json
{
  "status": "ok",
  "uptime": 123.456,
  "connections": 2
}
```
