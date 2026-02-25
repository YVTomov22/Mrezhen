/**
 * JWT Token Generator — development utility.
 *
 * Usage:
 *   node generate-token.js <userId> [name]
 *
 * Examples:
 *   node generate-token.js user_alice Alice
 *   node generate-token.js user_bob   Bob
 *
 * The generated token is valid for 24 hours and can be passed
 * as a query parameter when connecting:
 *   ws://localhost:3001?token=<JWT>
 */

import { signToken } from "./lib/auth.js";

const userId = process.argv[2];
const name = process.argv[3] || userId;

if (!userId) {
  console.error("Usage: node generate-token.js <userId> [name]");
  process.exit(1);
}

const token = signToken({ userId, name });

console.log(`\n  User  : ${name} (${userId})`);
console.log(`  Token : ${token}\n`);
