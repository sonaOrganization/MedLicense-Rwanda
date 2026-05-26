"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentButtonsProps {
  planId: string;
  amount: number;
  currency: string;
}

export function PaymentButtons({ planId, amount, currency }: PaymentButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function initiatePayment(provider: string) {
    setLoading(provider);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else toast.success("Payment initiated. Check your phone for the prompt.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 gap-2"
        loading={loading === "momo"}
        onClick={() => initiatePayment("momo")}
      >
        <Smartphone className="w-4 h-4" />
        Pay with Mobile Money
      </Button>
      <Button
        variant="outline"
        className="w-full gap-2"
        loading={loading === "card"}
        onClick={() => initiatePayment("card")}
      >
        <CreditCard className="w-4 h-4" />
        Pay with Card
      </Button>
      <Button
        variant="ghost"
        className="w-full text-indigo-600 dark:text-indigo-400 gap-2"
        loading={loading === "afripay"}
        onClick={() => initiatePayment("afripay")}
      >
        Pay with Afripay
      </Button>
    </div>
  );
}
