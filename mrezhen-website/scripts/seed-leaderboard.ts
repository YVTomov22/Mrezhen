/**
 * Seed script – populates the database with sample leaderboard data.
 *
 * Usage:
 *   npx tsx scripts/seed-leaderboard.ts
 *
 * This creates 200 sample users with randomised scores, levels, and regions
 * so the leaderboard pages have realistic data to display.
 *
 * Safe to run multiple times – uses upsert keyed on email.
 */

import { PrismaClient } from "../lib/generated/prisma"

const prisma = new PrismaClient()

const REGIONS = ["global", "na", "eu", "asia", "sa", "africa", "oceania", "mena"] as const

const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Quinn",
  "Avery", "Skyler", "Jamie", "Drew", "Robin", "Kai", "Sage", "Rowan",
  "Harper", "Dakota", "Emery", "Finley", "Blake", "Cameron", "Devon", "Elliot",
  "Hayden", "Jesse", "Logan", "Marley", "Parker", "Reese", "Sawyer", "Tatum",
]

const LAST_NAMES = [
  "Chen", "Smith", "Park", "Johnson", "Kim", "Lee", "Brown", "Williams",
  "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez",
  "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore",
  "Jackson", "Martin", "White", "Harris", "Thompson", "Clark", "Lewis", "Walker",
]

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomScore(): number {
  // Weighted distribution: most users 0–5000, some up to 50000
  const r = Math.random()
  if (r < 0.7) return Math.floor(Math.random() * 5000)
  if (r < 0.9) return Math.floor(Math.random() * 15000) + 5000
  return Math.floor(Math.random() * 30000) + 20000
}

function scoreToLevel(score: number): number {
  return Math.max(1, Math.floor(score / 1000) + 1)
}

async function main() {
  console.log("🌱 Seeding leaderboard data…")

  const users = Array.from({ length: 200 }, (_, i) => {
    const first = randomItem(FIRST_NAMES)
    const last = randomItem(LAST_NAMES)
    const num = i + 1
    const username = `${first.toLowerCase()}${last.toLowerCase()}${num}`
    const email = `${username}@seed.mrezhen.local`
    const score = randomScore()
    return {
      username,
      email,
      name: `${first} ${last}`,
      score,
      level: scoreToLevel(score),
      region: randomItem(REGIONS),
    }
  })

  let created = 0
  let updated = 0

  for (const u of users) {
    const result = await prisma.user.upsert({
      where: { email: u.email },
      update: { score: u.score, level: u.level, region: u.region },
      create: {
        username: u.username,
        email: u.email,
        name: u.name,
        score: u.score,
        level: u.level,
        region: u.region,
      },
    })
    // Prisma upsert doesn't tell us if it created or updated, so we
    // check if createdAt ≈ updatedAt to approximate "created".
    if (Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000) {
      created++
    } else {
      updated++
    }
  }

  console.log(`✅ Done! Created ${created} users, updated ${updated} users.`)
  console.log(`   Total users in DB: ${await prisma.user.count()}`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
