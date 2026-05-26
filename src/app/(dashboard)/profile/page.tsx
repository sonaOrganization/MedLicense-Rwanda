"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Globe, Languages } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      language: "EN",
    },
  });

  async function onSubmit(data: ProfileInput) {
    setLoading(true);
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Profile updated!");
      await update({ name: data.name });
    } else {
      toast.error("Failed to update profile");
    }
  }

  const initials = session?.user?.name
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>

      {/* Avatar */}
      <Card>
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{session?.user?.name}</h2>
            <p className="text-gray-400 text-sm">{session?.user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("name")}
              label="Full Name"
              placeholder="Your full name"
              error={errors.name?.message}
              leftIcon={<User className="w-4 h-4" />}
            />
            <Input
              {...register("phone")}
              label="Phone Number"
              placeholder="+250 700 000 000"
              leftIcon={<Phone className="w-4 h-4" />}
            />
            <Input
              {...register("country")}
              label="Country"
              placeholder="Rwanda"
              leftIcon={<Globe className="w-4 h-4" />}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
              <select
                {...register("language")}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EN">English</option>
                <option value="FR">Français</option>
              </select>
            </div>
            <Button type="submit" loading={loading}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
