import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Crown, User, AlertCircle } from "lucide-react";
import CinematicBackground from "./CinematicBackground";
import CredentialField from "./CredentialField";
import PasswordField from "./PasswordField";
import PrimaryLoginButton from "./PrimaryLoginButton";
import { staffLogin, staffIdLogin } from "../../services/authService";
import { ApiError } from "../../services/apiClient";
import { adminSession } from "../../utils/staffSession";
import LanguagePreLoginToggle from "./LanguagePreLoginToggle";
import { BrandTile } from "../common/CorelineMark";

// StaffLoginScreen.jsx — the Admin sign-in: a username and a password.
// The username is the Admin account's User ID (loginId) and goes through
// POST /api/auth/staff-id-login; anything containing an "@" is treated as
// an email and goes through POST /api/auth/login instead, so an Admin
// that was created with an email and no username can still get in.
//
// Supervisor and Regional (Zone) Manager no longer come through here —
// they sign in with no credentials at all (see OpenAccessScreen.jsx).
export default function StaffLoginScreen({ onBack, onLogin }) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const id = identifier.trim();
    if (!id || !password) {
      setError(t("auth.missingCredentials", { field: t("auth.username") }));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const user = id.includes("@") ? await staffLogin(id, password) : await staffIdLogin(id, password);
      if (user.role !== "ADMIN") {
        setError(t("auth.errNotAdminAccount"));
        setSubmitting(false);
        return;
      }
      onLogin(adminSession(user));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.errConnection"));
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

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
          <div className="w-full animate-fade-up">
            <div className="text-center mb-6">
              <span className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#F47A20]/12 grid place-items-center shadow-[0_0_20px_-4px_rgba(244,122,32,0.6)]">
                <Crown size={24} className="text-[#F47A20]" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F9A03C]">{t("auth.adminAccess")}</p>
              <h1 className="mt-1 font-display text-2xl font-extrabold text-white">{t("auth.adminLogin")}</h1>
              <p className="mt-2 text-[13px] text-[#9AA1B4] leading-snug">{t("auth.adminLoginLead")}</p>
            </div>

            <div className="card-premium rounded-[22px] p-5 sm:p-6 bg-[#0D1223]/85 border border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <CredentialField
                  icon={User}
                  label={t("auth.username")}
                  value={identifier}
                  onChange={setIdentifier}
                  placeholder={t("auth.usernamePlaceholder")}
                  type="text"
                  error={!!error}
                  autoFocus
                />
                <PasswordField value={password} onChange={setPassword} error={!!error} />

                {error && (
                  <p className="flex items-center gap-1.5 text-[12.5px] text-red-400">
                    <AlertCircle size={13} className="shrink-0" /> {error}
                  </p>
                )}

                <div className="pt-1">
                  <PrimaryLoginButton submitting={submitting} />
                </div>
              </form>
            </div>
          </div>
        </div>

        <p className="pb-2 text-[11.5px] text-[#5C6479] text-center">{t("auth.adminTagline")}</p>
      </div>
    </div>
  );
}
