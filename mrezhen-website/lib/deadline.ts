/**
 * deadline.ts — Quest deadline resolution service
 *
 * Rules (in priority order):
 *  1. Explicit deadline supplied by the caller → use it as-is.
 *  2. Parent milestone has a dueDate → place the quest deadline
 *     MILESTONE_OFFSET_DAYS before that date (floor at createdAt so we
 *     never produce a deadline in the past).
 *  3. No milestone dueDate → createdAt + FALLBACK_DURATION_DAYS.
 *
 * All arithmetic is done in UTC to avoid DST / timezone surprises.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/** Days before milestone.dueDate to place the quest deadline. */
export const MILESTONE_OFFSET_DAYS = 3

/** Fallback window (days from creation) when the milestone has no dueDate. */
export const FALLBACK_DURATION_DAYS = 7

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeadlineInput {
  /** Deadline explicitly chosen by the user — always wins if provided. */
  explicit?: Date | null
  /** The parent milestone's dueDate (may be null / undefined). */
  milestoneDueDate?: Date | null
  /**
   * The quest's creation timestamp.
   * Defaults to `new Date()` (now in UTC) so callers can omit it in
   * production and set it explicitly in tests.
   */
  createdAt?: Date
  /** Override MILESTONE_OFFSET_DAYS for this call. */
  offsetDays?: number
  /** Override FALLBACK_DURATION_DAYS for this call. */
  fallbackDays?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a new Date that is `days` calendar days after `base`, using UTC
 * date arithmetic so that DST transitions never shift the result.
 */
function addUTCDays(base: Date, days: number): Date {
  const result = new Date(base)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

// ─── Core service function ────────────────────────────────────────────────────

/**
 * Resolves the deadline for a newly created quest.
 *
 * @example
 * // Explicit deadline supplied — returned unchanged
 * resolveQuestDeadline({ explicit: someDate }) // → someDate
 *
 * @example
 * // Milestone has a dueDate, no explicit deadline
 * resolveQuestDeadline({ milestoneDueDate: milestoneEnd }) // → milestoneEnd - 3 days
 *
 * @example
 * // No milestone dueDate, no explicit deadline
 * resolveQuestDeadline({}) // → now + 7 days
 */
export function resolveQuestDeadline({
  explicit,
  milestoneDueDate,
  createdAt = new Date(),
  offsetDays = MILESTONE_OFFSET_DAYS,
  fallbackDays = FALLBACK_DURATION_DAYS,
}: DeadlineInput): Date {
  // ── Rule 1: caller supplied an explicit deadline ──────────────────────────
  if (explicit != null) {
    return explicit
  }

  // ── Rule 2: parent milestone has a dueDate ────────────────────────────────
  if (milestoneDueDate != null) {
    const candidate = addUTCDays(milestoneDueDate, -offsetDays)
    // Guard: if the offset would land before or at createdAt (e.g. milestone
    // is due very soon), fall back to the milestone dueDate itself so the
    // quest deadline is never in the past.
    return candidate > createdAt ? candidate : milestoneDueDate
  }

  // ── Rule 3: no dueDate at all — use fallback duration ─────────────────────
  return addUTCDays(createdAt, fallbackDays)
}
