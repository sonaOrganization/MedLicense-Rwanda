"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export function PaymentSuccessBanner() {
  const router = useRouter();
  const [state, setState] = useState<"activating" | "active" | "failed">("activating");

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 12; // poll for up to 60 seconds

    async function tryActivate() {
      try {
        // First try to activate immediately (fallback in case webhook hasn't fired)
        const res = await fetch("/api/payments/activate", { method: "POST" });
        const data = await res.json();

        if (data.activated || data.alreadyActive) {
          setState("active");
          // Reload the page after a short delay to show updated subscription
          setTimeout(() => router.refresh(), 1500);
          return;
        }
      } catch {
        // ignore, will poll
      }

      // Poll every 5 seconds waiting for webhook to fire
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch("/api/payments/activate");
          const data = await res.json();
          if (data.isActive) {
            clearInterval(interval);
            setState("active");
            setTimeout(() => router.refresh(), 1500);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            setState("failed");
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            setState("failed");
          }
        }
      }, 5000);

      return () => clearInterval(interval);
    }

    tryActivate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "active") {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Payment confirmed — subscription activated!</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">All premium exams are now unlocked. Reloading…</p>
        </div>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <Loader2 className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Payment received — activation in progress</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Your payment was received. If your subscription doesn&apos;t activate within a few minutes,{" "}
            <button onClick={() => router.refresh()} className="underline font-medium">refresh this page</button>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
      <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 animate-spin" />
      <div>
        <p className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm">Activating your subscription…</p>
        <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">Confirming payment with AfriPay, please wait.</p>
      </div>
    </div>
  );
}
