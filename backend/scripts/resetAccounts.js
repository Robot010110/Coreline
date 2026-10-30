// scripts/resetAccounts.js — wipe EVERY account and start over with just
// the accounts prisma/seed.js creates (Admin, Supervisor, Zone Manager,
// one Worker, one Cashier).
//
// Use this on a database that was seeded with the old demo people. A
// plain re-seed can't do it: seeding only ever adds, and most tables
// (tasks, attendance, chat, reports, …) point at a user or employee, so
// the database won't let a person be deleted while their history exists.
// So this empties the User and Employee tables with TRUNCATE ... CASCADE,
// which also empties every table that references them — that is, all
// of the old people's activity data and the markets/zones/products that
// pointed at the old accounts. The seed then recreates the zones, markets
// and demo products and the new accounts.
//
// It cannot be undone, so it does nothing unless you pass --yes:
//   npm run accounts:reset -- --yes

import "dotenv/config";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { PrismaClient } from "@prisma/client";

if (!process.argv.includes("--yes")) {
  console.log("This deletes ALL accounts and everything that depends on them (tasks, attendance,");
  console.log("chats, reports, and the markets/zones/products linked to old accounts), then re-seeds.");
  console.log("Nothing was changed. Re-run with --yes to go ahead:  npm run accounts:reset -- --yes");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User", "Employee" RESTART IDENTITY CASCADE');
  console.log("All accounts and dependent data deleted. Re-seeding…");
} finally {
  await prisma.$disconnect();
}

const seed = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prisma/seed.js");
const result = spawnSync(process.execPath, [seed], { stdio: "inherit" });
process.exit(result.status ?? 1);
