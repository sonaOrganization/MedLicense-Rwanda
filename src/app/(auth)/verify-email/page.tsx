"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const sent = params.get("sent");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("pending");

  useEffect(() => {
    if (!token) return;
    setStatus("loading");
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((r) => r.json())
      .then((d) => setStatus(d.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (sent && !token) {
    return (
      <div className="text-center">
        <div className="inline-flex p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify your email</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          We sent a verification link to your email. Check your inbox and click the link to activate your account.
        </p>
        <Link href="/login">
          <Button variant="outline">Go to Sign In</Button>
        </Link>
      </div>
    );
  }

  if (status === "loading") return (
    <div className="text-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Verifying your email...</p>
    </div>
  );

  if (status === "success") return (
    <div className="text-center">
      <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
        <CheckCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email verified!</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Your account is now active. You can sign in.</p>
      <Link href="/login"><Button>Sign In Now</Button></Link>
    </div>
  );

  if (status === "error") return (
    <div className="text-center">
      <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
        <XCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verification failed</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">The link is invalid or expired. Please register again.</p>
      <Link href="/register"><Button variant="outline">Register Again</Button></Link>
    </div>
  );

  return null;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
