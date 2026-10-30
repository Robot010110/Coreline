import { listMarkets } from "../services/marketService";
import { initialsOf } from "./initials";

// staffSession.js — builds the front-end `session` object (what
// App.jsx's handleLogin takes) from the user the backend returned at
// sign-in. Shared by the Admin credential screen and the no-credentials
// Supervisor / Zone Manager screen so both produce identical sessions —
// and identical to what App.jsx rebuilds from GET /api/profile on a
// page refresh.

export async function supervisorSession(user) {
  let marketName = null;
  try {
    const [market] = await listMarkets();
    marketName = market?.name ?? null;
  } catch {
    // Non-fatal — the workspace still works without a market display name.
  }
  const isOverlooking = user.role === "OVERLOOKING_SUPERVISOR";
  return {
    role: "supervisor",
    staffRole: user.role,
    staffId: user.id,
    loginId: user.loginId,
    marketId: user.marketId,
    zoneId: user.zoneId,
    marketName,
    shift: isOverlooking ? "NIGHT" : "MORNING",
    // A translation KEY, not display text — see App.jsx's matching
    // session-restore branch for why.
    titleKey: isOverlooking ? "roles.overlooking" : "roles.supervisor",
    displayName: user.name,
    initials: initialsOf(user.name),
  };
}

export function regionalManagerSession(user) {
  return {
    role: "regionalManager",
    staffId: user.id,
    zoneIds: user.zoneIds,
    displayName: user.name,
    initials: initialsOf(user.name),
  };
}

export function adminSession(user) {
  return { role: "admin", staffId: user.id, displayName: user.name, initials: initialsOf(user.name) };
}
