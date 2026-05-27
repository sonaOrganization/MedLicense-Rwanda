import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Video, Clock, Play } from "lucide-react";
import { VideoToggle } from "@/components/admin/VideoToggle";

interface Props {
  searchParams: Promise<{ category?: string; published?: string }>;
}

export default async function AdminContentPage({ searchParams }: Props) {
  const { category, published } = await searchParams;

  let query = supabase
    .from("videos")
    .select("*, category:categories(name_en)")
    .order("order", { ascending: true });

  if (category) query = query.eq("category_id", category);
  if (published !== undefined && published !== "")
    query = query.eq("is_published", published === "true");

  const { data: videos } = await query;
  const { data: categories } = await supabase.from("categories").select("id, name_en");

  const videoList = videos ?? [];
  const categoryList = categories ?? [];

  const totalPublished = videoList.filter((v: { is_published: boolean }) => v.is_published).length;
  const totalFree = videoList.filter((v: { is_free: boolean }) => v.is_free).length;

  function formatDuration(seconds?: number) {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {videoList.length} videos · {totalPublished} published · {totalFree} free
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Upload Video
        </Button>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="category"
          defaultValue={category ?? ""}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Categories</option>
          {categoryList.map((c: { id: string; name_en: string }) => (
            <option key={c.id} value={c.id}>{c.name_en}</option>
          ))}
        </select>
        <select
          name="published"
          defaultValue={published ?? ""}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Video grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videoList.map((video: {
          id: string;
          title_en: string;
          mux_playback_id?: string;
          thumbnail?: string;
          duration?: number;
          is_published: boolean;
          is_free: boolean;
          category?: { name_en: string };
        }) => (
          <Card key={video.id} className="overflow-hidden">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
              {video.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnail}
                  alt={video.title_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Video className="w-10 h-10 text-gray-600" />
              )}
              {video.duration && (
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </span>
              )}
              {video.mux_playback_id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{video.title_en}</p>
                  {video.category && (
                    <p className="text-xs text-gray-400 mt-0.5">{video.category.name_en}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Badge variant={video.is_published ? "success" : "warning"}>
                    {video.is_published ? "Live" : "Draft"}
                  </Badge>
                  {video.is_free && <Badge variant="default">Free</Badge>}
                  {video.duration && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatDuration(video.duration)}
                    </span>
                  )}
                </div>
                <VideoToggle videoId={video.id} isPublished={video.is_published} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videoList.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No videos yet</p>
          <p className="text-sm mt-1">Upload your first tutorial video to get started.</p>
        </div>
      )}
    </div>
  );
}
