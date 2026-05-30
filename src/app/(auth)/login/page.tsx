"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      toast.error(res.error === "Account suspended" ? "Your account has been suspended. Please contact support." : "Invalid email or password.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Sign in to your account to continue</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register("email")}
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          leftIcon={<Mail className="w-4 h-4" />}
        />
        <Input
          {...register("password")}
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="Enter your password"
          error={errors.password?.message}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPass(!showPass)} className="hover:text-gray-600 dark:hover:text-gray-200">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don't have an account?{" "}
        <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
          Create one free
        </Link>
      </p>
    </div>
  );
}
