/**
 * Authentication module — JWT verification for WebSocket connections.
 *
 * Architecture note:
 *   The JWT secret is read from env at startup.  In production this should
 *   come from a secrets manager (AWS SSM, Vault, etc.), not plain env vars.
 *   The same secret must be shared with the HTTP auth service that issues
 *   tokens (the mrezhen-website NextAuth setup or the generate-token util).
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mrezhen-dev-secret-change-in-production";
const JWT_ISSUER = process.env.JWT_ISSUER || "mrezhen";

/**
 * Verify a JWT and return the decoded payload.
 * Throws on invalid / expired tokens.
 *
 * @param {string} token  Raw JWT string
 * @returns {{ userId: string, name?: string, iat: number, exp: number }}
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
}

/**
 * Sign a new JWT — used by the generate-token utility and tests.
 *
 * @param {{ userId: string, name?: string }} payload
 * @param {string} [expiresIn="24h"]
 * @returns {string}
 */
export function signToken(payload, expiresIn = "24h") {
  return jwt.sign(payload, JWT_SECRET, { issuer: JWT_ISSUER, expiresIn });
}

/**
 * Extract a bearer token from common transport locations.
 * Supports:
 *   1. URL query param  ?token=xxx
 *   2. Sec-WebSocket-Protocol header (useful when browser WS API
 *      doesn't support custom headers)
 *
 * @param {import("http").IncomingMessage} req
 * @returns {string | null}
 */
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
