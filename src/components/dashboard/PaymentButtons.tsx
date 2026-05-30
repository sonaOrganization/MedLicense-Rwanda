"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface PaymentButtonsProps {
  planId: string;
  amount: number;
  currency: string;
}

export function PaymentButtons({ planId, amount, currency }: PaymentButtonsProps) {
  const [loading, setLoading] = useState(false);

  async function initiatePayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, provider: "afripay" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
      loading={loading}
      onClick={initiatePayment}
    >
      Pay {amount.toLocaleString()} {currency} with Afripay
    </Button>
  );
}
