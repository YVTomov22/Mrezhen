// In-memory message store with a Redis-compatible interface.
// Swap to Redis: implement the same public methods with RPUSH/LRANGE/DEL.
export class MemoryStore {
  constructor() {
    /** @type {Map<string, StoredMessage[]>}  userId → queued messages */
    this._offlineQueues = new Map();

    /** @type {Map<string, StoredMessage[]>}  recipientId → message history */
    this._history = new Map();

    /** Cap offline queue per user. */
    this.MAX_OFFLINE_QUEUE = 500;

    /** Cap history per conversation. */
    this.MAX_HISTORY = 1000;
  }

  // Offline queue

  /** Queue a message for an offline user. */
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

  /** Drain all queued messages for a user. */
  async drainQueue(userId) {
    const queue = this._offlineQueues.get(userId) || [];
    this._offlineQueues.delete(userId);
    return queue;
  }

  // Message history

  /** Persist a message to the conversation history. */
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

  /** Retrieve recent conversation history between two users. */
  async getHistory(userA, userB, limit = 50) {
    const key = this._conversationKey(userA, userB);
    const list = this._history.get(key) || [];
    return list.slice(-limit);
  }

  // Internal helpers

  /** Deterministic conversation key so A->B and B->A share one list. */
  _conversationKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }
}
