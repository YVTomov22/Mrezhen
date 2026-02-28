// Authentication module — JWT verification for WebSocket connections.
// The JWT secret is read from env; in production use a secrets manager.

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("FATAL: JWT_SECRET environment variable is not set. Server cannot start.");
const JWT_ISSUER = process.env.JWT_ISSUER || "mrezhen";

/** Verify a JWT and return the decoded payload. Throws on invalid/expired tokens. */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER, algorithms: ["HS256"] });
}

/** Sign a new JWT — used by the generate-token utility and tests. */
export function signToken(payload, expiresIn = "24h") {
  return jwt.sign(payload, JWT_SECRET, { issuer: JWT_ISSUER, expiresIn });
}

/** Extract a bearer token from URL query param or Sec-WebSocket-Protocol header. */
export function extractToken(req) {
  // 1. Query string  (ws://host/ws?token=xxx)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const fromQuery = url.searchParams.get("token");
  if (fromQuery) return fromQuery;

  // 2. Sec-WebSocket-Protocol  (client sends protocol: ["access_token", "<jwt>"])
  const protocols = req.headers["sec-websocket-protocol"];
  if (protocols) {
    const parts = protocols.split(",").map((s) => s.trim());
    // The token follows the literal "access_token" sub-protocol
    const idx = parts.indexOf("access_token");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  }

  return null;
}
