
/**
 * CARMART Broker Portal
 * Reset an existing user's password.
 *
 * Reuses set-portal-password.cjs so the password
 * hashing and database update remain consistent.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const existingScript = path.join(
  __dirname,
  "set-portal-password.cjs"
);

if (!fs.existsSync(existingScript)) {
  console.error(
    "ERROR: set-portal-password.cjs was not found."
  );
  process.exit(1);
}

console.log(
  "CARMART | Reset Portal User Password"
);

console.log(
  "This will update an existing account's password."
);

const result = spawnSync(
  process.execPath,
  [existingScript, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.signal) {
  console.error(
    `Process stopped: ${result.signal}`
  );
  process.exit(1);
}

process.exit(result.status ?? 1);
