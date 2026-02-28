// JWT Token Generator — development utility.
// Usage: node generate-token.js <userId> [name]

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
