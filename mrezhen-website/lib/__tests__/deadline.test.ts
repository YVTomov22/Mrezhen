/**
 * deadline.test.ts — Unit tests for the quest deadline service.
 *
 * Run with: npx jest lib/__tests__/deadline.test.ts
 * (or: npx vitest run lib/__tests__/deadline.test.ts)
 *
 * No database, no network — pure function unit tests.
 */

import {
  resolveQuestDeadline,
  MILESTONE_OFFSET_DAYS,
  FALLBACK_DURATION_DAYS,
} from "../deadline"

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Build a UTC date at midnight for a given ISO date string. */
const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

/** Delta in whole UTC calendar days between two dates. */
const daysDiff = (a: Date, b: Date) =>
  Math.round((a.getTime() - b.getTime()) / 86_400_000)

// ─── tests ────────────────────────────────────────────────────────────────────

describe("resolveQuestDeadline", () => {
  // ── Rule 1: explicit deadline ───────────────────────────────────────────────
  describe("explicit deadline", () => {
    it("returns the explicit deadline unchanged", () => {
      const explicit = d("2026-03-15")
      const result = resolveQuestDeadline({ explicit })
      expect(result).toBe(explicit)
    })

    it("ignores milestoneDueDate when explicit is provided", () => {
      const explicit = d("2026-03-15")
      const result = resolveQuestDeadline({
        explicit,
        milestoneDueDate: d("2026-04-01"),
      })
      expect(result).toBe(explicit)
    })

    it("ignores null milestoneDueDate when explicit is provided", () => {
      const explicit = d("2026-03-15")
      const result = resolveQuestDeadline({ explicit, milestoneDueDate: null })
      expect(result).toBe(explicit)
    })
  })

  // ── Rule 2: milestone has a dueDate ────────────────────────────────────────
  describe("milestone dueDate exists, no explicit deadline", () => {
    it(`defaults to ${MILESTONE_OFFSET_DAYS} days before milestone dueDate`, () => {
      const createdAt = d("2026-03-01")
      const milestoneDueDate = d("2026-04-01")
      const result = resolveQuestDeadline({ milestoneDueDate, createdAt })
      expect(daysDiff(milestoneDueDate, result)).toBe(MILESTONE_OFFSET_DAYS)
    })

    it("respects custom offsetDays", () => {
      const createdAt = d("2026-03-01")
      const milestoneDueDate = d("2026-04-01")
      const result = resolveQuestDeadline({
        milestoneDueDate,
        createdAt,
        offsetDays: 7,
      })
      expect(daysDiff(milestoneDueDate, result)).toBe(7)
    })

    it("falls back to milestone dueDate when offset would be in the past", () => {
      // milestone due in 1 day, but offset is 3 → candidate < createdAt
      const createdAt = d("2026-03-30")
      const milestoneDueDate = d("2026-03-31")
      const result = resolveQuestDeadline({ milestoneDueDate, createdAt })
      // Should fall back to the milestone dueDate itself
      expect(result.getTime()).toBe(milestoneDueDate.getTime())
    })

    it("falls back to milestone dueDate when offset lands exactly on createdAt", () => {
      // milestoneDueDate - offsetDays === createdAt (not strictly greater)
      const createdAt = d("2026-03-29")
      const milestoneDueDate = d("2026-04-01") // 3 days later = createdAt exactly
      const result = resolveQuestDeadline({
        milestoneDueDate,
        createdAt,
        offsetDays: 3, // milestoneDueDate - 3 = 2026-03-29 = createdAt
      })
      expect(result.getTime()).toBe(milestoneDueDate.getTime())
    })
  })

  // ── Rule 3: no milestone dueDate ───────────────────────────────────────────
  describe("no milestone dueDate, no explicit deadline", () => {
    it(`defaults to ${FALLBACK_DURATION_DAYS} days from createdAt`, () => {
      const createdAt = d("2026-03-01")
      const result = resolveQuestDeadline({ createdAt })
      expect(daysDiff(result, createdAt)).toBe(FALLBACK_DURATION_DAYS)
    })

    it("respects custom fallbackDays", () => {
      const createdAt = d("2026-03-01")
      const result = resolveQuestDeadline({ createdAt, fallbackDays: 14 })
      expect(daysDiff(result, createdAt)).toBe(14)
    })

    it("treats undefined milestoneDueDate the same as null", () => {
      const createdAt = d("2026-03-01")
      const withNull = resolveQuestDeadline({ createdAt, milestoneDueDate: null })
      const withUndefined = resolveQuestDeadline({ createdAt, milestoneDueDate: undefined })
      expect(withNull.getTime()).toBe(withUndefined.getTime())
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles DST boundary (clocks spring forward) without shifting date", () => {
      // US clocks spring forward on 2026-03-08 — UTC date arithmetic must be unaffected
      const createdAt = d("2026-03-07")
      const result = resolveQuestDeadline({ createdAt, fallbackDays: 7 })
      expect(result.toISOString().slice(0, 10)).toBe("2026-03-14")
    })

    it("handles year boundary", () => {
      const createdAt = d("2025-12-28")
      const result = resolveQuestDeadline({ createdAt, fallbackDays: 7 })
      expect(result.toISOString().slice(0, 10)).toBe("2026-01-04")
    })

    it("handles leap-year February", () => {
      const createdAt = d("2028-02-27") // 2028 is a leap year
      const result = resolveQuestDeadline({ createdAt, fallbackDays: 3 })
      expect(result.toISOString().slice(0, 10)).toBe("2028-03-01")
    })
  })
})
