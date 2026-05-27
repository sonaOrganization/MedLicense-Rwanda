"use client";
import { useState } from "react";
import { MoreHorizontal, Ban, UserCheck, Shield, UserMinus } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface UserActionsProps {
  userId: string;
  isBanned: boolean;
  role: string;
}

export function UserActions({ userId, isBanned, role }: UserActionsProps) {
  const [open,    setOpen]    = useState(false);
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
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-gray-700/60 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-40"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">

            {/* Ban / Unban */}
            <button
              onClick={() => action(isBanned ? "unban" : "ban")}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-700/50 transition-colors ${
                isBanned ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isBanned
                ? <><UserCheck className="w-4 h-4 flex-shrink-0" /> Unban User</>
                : <><Ban className="w-4 h-4 flex-shrink-0" /> Ban User</>
              }
            </button>

            <div className="h-px bg-gray-700/60 my-1" />

            {/* Role change */}
            {role !== "ADMIN" && (
              <button
                onClick={() => action("make_admin")}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-700/50 text-gray-300 transition-colors"
              >
                <Shield className="w-4 h-4 flex-shrink-0 text-blue-400" />
                Make Admin
              </button>
            )}
            {role === "ADMIN" && (
              <button
                onClick={() => action("make_student")}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-700/50 text-gray-300 transition-colors"
              >
                <UserMinus className="w-4 h-4 flex-shrink-0 text-amber-400" />
                Demote to Student
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
