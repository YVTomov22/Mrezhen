/**
 * User presence tracker — maps userId ↔ WebSocket connections and
 * broadcasts online / offline events.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SCALING NOTE — Redis Pub/Sub for multi-node presence          ║
 * ║                                                                ║
 * ║  With multiple server instances behind a load balancer:        ║
 * ║                                                                ║
 * ║  1. Each node keeps a LOCAL _connections map (same as now).    ║
 * ║                                                                ║
 * ║  2. On connect/disconnect, PUBLISH to a Redis channel:         ║
 * ║       PUBLISH presence '{"userId":"x","status":"online"}'      ║
 * ║                                                                ║
 * ║  3. Every node SUBSCRIBES to the "presence" channel and        ║
 * ║     forwards the event to its locally connected clients.       ║
 * ║                                                                ║
 * ║  4. The global online set lives in Redis:                      ║
 * ║       SADD  online_users  <userId>   (on connect)              ║
 * ║       SREM  online_users  <userId>   (on disconnect)           ║
 * ║       SMEMBERS online_users          (list all online)         ║
 * ║                                                                ║
 * ║  This module's public API stays the same — only the internal   ║
 * ║  implementation changes.                                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export class Presence {
  constructor() {
    /**
     * userId → Set<WebSocket>
     * A user can have multiple device connections (tabs, phone).
     * We track all of them so a user is "online" as long as at
     * least one socket is alive.
     */
    this._connections = new Map();

    /**
     * WeakMap<WebSocket, string>  — reverse lookup ws → userId.
     * Weak so closed sockets are GC'd.
     */
    this._socketUser = new WeakMap();

    /**
     * Callbacks registered via onChange().
     * @type {Set<(event: {userId:string, status:string, onlineUsers:string[]}) => void>}
     */
    this._listeners = new Set();
  }

  /* ── Public API ─────────────────────────────────────────── */

  /**
   * Register a WebSocket for a userId.
   * @param {string} userId
   * @param {import("ws").WebSocket} ws
   */
  add(userId, ws) {
    this._socketUser.set(ws, userId);

    if (!this._connections.has(userId)) {
      this._connections.set(userId, new Set());
    }
    this._connections.get(userId).add(ws);

    // First connection for this user → they just came online
    if (this._connections.get(userId).size === 1) {
      this._emit(userId, "online");
    }
  }

  /**
   * Remove a WebSocket (on close / error).
   * @param {import("ws").WebSocket} ws
   */
  remove(ws) {
    const userId = this._socketUser.get(ws);
    if (!userId) return;

    const sockets = this._connections.get(userId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this._connections.delete(userId);
        // Last connection gone → user is offline
        this._emit(userId, "offline");
      }
    }
  }

  /**
   * Get all active WebSocket connections for a user.
   * Returns an empty array if the user is offline.
   *
   * @param {string} userId
   * @returns {import("ws").WebSocket[]}
   */
  getSockets(userId) {
    const set = this._connections.get(userId);
    return set ? [...set] : [];
  }

  /**
   * Check if a user has at least one active connection.
   * @param {string} userId
   * @returns {boolean}
   */
  isOnline(userId) {
    return this._connections.has(userId) && this._connections.get(userId).size > 0;
  }

  /**
   * List all currently online user IDs.
   * @returns {string[]}
   */
  onlineUsers() {
    return [...this._connections.keys()];
  }

  /**
   * Get the userId associated with a WebSocket.
   * @param {import("ws").WebSocket} ws
   * @returns {string | undefined}
   */
  getUserId(ws) {
    return this._socketUser.get(ws);
  }

  /**
   * Register a listener for presence changes.
   * The callback receives { userId, status, onlineUsers }.
   *
   * @param {(event: object) => void} fn
   * @returns {() => void}  Unsubscribe function
   */
  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /* ── Internal ───────────────────────────────────────────── */

  _emit(userId, status) {
    const event = {
      userId,
      status,
      onlineUsers: this.onlineUsers(),
    };
    for (const fn of this._listeners) {
      try {
        fn(event);
      } catch (err) {
        console.error("[presence] listener error:", err);
      }
    }
  }
}
