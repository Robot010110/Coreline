import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, AlertCircle, Loader2, ClipboardList, ShieldCheck } from "lucide-react";
import CinematicBackground from "./CinematicBackground";
import LanguagePreLoginToggle from "./LanguagePreLoginToggle";
import { openLogin } from "../../services/authService";
import { ApiError } from "../../services/apiClient";
import { supervisorSession, regionalManagerSession } from "../../utils/staffSession";
import { BrandTile } from "../common/CorelineMark";

// The two roles that sign in without credentials, keyed by the role-picker
// key LoginPage.jsx hands over. See backend/src/utils/openAccess.js.
const OPEN_ROLES = {
  supervisor: { backendRole: "SUPERVISOR", labelKey: "roles.supervisor", icon: ClipboardList, build: supervisorSession },
  regionalManager: { backendRole: "REGIONAL_MANAGER", labelKey: "roles.regionalManager", icon: ShieldCheck, build: regionalManagerSession },
};

// OpenAccessScreen.jsx — what tapping Supervisor or Regional Manager
// (Zone Manager) shows: no form, no User ID, no password. It signs in
// the moment it mounts and hands the session to `onLogin`; if that fails
// (offline, or the server has the shortcut switched off) it says so and
// offers Retry / Back instead of leaving a spinner up forever.
export default function OpenAccessScreen({ roleKey, onBack, onLogin }) {
  const { t } = useTranslation();
  const role = OPEN_ROLES[roleKey];
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  // React 18 StrictMode runs effects twice in dev — without this guard the
  // sign-in (and its session hand-off) would fire twice.
  const startedFor = useRef(-1);

  useEffect(() => {
    if (startedFor.current === attempt) return;
    startedFor.current = attempt;
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const user = await openLogin(role.backendRole);
        const session = await role.build(user);
        if (!cancelled) onLogin(session);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("auth.errConnection"));
      }
    })();
    return () => {
      cancelled = true;
      // StrictMode's simulated unmount must not cancel the one real request.
      startedFor.current = -1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const Icon = role.icon;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CinematicBackground variant="aisles" />

      <div className="relative min-h-screen flex flex-col items-center px-5 py-6">
        <div className="w-full max-w-sm flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("auth.backToRoleSelection")}
            className="w-10 h-10 grid place-items-center rounded-full bg-white/[0.06] border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={17} className="rtl-flip" />
          </button>
          <div className="flex items-center gap-2">
            <BrandTile className="h-8 w-8 rounded-lg shadow-[0_0_12px_-2px_rgba(244,122,32,0.5)]" />
            <p className="font-display font-bold text-white text-[13px] tracking-wide">
              CORE<span className="text-[#F47A20]">LINE</span>
            </p>
          </div>
          <LanguagePreLoginToggle />
        </div>

        <div className="flex-1 flex items-center w-full max-w-sm">
          <div className="w-full text-center animate-fade-up" role="status" aria-live="polite">
            <span className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#F47A20]/12 grid place-items-center shadow-[0_0_20px_-4px_rgba(244,122,32,0.6)]">
              <Icon size={24} className="text-[#F47A20]" />
            </span>
            <h1 className="font-display text-2xl font-extrabold text-white">{t(role.labelKey)}</h1>

            {error ? (
              <div className="mt-5 space-y-4">
                <p className="flex items-center justify-center gap-1.5 text-[13px] text-red-400">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </p>
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="w-full rounded-xl bg-[#F47A20] py-3.5 text-[15px] font-semibold text-white hover:bg-[#ff8b36] active:scale-[0.99] transition-all"
                >
                  {t("auth.tryAgain")}
                </button>
              </div>
            ) : (
              <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-[#9AA1B4]">
                <Loader2 size={15} className="animate-spin text-[#F47A20]" /> {t("auth.enteringWorkspace")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
