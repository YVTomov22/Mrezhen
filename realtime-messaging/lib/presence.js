// User presence tracker - maps userId <-> WebSocket connections, broadcasts online/offline events.
// Scaling: use Redis Pub/Sub + SADD/SREM for multi-node presence.

export class Presence {
  constructor() {
    // userId -> Set<WebSocket> (supports multiple device connections)
    this._connections = new Map();

    // WeakMap<WebSocket, string> - reverse lookup ws -> userId
    this._socketUser = new WeakMap();

    // Presence change listeners
    this._listeners = new Set();
  }

  // Public API

  /** Register a WebSocket for a userId. */
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

  /** Remove a WebSocket (on close/error). */
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

  /** Get all active WebSocket connections for a user. */
  getSockets(userId) {
    const set = this._connections.get(userId);
    return set ? [...set] : [];
  }

  /** Check if a user has at least one active connection. */
  isOnline(userId) {
    return this._connections.has(userId) && this._connections.get(userId).size > 0;
  }

  /** List all currently online user IDs. */
  onlineUsers() {
    return [...this._connections.keys()];
  }

  /** Get the userId associated with a WebSocket. */
  getUserId(ws) {
    return this._socketUser.get(ws);
  }

  /** Register a listener for presence changes. Returns an unsubscribe function. */
  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  // Internal

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
