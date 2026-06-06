"use client";
import { useState } from "react";
import { MessageSquare, X, Star, Send, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "general",      label: "General" },
  { value: "exam_content", label: "Exam Content" },
  { value: "ui_ux",        label: "UI / UX" },
  { value: "subscription", label: "Subscription" },
  { value: "bug_report",   label: "Bug Report" },
];

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const STAR_COLORS: Record<number, string> = {
  1: "text-red-400 fill-red-400",
  2: "text-orange-400 fill-orange-400",
  3: "text-amber-400 fill-amber-400",
  4: "text-lime-400 fill-lime-400",
  5: "text-emerald-400 fill-emerald-400",
};

export function FeedbackWidget() {
  const [open,      setOpen]      = useState(false);
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [category,  setCategory]  = useState("general");
  const [message,   setMessage]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,      setDone]      = useState(false);

  const active = hovered || rating;

  async function handleSubmit() {
    if (!rating) return toast.error("Please select a rating");
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, category, message }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDone(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset after close animation
    setTimeout(() => { setRating(0); setHovered(0); setCategory("general"); setMessage(""); setDone(false); }, 300);
  }

  return (
    <>
      {/* Trigger button — sits above sign-out in sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full px-3 py-3 md:py-2.5 rounded-xl text-[14px] md:text-[13.5px] font-medium text-gray-500 hover:bg-indigo-950/40 hover:text-indigo-400 transition-all duration-150"
      >
        <MessageSquare className="w-[18px] h-[18px]" />
        Give Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">Share your feedback</h2>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              /* Success state */
              <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Thank you!</h3>
                <p className="text-sm text-gray-500">Your feedback helps us improve MedLicense for everyone.</p>
                <button onClick={handleClose} className="mt-2 px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-5">

                {/* Star rating */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">How would you rate your experience?</p>
                  <div className="flex items-center justify-center gap-2">
                    {[1,2,3,4,5].map((n) => (
                      <button
                        key={n}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star className={cn(
                          "w-8 h-8 transition-all",
                          n <= active
                            ? (STAR_COLORS[active] ?? "text-amber-400 fill-amber-400")
                            : "text-gray-300 dark:text-gray-600"
                        )} />
                      </button>
                    ))}
                  </div>
                  {active > 0 && (
                    <p className={cn("text-center text-xs font-semibold mt-1.5", {
                      "text-red-400":     active === 1,
                      "text-orange-400":  active === 2,
                      "text-amber-400":   active === 3,
                      "text-lime-400":    active === 4,
                      "text-emerald-400": active === 5,
                    })}>
                      {RATING_LABELS[active]}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setCategory(value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          category === value
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Your suggestion <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Tell us what you think or suggest an improvement…"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <p className="text-[10px] text-gray-400 text-right mt-0.5">{message.length}/500</p>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !rating}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending…" : "Submit Feedback"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
