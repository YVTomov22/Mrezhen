// Core messaging engine - direct messages, delivery, offline queuing, acks, and history.
// Scaling: add Redis Pub/Sub for cross-node delivery via sendDirect().

import { v4 as uuid } from "uuid";

export class Messaging {
  constructor(presence, store) {
    this.presence = presence;
    this.store = store;
  }

  // Direct message

  /** Process a direct_message from an authenticated sender. */
  async sendDirect(senderWs, senderId, recipientId, content) {
    const message = {
      id: uuid(),
      from: senderId,
      to: recipientId,
      content,
      timestamp: Date.now(),
      delivered: false,
    };

    // Always store in history
    await this.store.storeMessage(message);

    const recipientSockets = this.presence.getSockets(recipientId);

    if (recipientSockets.length > 0) {
      // Online delivery
      message.delivered = true;

      const envelope = JSON.stringify({
        type: "direct_message",
        message: {
          id: message.id,
          from: message.from,
          content: message.content,
          timestamp: message.timestamp,
        },
      });

      for (const ws of recipientSockets) {
        this._safeSend(ws, envelope);
      }

      // SCALING: publish to Redis if recipient may be on another node.

      // Ack to sender — delivered
      this._safeSend(
        senderWs,
        JSON.stringify({
          type: "message_ack",
          messageId: message.id,
          to: recipientId,
          timestamp: message.timestamp,
          status: "delivered",
        })
      );
    } else {
      // Offline queuing
      await this.store.queueMessage(recipientId, message);

      // Ack to sender — queued (recipient offline)
      this._safeSend(
        senderWs,
        JSON.stringify({
          type: "message_ack",
          messageId: message.id,
          to: recipientId,
          timestamp: message.timestamp,
          status: "queued",
        })
      );
    }
  }

  // Deliver queued messages on reconnect

  /** Drain offline queue and deliver pending messages to a reconnecting user. */
  async deliverQueued(userId) {
    const queued = await this.store.drainQueue(userId);
    if (queued.length === 0) return;

    const sockets = this.presence.getSockets(userId);
    for (const msg of queued) {
      const envelope = JSON.stringify({
        type: "direct_message",
        message: {
          id: msg.id,
          from: msg.from,
          content: msg.content,
          timestamp: msg.timestamp,
        },
        queued: true, // client can distinguish real-time vs. catch-up messages
      });

      for (const ws of sockets) {
        this._safeSend(ws, envelope);
      }
    }
  }

  // History retrieval

  /** Send conversation history between two users to the requesting socket. */
  async sendHistory(ws, requesterId, otherUserId, limit = 50) {
    const messages = await this.store.getHistory(requesterId, otherUserId, limit);

    this._safeSend(
      ws,
      JSON.stringify({
        type: "message_history",
        with: otherUserId,
        messages: messages.map((m) => ({
          id: m.id,
          from: m.from,
          content: m.content,
          timestamp: m.timestamp,
        })),
      })
    );
  }

  // Helpers

  /** Send data to a WebSocket, silently catching errors on closed sockets. */
  _safeSend(ws, data) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(data);
    }
  }
}
