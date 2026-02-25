/**
 * Input validation for incoming WebSocket messages.
 *
 * Every message from the client is untrusted — we validate structure,
 * types, and lengths before touching any business logic.
 */

/** Maximum allowed message body length (UTF-16 code units). */
const MAX_CONTENT_LENGTH = 5000;

/** Maximum raw frame size we'll accept (prevents memory bomb). */
export const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB

/**
 * Parse and validate a raw WebSocket frame.
 * Returns { ok, data?, error? }.
 *
 * @param {string | Buffer} raw
 * @returns {{ ok: true, data: object } | { ok: false, error: { code: string, message: string } }}
 */
export function validateMessage(raw) {
  // ── 1. Parse JSON ──────────────────────────────────────
  let data;
  try {
    data = JSON.parse(typeof raw === "string" ? raw : raw.toString("utf8"));
  } catch {
    return fail("INVALID_JSON", "Message is not valid JSON.");
  }

  // ── 2. Must be a non-null object ───────────────────────
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return fail("INVALID_FORMAT", "Message must be a JSON object.");
  }

  // ── 3. Require a 'type' field ──────────────────────────
  if (typeof data.type !== "string" || data.type.length === 0) {
    return fail("MISSING_TYPE", "Message must include a 'type' field.");
  }

  // ── 4. Type-specific validation ────────────────────────
  switch (data.type) {
    case "direct_message":
      return validateDirectMessage(data);

    case "get_history":
      return validateGetHistory(data);

    case "ping":
      return ok(data);

    case "get_online_users":
      return ok(data);

    default:
      return fail("UNKNOWN_TYPE", `Unknown message type: '${data.type}'.`);
  }
}

/* ── Type-specific validators ─────────────────────────────── */

function validateDirectMessage(data) {
  if (typeof data.to !== "string" || data.to.trim().length === 0) {
    return fail("MISSING_RECIPIENT", "'to' field must be a non-empty string.");
  }
  if (typeof data.content !== "string" || data.content.trim().length === 0) {
    return fail("EMPTY_CONTENT", "'content' must be a non-empty string.");
  }
  if (data.content.length > MAX_CONTENT_LENGTH) {
    return fail(
      "CONTENT_TOO_LONG",
      `Message content exceeds ${MAX_CONTENT_LENGTH} characters.`
    );
  }
  // Sanitize — strip the 'to' to prevent whitespace tricks
  data.to = data.to.trim();
  data.content = data.content.trim();
  return ok(data);
}

function validateGetHistory(data) {
  if (typeof data.with !== "string" || data.with.trim().length === 0) {
    return fail("MISSING_USER", "'with' field must be a non-empty userId.");
  }
  data.with = data.with.trim();
  if (data.limit !== undefined) {
    data.limit = parseInt(data.limit, 10);
    if (isNaN(data.limit) || data.limit < 1) data.limit = 50;
    if (data.limit > 200) data.limit = 200;
  }
  return ok(data);
}

/* ── Helpers ──────────────────────────────────────────────── */

function ok(data) {
  return { ok: true, data };
}

function fail(code, message) {
  return { ok: false, error: { code, message } };
}
