"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface PaymentButtonsProps {
  planId:   string;
  amount:   number;
  currency: string;
}

export function PaymentButtons({ planId, amount, currency }: PaymentButtonsProps) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Build and submit an HTML form to AfriPay checkout
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;

      Object.entries(data.fields as Record<string, string>).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type  = "hidden";
        input.name  = name;
        input.value = String(value ?? "");
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      // keep loading=true — user is being redirected to AfriPay
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
      loading={loading}
      onClick={pay}
    >
      Pay {amount.toLocaleString()} {currency} with Afripay
    </Button>
  );
}
