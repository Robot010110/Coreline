// openAccess.js — the "no credentials" sign-in for the Supervisor and
// Zone Manager (Regional Manager) roles.
//
// For now the app ships with exactly one Supervisor and one Zone Manager,
// and tapping either role on the login screen signs straight in as that
// account (POST /api/auth/open-login) — no User ID, no password. Admin is
// deliberately NOT in this list and can never be reached this way; Worker
// and Cashier keep their normal code/username + password sign-in.
//
// The two accounts are identified by fixed emails so the endpoint and
// prisma/seed.js agree on which rows they are. Both are created with a
// random, unknown password, so the ordinary credential endpoints can't be
// used to get into them either.
//
// OPEN_ROLE_LOGIN=false switches the whole thing off (the endpoint then
// answers 403) — use that the moment real Supervisors/Zone Managers with
// their own credentials exist and the shortcut is no longer wanted.
export const OPEN_ACCESS_ACCOUNTS = {
  SUPERVISOR: { email: "supervisor@coreline.test", name: "Supervisor" },
  REGIONAL_MANAGER: { email: "zone.manager@coreline.test", name: "Zone Manager" },
};

export function openRoleLoginEnabled() {
  return String(process.env.OPEN_ROLE_LOGIN ?? "true").toLowerCase() !== "false";
}
