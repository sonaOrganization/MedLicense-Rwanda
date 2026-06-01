"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function ActivatePaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activate() {
    if (!confirm("Manually activate this payment and grant the user a subscription?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.note ?? "Subscription activated successfully");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to activate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={activate}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
    >
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : <CheckCircle className="w-3 h-3" />}
      Activate
    </button>
  );
}
