// Seeds the DB with data shaped like the frontend's mock data
// (src/data/mockData.js), so you can compare real API output to the mock
// before wiring up the frontend's fetch() calls. Safe to re-run — every
// account/market lookup below is upsert-or-findFirst-guarded.
//
// Run with: npm run prisma:seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { OPEN_ACCESS_ACCOUNTS } from "../src/utils/openAccess.js";

const prisma = new PrismaClient();

// Market has no natural unique key besides its generated id, so every
// market here is found-by-name+zone first instead of upserted, to keep
// this script safely re-runnable without creating duplicates (an
// earlier version of this helper's inline logic was missing this guard
// in one spot and quietly duplicated rows on every re-run — fixed here
// by routing every market creation through this one function).
async function findOrCreateMarket(name, zoneId, extra = {}) {
  const existing = await prisma.market.findFirst({ where: { name, zoneId } });
  if (existing) {
    if (Object.keys(extra).length) return prisma.market.update({ where: { id: existing.id }, data: extra });
    return existing;
  }
  return prisma.market.create({ data: { name, zoneId, status: "ACTIVE", ...extra } });
}

// The only accounts the app starts with. Everything else is added by the
// Admin from the People screen (market, shift, User ID and password all
// chosen there).
//   Admin          signs in with a username + password (below).
//   Supervisor     } sign in with NO credentials — tapping the role on the
//   Zone Manager   } login screen enters directly (see utils/openAccess.js).
//   Worker/Cashier sign in with a code/username + password (below).
// Create-only: re-running the seed (Render does on every deploy) never
// overwrites a password someone has since changed.
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || "rahand";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "paywand";
const WORKER_USERNAME = process.env.SEED_WORKER_USERNAME || "worker01";
const WORKER_PASSWORD = process.env.SEED_WORKER_PASSWORD || "Worker123!";
const CASHIER_USERNAME = process.env.SEED_CASHIER_USERNAME || "cashier01";
const CASHIER_PASSWORD = process.env.SEED_CASHIER_PASSWORD || "Cashier123!";

// An open-access account has no password anyone knows: a random one is
// hashed and thrown away, so the credential endpoints can't be used on it.
async function unusablePasswordHash() {
  return bcrypt.hash(randomBytes(32).toString("hex"), 10);
}

async function main() {
  // ---------------------------------------------------------------
  // Staff accounts.
  // ---------------------------------------------------------------
  await prisma.user.upsert({
    where: { email: "admin@coreline.test" },
    update: {},
    create: {
      name: "Rahand",
      email: "admin@coreline.test",
      loginId: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "ADMIN",
    },
  });

  const zoneManager = await prisma.user.upsert({
    where: { email: OPEN_ACCESS_ACCOUNTS.REGIONAL_MANAGER.email },
    update: {},
    create: {
      name: OPEN_ACCESS_ACCOUNTS.REGIONAL_MANAGER.name,
      email: OPEN_ACCESS_ACCOUNTS.REGIONAL_MANAGER.email,
      passwordHash: await unusablePasswordHash(),
      role: "REGIONAL_MANAGER",
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: OPEN_ACCESS_ACCOUNTS.SUPERVISOR.email },
    update: {},
    create: {
      name: OPEN_ACCESS_ACCOUNTS.SUPERVISOR.name,
      email: OPEN_ACCESS_ACCOUNTS.SUPERVISOR.email,
      passwordHash: await unusablePasswordHash(),
      role: "SUPERVISOR",
    },
  });

  // ---------------------------------------------------------------
  // Zones 1 and 3 — no manager assigned yet (the Admin assigns one).
  // ---------------------------------------------------------------
  const zone1 = await prisma.zone.upsert({
    where: { number: 1 },
    update: {},
    create: { number: 1 },
  });
  const zone3 = await prisma.zone.upsert({
    where: { number: 3 },
    update: {},
    create: { number: 3 },
  });
  await findOrCreateMarket("Zhyan 1", zone1.id);
  await findOrCreateMarket("Dream City 1", zone3.id);
  await findOrCreateMarket("Empire 1", zone3.id, { status: "CLOSED" });

  // ---------------------------------------------------------------
  // Zone 2 — managed by the Zone Manager, 12 markets (spec: "Qushtapa 1,
  // Qushtapa 2, plus the other markets belonging to Zone 2"). Qushtapa 1
  // and 2 move here from Zone 1 (their existing employees/Supervisor/
  // Overlooking relationships are untouched — only the market's own
  // zoneId changes). The remaining 8 are placeholder names — the real
  // ones weren't given in the spec; rename them via Markets management
  // once known, the structure (12 markets under this zone) is what
  // matters for now.
  // ---------------------------------------------------------------
  const zone2 = await prisma.zone.upsert({
    where: { number: 2 },
    update: {},
    create: { number: 2, managerId: zoneManager.id },
  });

  // Move any existing "Qushtapa 1"/"Qushtapa 2" row OUT of zone 1 first
  // (they were originally seeded there — see the git history of this
  // file) — before findOrCreateMarket below looks for them by name
  // *within zone 2*, otherwise it would find nothing there yet and
  // create a second, duplicate market instead of relocating the real
  // one (with its existing employees/Supervisor/chat history intact).
  await prisma.market.updateMany({ where: { name: "Qushtapa 1", zoneId: zone1.id }, data: { zoneId: zone2.id } });
  await prisma.market.updateMany({ where: { name: "Qushtapa 2", zoneId: zone1.id }, data: { zoneId: zone2.id } });

  const qushtapa1 = await findOrCreateMarket("Qushtapa 1", zone2.id, { supervisorId: supervisor.id });
  const qushtapa2 = await findOrCreateMarket("Qushtapa 2", zone2.id);
  await findOrCreateMarket("Italyan 1", zone2.id);
  await findOrCreateMarket("Royal 1", zone2.id, { status: "MAINTENANCE" });
  for (let i = 5; i <= 12; i += 1) {
    await findOrCreateMarket(`Zone 2 Market ${i}`, zone2.id);
  }

  // ---------------------------------------------------------------
  // One Worker and one Cashier, both at Qushtapa 1 on the Morning shift.
  // ---------------------------------------------------------------
  const employee = await prisma.employee.upsert({
    where: { employeeCode: WORKER_USERNAME },
    update: {},
    create: {
      employeeCode: WORKER_USERNAME,
      name: "Worker",
      passwordHash: await bcrypt.hash(WORKER_PASSWORD, 10),
      position: "Worker",
      role: "WORKER",
      shift: "MORNING",
      employmentStatus: "ACTIVE",
      marketId: qushtapa1.id,
    },
  });

  await prisma.employee.upsert({
    where: { username: CASHIER_USERNAME },
    update: {},
    create: {
      employeeCode: CASHIER_USERNAME,
      username: CASHIER_USERNAME,
      name: "Cashier",
      passwordHash: await bcrypt.hash(CASHIER_PASSWORD, 10),
      position: "Cashier",
      role: "CASHIER",
      cashierShift: "MORNING",
      employmentStatus: "ACTIVE",
      marketId: qushtapa1.id,
    },
  });

  // A couple of sample tasks so /api/dashboard and /api/reports have
  // something to show immediately after seeding.
  const existingTasks = await prisma.task.count({ where: { employeeId: employee.id } });
  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          type: "REFILLING",
          label: "Refilling Update",
          department: "Snacks",
          status: "APPROVED",
          employeeId: employee.id,
          marketId: qushtapa1.id,
          reviewedById: supervisor.id,
          reviewedAt: new Date(),
        },
        {
          type: "SHELF_CLEANING",
          label: "Report Completed Cleaning",
          department: "Fresh",
          status: "PENDING",
          requiresPhoto: true,
          employeeId: employee.id,
          marketId: qushtapa1.id,
        },
      ],
    });
  }

  // ---------------------------------------------------------------
  // Demo dataset — the minimum real rows a live demonstration needs.
  //
  // Without these a freshly seeded database has no Products at all,
  // which means an employee literally cannot file an Expired/Wasted
  // item report (the flow requires picking a real Product), so the
  // Regional Manager and Admin Expired Items screens can never show
  // anything. Attendance and Activities are seeded for TODAY so the
  // dashboards read as a live operation rather than an empty shell.
  //
  // Every block below is idempotent: re-running the seed updates or
  // skips, it never duplicates.
  // ---------------------------------------------------------------
  const demoProducts = [
    { barcode: "6291041500213", name: "Almarai Milk 1L", stockQuantity: 40, price: 1.75, marketId: qushtapa1.id, createdById: supervisor.id },
    { barcode: "5449000000996", name: "Coca-Cola 330ml", stockQuantity: 120, price: 0.75, marketId: qushtapa1.id, createdById: supervisor.id },
    { barcode: "7622210951965", name: "Puck Cheese 500g", stockQuantity: 25, price: 3.2, marketId: qushtapa1.id, createdById: supervisor.id },
    { barcode: "8000500310427", name: "Nescafe Gold 100g", stockQuantity: 30, price: 6.5, marketId: qushtapa2.id, createdById: supervisor.id },
    { barcode: "5000112637922", name: "Lays Classic 150g", stockQuantity: 60, price: 1.1, marketId: qushtapa2.id, createdById: supervisor.id },
  ];
  for (const product of demoProducts) {
    // Product.barcode is not unique in the schema (the same barcode can
    // legitimately exist in two markets), so this is keyed on the real
    // pair that identifies one shelf item: barcode + market.
    const existing = await prisma.product.findFirst({
      where: { barcode: product.barcode, marketId: product.marketId },
      select: { id: true },
    });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { name: product.name, price: product.price } });
    } else {
      await prisma.product.create({ data: product });
    }
  }

  // Today's attendance for Qushtapa 1, so the attendance dashboards and
  // the "Active Now" counts are not a wall of zeros during a demo.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q1Employees = await prisma.employee.findMany({
    where: { marketId: qushtapa1.id },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  for (const [index, e] of q1Employees.entries()) {
    // A deliberately mixed picture: most on shift, one on a break, one
    // already checked out — the three states the UI distinguishes.
    const checkIn = new Date(today);
    checkIn.setHours(8, index % 3 === 0 ? 5 : 0, 0, 0);
    const onBreak = index === 1;
    const checkedOut = index === 2;
    const checkOut = checkedOut ? new Date(today.getTime() + 16 * 60 * 60 * 1000) : null;
    if (checkedOut) checkOut.setHours(16, 0, 0, 0);

    await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: e.id, date: today } },
      update: {},
      create: {
        employeeId: e.id,
        marketId: qushtapa1.id,
        date: today,
        status: index % 3 === 0 ? "LATE" : "PRESENT",
        checkIn,
        checkOut,
        breakStart: onBreak ? new Date(today.getTime() + 13 * 60 * 60 * 1000) : null,
        requiredHours: 8,
        source: "MANUAL",
      },
    });
  }

  // A few of today's activities, in a mix of review states so the
  // Task Completion figure is a real percentage rather than 0 or 100.
  const activitiesToday = await prisma.activity.count({
    where: { employeeId: employee.id, date: { gte: today } },
  });
  if (activitiesToday === 0) {
    await prisma.activity.createMany({
      data: [
        { category: "SHELF_CLEANING", date: new Date(), time: "9:15 AM", status: "APPROVED", employeeId: employee.id },
        { category: "REFILLING", date: new Date(), time: "10:40 AM", status: "APPROVED", employeeId: employee.id },
        { category: "LABEL_CHECKING", date: new Date(), time: "12:05 PM", status: "PENDING", employeeId: employee.id },
        { category: "DAILY_CLEANING", date: new Date(), time: "1:30 PM", status: "REJECTED", employeeId: employee.id },
      ],
    });
  }

  // Koch Operation product catalog — real DB rows the Cashier flow reads
  // from (spec: "must come from backend/database data", never hardcoded
  // in the frontend). Idempotent: only seeded the first time, same
  // "check before creating" convention as the rest of this file.
  const kochProductCount = await prisma.kochProduct.count();
  if (kochProductCount === 0) {
    await prisma.kochProduct.createMany({
      data: [
        { name: "Code T", variant: "Original", size: "900g" },
        { name: "Code T", variant: "Original", size: "400g" },
        { name: "Code T", variant: "Whole Wheat", size: "600g" },
        { name: "Code B", variant: "Classic", size: "500g" },
        { name: "Code B", variant: "Classic", size: "250g" },
      ],
    });
  }

  console.log("Seed complete. Accounts:");
  console.log(`  Admin:         username "${ADMIN_USERNAME}" + password`);
  console.log("  Supervisor:    no credentials — tap the role on the login screen");
  console.log("  Zone Manager:  no credentials — tap the role on the login screen");
  console.log(`  Worker:        ${WORKER_USERNAME} / ${WORKER_PASSWORD} (Qushtapa 1, Morning)`);
  console.log(`  Cashier:       ${CASHIER_USERNAME} / ${CASHIER_PASSWORD} (Qushtapa 1, Morning)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
