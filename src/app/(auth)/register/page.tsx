"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { LICENSE_CATEGORIES, LICENSE_CATEGORY_GROUPS } from "@/lib/license-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Lock, Eye, EyeOff, Phone, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router    = useRouter();
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const selectedCategory = watch("licenseCategory");

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error || "Registration failed");
    } else {
      toast.success("Account created! You can now sign in.");
      router.push("/login");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create your account</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Start preparing for your medical licensing exam today</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Full name */}
        <Input
          {...register("name")}
          label="Full Name"
          placeholder="Enter your full name"
          error={errors.name?.message}
          leftIcon={<User className="w-4 h-4" />}
        />

        {/* Email */}
        <Input
          {...register("email")}
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        {/* Phone number */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <div className="flex">
            {/* Country code pill */}
            <span className="inline-flex items-center gap-1.5 px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-medium flex-shrink-0 select-none">
              🇷🇼 +250
            </span>
            <input
              {...register("phone")}
              type="tel"
              placeholder="7XX XXX XXX"
              className={cn(
                "flex-1 rounded-r-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent px-3 py-2.5 text-sm transition-colors",
                errors.phone
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600"
              )}
            />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        {/* License category */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            License Category <span className="text-gray-400 font-normal">(what you&apos;re preparing for)</span>
          </label>

          {/* Styled select */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <select
              {...register("licenseCategory")}
              className={cn(
                "w-full appearance-none rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pl-10 pr-8 py-2.5 text-sm transition-colors",
                errors.licenseCategory
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600",
                !selectedCategory && "text-gray-400 dark:text-gray-500"
              )}
            >
              <option value="">Select your license category…</option>
              {LICENSE_CATEGORY_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {LICENSE_CATEGORIES.filter((c) => c.group === group).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {/* Chevron */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {errors.licenseCategory && (
            <p className="mt-1 text-sm text-red-500">{errors.licenseCategory.message}</p>
          )}

          {/* Inline description of selected category */}
          {selectedCategory && (() => {
            const cat = LICENSE_CATEGORIES.find((c) => c.id === selectedCategory);
            return cat ? (
              <p className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                {cat.description} · Exams and courses will be tailored to your category
              </p>
            ) : null;
          })()}
        </div>

        {/* Password row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            {...register("password")}
            label="Password"
            type={showPass ? "text" : "password"}
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowPass(!showPass)} className="hover:text-gray-600 dark:hover:text-gray-200">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <Input
            {...register("confirmPassword")}
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="hover:text-gray-600 dark:hover:text-gray-200">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>.
        </p>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
