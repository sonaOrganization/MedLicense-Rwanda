"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { formatPrice, type Plan } from "@/lib/plans";

interface PaymentButtonsProps {
  plan: Plan;
}

export function PaymentButtons({ plan }: PaymentButtonsProps) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to the hosted checkout without exposing provider credentials.
      window.location.assign(data.checkoutUrl);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button
      size="lg"
      className={
        plan.highlighted
          ? "w-full bg-teal-400 text-slate-950 shadow-lg shadow-teal-950/30 hover:bg-teal-300"
          : "w-full bg-teal-700 text-white hover:bg-teal-800"
      }
      loading={loading}
      onClick={pay}
    >
      Pay {formatPrice(plan)}
    </Button>
  );
}
