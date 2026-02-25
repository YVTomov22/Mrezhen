/**
 * In-memory message store with a Redis-compatible interface.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SCALING NOTE — Redis replacement                              ║
 * ║                                                                ║
 * ║  Every public method in this class mirrors a Redis operation:  ║
 * ║    queueMessage()    → RPUSH  offline:<userId>  <json>         ║
 * ║    drainQueue()      → LRANGE + DEL  offline:<userId>          ║
 * ║    storeMessage()    → RPUSH  history:<recipientId>  <json>    ║
 * ║    getHistory()      → LRANGE history:<recipientId> -N -1      ║
 * ║                                                                ║
 * ║  To swap in Redis:                                             ║
 * ║    1. npm install ioredis                                      ║
 * ║    2. Create a RedisStore class implementing the same methods  ║
 * ║    3. Pass it to the Messaging constructor instead of this one ║
 * ║                                                                ║
 * ║  The rest of the app code stays identical.                     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/**
 * @typedef {Object} StoredMessage
 * @property {string}  id         UUID
 * @property {string}  from       Sender userId
 * @property {string}  to         Recipient userId
 * @property {string}  content    Message body
 * @property {number}  timestamp  Unix ms
 * @property {boolean} delivered  Has the recipient received it?
 */

export class MemoryStore {
  constructor() {
    /** @type {Map<string, StoredMessage[]>}  userId → queued messages */
    this._offlineQueues = new Map();

    /** @type {Map<string, StoredMessage[]>}  recipientId → message history */
    this._history = new Map();

    /**
     * Cap offline queue per user to prevent memory abuse.
     * In Redis you would use LTRIM after RPUSH.
     */
    this.MAX_OFFLINE_QUEUE = 500;

    /** Cap history per conversation (most recent N messages kept). */
    this.MAX_HISTORY = 1000;
  }

  /* ── Offline queue ─────────────────────────────────────── */

  /**
   * Queue a message for an offline user.
   * @param {string} userId
   * @param {StoredMessage} message
   */
  async queueMessage(userId, message) {
    if (!this._offlineQueues.has(userId)) {
      this._offlineQueues.set(userId, []);
    }
    const queue = this._offlineQueues.get(userId);
    queue.push(message);
    // Trim to cap — drop oldest
    if (queue.length > this.MAX_OFFLINE_QUEUE) {
      queue.splice(0, queue.length - this.MAX_OFFLINE_QUEUE);
    }
  }

  /**
   * Drain (pop all) queued messages for a user.
   * Returns the array and clears the queue atomically.
   * In Redis: LRANGE + DEL in a MULTI/EXEC pipeline.
   *
   * @param {string} userId
   * @returns {Promise<StoredMessage[]>}
   */
  async drainQueue(userId) {
    const queue = this._offlineQueues.get(userId) || [];
    this._offlineQueues.delete(userId);
    return queue;
  }

  /* ── Message history ───────────────────────────────────── */

  /**
   * Persist a message to the conversation history.
   * Key is the recipient userId.  In a real system you'd key by
   * a sorted pair `min(from,to):max(from,to)` for bidirectional history.
   *
   * @param {StoredMessage} message
   */
  async storeMessage(message) {
    const key = this._conversationKey(message.from, message.to);
    if (!this._history.has(key)) {
      this._history.set(key, []);
    }
    const list = this._history.get(key);
    list.push(message);
    if (list.length > this.MAX_HISTORY) {
      list.splice(0, list.length - this.MAX_HISTORY);
    }
  }

  /**
   * Retrieve recent conversation history between two users.
   *
   * @param {string} userA
   * @param {string} userB
   * @param {number} [limit=50]
   * @returns {Promise<StoredMessage[]>}
   */
  async getHistory(userA, userB, limit = 50) {
    const key = this._conversationKey(userA, userB);
    const list = this._history.get(key) || [];
    return list.slice(-limit);
  }

  /* ── Internal helpers ──────────────────────────────────── */

  /**
   * Deterministic conversation key so A→B and B→A share one list.
   * @param {string} a
   * @param {string} b
   * @returns {string}
   */
  _conversationKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }
}
