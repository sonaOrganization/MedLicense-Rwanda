"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Ban, UserCheck, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface UserActionsProps {
  userId: string;
  isBanned: boolean;
  role: string;
}

export function UserActions({ userId, isBanned, role }: UserActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function action(type: string) {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type }),
      });
      if (!res.ok) throw new Error("Action failed");
      toast.success("User updated");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
            <button
              onClick={() => action(isBanned ? "unban" : "ban")}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
            >
              {isBanned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              {isBanned ? "Unban User" : "Ban User"}
            </button>
            {role !== "ADMIN" && (
              <button
                onClick={() => action("make_admin")}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Shield className="w-4 h-4" />
                Make Admin
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
