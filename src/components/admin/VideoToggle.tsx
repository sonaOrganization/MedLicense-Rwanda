"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface VideoToggleProps {
  videoId: string;
  isPublished: boolean;
}

export function VideoToggle({ videoId, isPublished }: VideoToggleProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !isPublished }),
      });
      if (!res.ok) throw new Error();
      toast.success(isPublished ? "Video unpublished" : "Video published");
      router.refresh();
    } catch {
      toast.error("Failed to update video");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
        isPublished
          ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
      }`}
    >
      {loading ? "..." : isPublished ? "Unpublish" : "Publish"}
    </button>
  );
}
