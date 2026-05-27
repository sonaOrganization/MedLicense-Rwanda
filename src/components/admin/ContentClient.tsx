"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Video, Clock, Play, Edit, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VideoToggle } from "./VideoToggle";
import { VideoUploadModal } from "./VideoUploadModal";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Category { id: string; name_en: string; }

interface VideoItem {
  id: string;
  title_en: string;
  description?: string | null;
  mux_playback_id?: string | null;
  mux_asset_id?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  is_published: boolean;
  is_free: boolean;
  category_id: string;
  category?: { name_en: string };
}

interface Props {
  videos: VideoItem[];
  categories: Category[];
  currentCategory: string;
  currentPublished: string;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ContentClient({ videos, categories, currentCategory, currentPublished }: Props) {
  const router  = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPublished = videos.filter((v) => v.is_published).length;
  const totalFree      = videos.filter((v) => v.is_free).length;

  async function handleDelete(id: string) {
    if (!confirm("Delete this video? This will also remove it from Mux and cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Video deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete video");
    } finally {
      setDeletingId(null);
    }
  }

  function processingStatus(v: VideoItem) {
    if (v.mux_asset_id === "error") return "error";
    if (!v.mux_playback_id && !v.mux_asset_id) return "processing";
    if (!v.mux_playback_id) return "processing";
    return "ready";
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {videos.length} video{videos.length !== 1 ? "s" : ""} · {totalPublished} published · {totalFree} free
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Upload Video
        </button>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="category"
          defaultValue={currentCategory}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
        </select>
        <select
          name="published"
          defaultValue={currentPublished}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Video grid */}
      {videos.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No videos yet</p>
          <p className="text-sm mt-1">Upload your first tutorial video to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const status   = processingStatus(video);
            const dur      = formatDuration(video.duration);
            return (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {video.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnail} alt={video.title_en} className="w-full h-full object-cover" />
                  ) : (
                    <Video className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                  )}
                  {dur && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {dur}
                    </span>
                  )}
                  {status === "processing" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        <span className="text-white text-xs font-medium">Processing…</span>
                      </div>
                    </div>
                  )}
                  {status === "error" && (
                    <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                      <span className="text-white text-xs font-medium bg-red-600/80 px-3 py-1.5 rounded-full">Processing failed</span>
                    </div>
                  )}
                  {status === "ready" && video.mux_playback_id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">{video.title_en}</p>
                    {video.category && (
                      <p className="text-xs text-gray-400 mt-0.5">{video.category.name_en}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={video.is_published ? "success" : "warning"}>
                        {video.is_published ? "Live" : "Draft"}
                      </Badge>
                      {video.is_free && <Badge variant="default">Free</Badge>}
                      {dur && (
                        <span className={cn("text-xs text-gray-400 flex items-center gap-1")}>
                          <Clock className="w-3 h-3" />{dur}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <VideoToggle videoId={video.id} isPublished={video.is_published} />
                      <button
                        onClick={() => handleDelete(video.id)}
                        disabled={deletingId === video.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <VideoUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        categories={categories}
      />
    </>
  );
}
