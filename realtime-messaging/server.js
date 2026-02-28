// Mrezhen Real-Time Messaging Server
// WebSocket server (ws + Express) with JWT auth, presence, direct messaging,
// offline queuing, rate limiting, and input validation.

import { createServer } from "node:http";
import express from "express";
import { WebSocketServer } from "ws";

import { verifyToken, extractToken } from "./lib/auth.js";
import { Presence } from "./lib/presence.js";
import { MemoryStore } from "./lib/store.js";
import { Messaging } from "./lib/messaging.js";
import { RateLimiter } from "./lib/rate-limiter.js";
import { validateMessage, MAX_PAYLOAD_BYTES } from "./lib/validation.js";

// Configuration

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 s — detect stale sockets
const RATE_LIMIT_MESSAGES = parseInt(process.env.RATE_LIMIT_MESSAGES || "30", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);

// Instantiate modules

const presence = new Presence();
const store = new MemoryStore();
const messaging = new Messaging(presence, store);
const rateLimiter = new RateLimiter(RATE_LIMIT_MESSAGES, RATE_LIMIT_WINDOW_MS);

// Express — health check & future REST endpoints

const app = express();
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    connections: presence.onlineUsers().length,
  });
});

// HTTP server + WebSocket server

const server = createServer(app);

const wss = new WebSocketServer({
  noServer: true, // We handle the upgrade manually for auth
  maxPayload: MAX_PAYLOAD_BYTES,
});

// HTTP Upgrade handler — authenticate before upgrading to WS.
server.on("upgrade", (req, socket, head) => {
  const token = extractToken(req);

  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    socket.write(`HTTP/1.1 401 ${msg}\r\n\r\n`);
    socket.destroy();
    return;
  }

  if (!payload.userId) {
    socket.write("HTTP/1.1 401 Missing userId in token\r\n\r\n");
    socket.destroy();
    return;
  }

  // Attach the decoded user to the request so the connection handler can read it
  req._user = payload;

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

// WebSocket connection handler

wss.on("connection", async (ws, req) => {
  const user = req._user;
  const userId = user.userId;

  console.log(`[ws] connected: ${userId} (${user.name || "unknown"})`);

  // Register presence
  presence.add(userId, ws);

  // Deliver offline messages
  try {
    await messaging.deliverQueued(userId);
  } catch (err) {
    console.error(`[ws] failed to deliver queued messages for ${userId}:`, err);
  }

  // Send current online users to the newly connected client
  safeSend(ws, JSON.stringify({
    type: "online_users",
    users: presence.onlineUsers(),
  }));

  // Heartbeat (ping/pong)
  ws._isAlive = true;
  ws.on("pong", () => {
    ws._isAlive = true;
  });

  // Message handler
  ws.on("message", async (raw) => {
    // Rate-limit check
    const limit = rateLimiter.consume(userId);
    if (!limit.allowed) {
      safeSend(ws, JSON.stringify({
        type: "error",
        code: "RATE_LIMITED",
        message: `Too many messages. Retry in ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
      }));
      return;
    }

    // Validate
    const result = validateMessage(raw);
    if (!result.ok) {
      safeSend(ws, JSON.stringify({ type: "error", ...result.error }));
      return;
    }

    const data = result.data;

    try {
      switch (data.type) {
        /* Direct message */
        case "direct_message": {
          // Prevent spoofing — sender is always the JWT-authenticated user
          if (data.to === userId) {
            safeSend(ws, JSON.stringify({
              type: "error",
              code: "SELF_MESSAGE",
              message: "Cannot send a message to yourself.",
            }));
            return;
          }

          await messaging.sendDirect(ws, userId, data.to, data.content);
          break;
        }

        /* History retrieval */
        case "get_history": {
          await messaging.sendHistory(ws, userId, data.with, data.limit);
          break;
        }

        /* Ping (application-level keep-alive) */
        case "ping": {
          safeSend(ws, JSON.stringify({ type: "pong", timestamp: Date.now() }));
          break;
        }

        /* Online users list */
        case "get_online_users": {
          safeSend(ws, JSON.stringify({
            type: "online_users",
            users: presence.onlineUsers(),
          }));
          break;
        }
      }
    } catch (err) {
      console.error(`[ws] error handling message from ${userId}:`, err);
      safeSend(ws, JSON.stringify({
        type: "error",
        code: "INTERNAL_ERROR",
        message: "An internal error occurred.",
      }));
    }
  });

  // Disconnect
  ws.on("close", () => {
    console.log(`[ws] disconnected: ${userId}`);
    presence.remove(ws);
  });

  ws.on("error", (err) => {
    console.error(`[ws] socket error for ${userId}:`, err.message);
    presence.remove(ws);
  });
});

// Presence broadcasts — notify all connected users

presence.onChange((event) => {
  const payload = JSON.stringify({
    type: "presence",
    userId: event.userId,
    status: event.status,
    onlineUsers: event.onlineUsers,
  });

  // Broadcast to every connected socket.
  for (const client of wss.clients) {
    safeSend(client, payload);
  }
});

// Heartbeat — detect and clean up stale connections

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws._isAlive === false) {
      // Client didn't respond to the last ping — terminate
      console.log(`[ws] terminating stale connection: ${presence.getUserId(ws)}`);
      ws.terminate();
      return;
    }
    ws._isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_INTERVAL_MS);

wss.on("close", () => {
  clearInterval(heartbeat);
  rateLimiter.destroy();
});

// Graceful shutdown

function shutdown(signal) {
  console.log(`\n[server] ${signal} received — shutting down gracefully`);

  // Stop accepting new connections
  server.close(() => {
    console.log("[server] HTTP server closed");
  });

  // Close all WebSockets with a Going Away code
  for (const ws of wss.clients) {
    ws.close(1001, "Server shutting down");
  }

  wss.close(() => {
    console.log("[server] WebSocket server closed");
    rateLimiter.destroy();
    process.exit(0);
  });

  // Force exit after 10 s if graceful shutdown stalls
  setTimeout(() => {
    console.error("[server] Forced exit after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Start

server.listen(PORT, () => {
  console.log(`\n  🐝  Mrezhen Messaging Server`);
  console.log(`  ────────────────────────────`);
  console.log(`  WebSocket : ws://localhost:${PORT}`);
  console.log(`  Health    : http://localhost:${PORT}/health`);
  console.log(`  Heartbeat : every ${HEARTBEAT_INTERVAL_MS / 1000}s`);
  console.log(`  Rate limit: ${RATE_LIMIT_MESSAGES} msgs / ${RATE_LIMIT_WINDOW_MS / 1000}s\n`);
});

// Utility

function safeSend(ws, data) {
  if (ws.readyState === 1 /* OPEN */) {
    ws.send(data);
  }
}
