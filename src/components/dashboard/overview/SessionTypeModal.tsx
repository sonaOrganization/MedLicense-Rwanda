"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { BookOpen, Stethoscope, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";
import { cn } from "@/lib/utils";

const CHOICE_KEY = "medlicense_session_choice_v1";
const DISMISS_KEY = "medlicense_session_modal_dismissed_v1";
const DAILY_KEY = "medlicense_session_daily_v1";
export const PENDING_INTENT_KEY = "medlicense_pending_session_intent_v1";
export const SESSION_MODAL_REOPEN_EVENT = "medlicense:reopen-session-modal";
const SESSION_CHOICE_CHANGED_EVENT = "medlicense:session-choice-changed";

export type SessionChoice = "theory" | "practical" | null;

export function getSessionChoice(): SessionChoice {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(CHOICE_KEY) as SessionChoice) ?? null;
}

/** Destination page for a given session type — each type gets its own page. */
export function sessionDestination(type: "theory" | "practical"): string {
  return type === "theory" ? "/exams" : "/practical";
}

export function openSessionTypeModal() {
  window.dispatchEvent(new Event(SESSION_MODAL_REOPEN_EVENT));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function SessionTypeModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const { language } = useLanguage();
  const T = useT(language);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      // Already signed in — only ask once inside the dashboard, and only once per day.
      if (pathname !== "/dashboard") return;
      const raw = localStorage.getItem(DAILY_KEY);
      const daily = raw ? (JSON.parse(raw) as { date: string }) : null;
      if (!daily || daily.date !== todayStr()) setOpen(true);
    } else {
      // First-time / logged-out visitor — ask once, anywhere on the site.
      const saved = localStorage.getItem(CHOICE_KEY);
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (!saved && !dismissed) setOpen(true);
    }

    const reopen = () => setOpen(true);
    window.addEventListener(SESSION_MODAL_REOPEN_EVENT, reopen);
    return () => window.removeEventListener(SESSION_MODAL_REOPEN_EVENT, reopen);
  }, [status, pathname]);

  function choose(type: "theory" | "practical") {
    setOpen(false);
    localStorage.setItem(CHOICE_KEY, type);
    window.dispatchEvent(new Event(SESSION_CHOICE_CHANGED_EVENT));

    if (status === "authenticated") {
      localStorage.setItem(DAILY_KEY, JSON.stringify({ date: todayStr() }));
      if (type === "practical") toast.success(T("session_practical_toast"));
      router.push(sessionDestination(type));
    } else {
      // Not signed in yet — remember their intent and send them to create an account first.
      localStorage.setItem(PENDING_INTENT_KEY, type);
      toast.success(T("session_signup_toast"));
      router.push("/register");
    }
  }

  function dismiss() {
    if (status === "authenticated") {
      localStorage.setItem(DAILY_KEY, JSON.stringify({ date: todayStr() }));
    } else {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 px-6 py-6">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white leading-tight">{T("session_modal_title")}</h2>
          <p className="text-indigo-200 text-sm mt-1">{T("session_modal_subtitle")}</p>
        </div>

        {/* Options */}
        <div className="p-6 grid sm:grid-cols-2 gap-3">
          <button
            disabled
            aria-disabled="true"
            title={T("session_theory_badge")}
            className="text-left rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/20 p-4 opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {T("session_theory_badge")}
              </span>
            </div>
            <p className="font-semibold text-gray-500 dark:text-gray-400 text-sm mb-1">{T("session_theory_title")}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{T("session_theory_desc")}</p>
          </button>

          <button
            onClick={() => choose("practical")}
            className="group text-left rounded-xl border-2 border-amber-300 dark:border-amber-700 hover:border-amber-500 dark:hover:border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 p-4 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                {T("session_practical_badge")}
              </span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{T("session_practical_title")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{T("session_practical_desc")}</p>
          </button>
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">{T("session_modal_footer")}</p>
          <button
            onClick={dismiss}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 ml-3"
          >
            {T("session_modal_later")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tracks the user's current Theory/Practical session choice, updating live as it changes. */
export function useSessionChoice(): SessionChoice {
  const [choice, setChoice] = useState<SessionChoice>(null);

  useEffect(() => {
    setChoice(getSessionChoice());
    const refresh = () => setChoice(getSessionChoice());
    window.addEventListener("storage", refresh);
    window.addEventListener(SESSION_CHOICE_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(SESSION_CHOICE_CHANGED_EVENT, refresh);
    };
  }, []);

  return choice;
}

export function SessionChoicePill({ className }: { className?: string }) {
  const choice = useSessionChoice();
  const { language } = useLanguage();
  const T = useT(language);

  if (!choice) return null;

  return (
    <div className={cn("inline-flex items-center gap-2 text-xs", className)}>
      <span className="text-gray-500 dark:text-gray-400 font-medium">
        {choice === "theory" ? T("session_current_theory") : T("session_current_practical")}
      </span>
      <button
        onClick={openSessionTypeModal}
        className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
      >
        {T("session_change")}
      </button>
    </div>
  );
}
