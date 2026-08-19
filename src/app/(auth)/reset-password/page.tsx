"use client";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: search.get("email"), token: search.get("token"), password, confirmPassword }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Could not reset password"); setLoading(false); return; }
    router.push("/login?reset=success");
  }

  return <div className="w-full max-w-md space-y-6">
    <div><h1 className="text-2xl font-bold">Reset password</h1><p className="text-sm text-gray-500">Choose a new password for your account.</p></div>
    <form onSubmit={submit} className="space-y-4">
      <Input type="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Input type="password" label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">Reset password</Button>
    </form>
  </div>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<p className="text-sm text-gray-500">Loading password reset…</p>}>
    <ResetPasswordForm />
  </Suspense>;
}
