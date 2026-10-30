import { useEffect, useRef, useState } from "react";
import { BrandTile } from "../common/CorelineMark";

// CorelineSplash.jsx — the one-time Coreline brand reveal shown before
// the existing "Who's logging in?" experience (see App.jsx: rendered
// first, unconditionally, on every fresh mount of the app — logging out
// and returning to /login within the same tab does NOT remount <App>, so
// it never replays there; only an actual fresh page load does). Purely
// presentational: it owns no auth/session state and takes only
// `onComplete`, which App.jsx uses to swap over to the real login flow.
//
// The reveal is built from the brand assets themselves rather than a
// video: the cream app-icon tile with the Coreline mark settles into
// place, a single light sweep crosses it, then the CORELINE wordmark and
// subtitle rise in underneath. Everything is CSS (see the
// "CorelineSplash.jsx" block in index.css), so there is nothing to
// download and nothing that can fail to decode.
//
// One guarantee this file must never lose: the exit timers always fire
// onComplete — a splash must never block login. Under
// prefers-reduced-motion the animations are skipped (index.css) and the
// static lockup is shown for a shorter hold instead.
const HOLD_MS = 2400;
const FADE_OUT_MS = 600;

const REDUCED_HOLD_MS = 1500;
const REDUCED_FADE_MS = 400;

// Matches the app's own near-black field so the hand-off to the login
// screen has no visible seam.
const SPLASH_BG = "#05080F";

export default function CorelineSplash({ onComplete }) {
  const [fadingOut, setFadingOut] = useState(false);
  const reduceMotionRef = useRef(
    typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  );
  const doneRef = useRef(false);

  useEffect(() => {
    const reduce = reduceMotionRef.current;
    const hold = reduce ? REDUCED_HOLD_MS : HOLD_MS;
    const fade = reduce ? REDUCED_FADE_MS : FADE_OUT_MS;
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onComplete?.();
    };
    const timers = [
      setTimeout(() => setFadingOut(true), hold),
      setTimeout(finish, hold + fade),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reduceMotion = reduceMotionRef.current;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center transition-opacity ease-out"
      style={{
        backgroundColor: SPLASH_BG,
        opacity: fadingOut ? 0 : 1,
        transitionDuration: `${reduceMotion ? REDUCED_FADE_MS : FADE_OUT_MS}ms`,
      }}
      role="status"
      aria-label="Loading Coreline"
    >
      {/* Soft warm bloom behind the tile — the app's orange accent, kept
          faint so the cream/black mark stays the focus. */}
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-[62%] rounded-full bg-[#F47A20]/10 blur-3xl animate-coreline-bloom"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center px-6">
        <div className="relative animate-coreline-mark-in">
          <BrandTile
            className="h-[104px] w-[104px] sm:h-[124px] sm:w-[124px] rounded-[26px] sm:rounded-[30px] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8),0_0_40px_-8px_rgba(244,122,32,0.35)] overflow-hidden"
          />
          {/* Single light sweep across the tile. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px] sm:rounded-[30px]" aria-hidden="true">
            <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-coreline-sweep" />
          </div>
        </div>

        <h1
          className="mt-7 font-display font-extrabold text-white animate-coreline-rise"
          style={{ fontSize: "clamp(34px, 8vw, 52px)", letterSpacing: "0.08em", animationDelay: "650ms" }}
        >
          CORE<span className="text-[#F47A20]">LINE</span>
        </h1>
        <p
          className="mt-2 text-[11px] sm:text-[12px] uppercase tracking-[0.32em] text-[#8B93A8] animate-coreline-rise"
          style={{ animationDelay: "900ms" }}
        >
          Market Management
        </p>
      </div>
    </div>
  );
}
