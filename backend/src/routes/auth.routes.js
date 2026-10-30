import { Router } from "express";
import { register, listStaffAccounts, staffLogin, staffIdLogin, openLogin, employeeLogin, cashierLogin } from "../controllers/authController.js";
import { requireAuth, requireStaffRole } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  validateBody,
  validateQuery,
  staffRegisterSchema,
  staffLoginSchema,
  staffIdLoginSchema,
  openLoginSchema,
  employeeLoginSchema,
  cashierLoginSchema,
  listStaffAccountsQuerySchema,
} from "../utils/validate.js";

const router = Router();

// Only an existing Admin can create new staff accounts — this is an
// internal management tool, not public sign-up.
router.post(
  "/register",
  requireAuth,
  requireStaffRole("ADMIN"),
  validateBody(staffRegisterSchema),
  register
);

// ADMIN-only staff directory — see listStaffAccounts's own doc comment.
router.get(
  "/staff",
  requireAuth,
  requireStaffRole("ADMIN"),
  validateQuery(listStaffAccountsQuerySchema),
  listStaffAccounts
);

// authLimiter — these two are the actual brute-force attack surface
// (guessing a password/employee code), so they get the tight limit.
router.post("/login", authLimiter, validateBody(staffLoginSchema), staffLogin);
router.post("/staff-id-login", authLimiter, validateBody(staffIdLoginSchema), staffIdLogin);
// No credentials — Supervisor / Zone Manager only; see utils/openAccess.js.
// Not on authLimiter: there is nothing to brute-force (no secret is
// checked), and a whole market's staff sharing one Wi-Fi/IP would burn
// through that tight budget just by tapping their role.
router.post("/open-login", validateBody(openLoginSchema), openLogin);
router.post("/employee-login", authLimiter, validateBody(employeeLoginSchema), employeeLogin);
router.post("/cashier-login", authLimiter, validateBody(cashierLoginSchema), cashierLogin);

export default router;
