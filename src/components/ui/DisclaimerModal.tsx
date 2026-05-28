"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export function DisclaimerModal() {
  const [status, setStatus] = useState<"pending" | "accepted" | "declined" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("medlicense_disclaimer_v1");
    setStatus(saved === "true" ? "accepted" : "pending");
  }, []);

  // null = hydrating (prevent flash), accepted = already agreed
  if (status === null || status === "accepted") return null;

  function accept() {
    localStorage.setItem("medlicense_disclaimer_v1", "true");
    setStatus("accepted");
  }

  if (status === "declined") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            You must agree to the disclaimer to access MedLicense.
          </p>
          <button
            onClick={() => setStatus("pending")}
            className="w-full px-5 py-2.5 rounded-lg border border-indigo-500 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
          >
            Review Disclaimer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Welcome to MedLicense</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Please read before continuing</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            This website is intended for{" "}
            <strong className="text-gray-900 dark:text-white">
              medical study, revision, and practice
            </strong>{" "}
            using different medical questions and real-life scenarios.
          </p>

          <div className="flex gap-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 px-4 py-3.5">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
              It is <strong>not a simulation, replacement, or imitation</strong> of the official
              government website used for licensing examinations.
            </p>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            By clicking <strong>Continue</strong>, you acknowledge that you have read and understood
            this notice.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => setStatus("declined")}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            I Don&apos;t Agree
          </button>
          <button
            onClick={accept}
            className="flex-2 flex-grow px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-md shadow-indigo-200 dark:shadow-none transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
