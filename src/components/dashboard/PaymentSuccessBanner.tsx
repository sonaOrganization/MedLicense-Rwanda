"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Clock } from "lucide-react";

export function PaymentSuccessBanner() {
  const router = useRouter();
  const [state, setState] = useState<"waiting" | "active" | "timeout">("waiting");

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 24; // poll every 5s for up to 2 minutes

    const interval = setInterval(async () => {
      attempts++;
      try {
        // Only reads DB — never activates anything itself
        const res = await fetch("/api/payments/activate");
        const data = await res.json();

        if (data.isActive) {
          clearInterval(interval);
          setState("active");
          // Reload the page to show unlocked premium exams
          setTimeout(() => router.refresh(), 1200);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setState("timeout");
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setState("timeout");
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "active") {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
            Payment approved — subscription activated!
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            All premium exams are now unlocked. Reloading…
          </p>
        </div>
      </div>
    );
  }

  if (state === "timeout") {
    return (
      <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
            Payment received — confirmation still processing
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            AfriPay is confirming your payment. Please{" "}
            <button onClick={() => router.refresh()} className="underline font-medium">
              refresh this page
            </button>{" "}
            in a moment to check your subscription status.
          </p>
        </div>
      </div>
    );
  }

  // waiting state — polling in background
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
      <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 animate-spin" />
      <div>
        <p className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm">
          Waiting for AfriPay payment confirmation…
        </p>
        <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">
          Your subscription will activate automatically once AfriPay confirms the payment.
        </p>
      </div>
    </div>
  );
}
