import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Lock, Clock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Video Tutorials" };

export default async function TutorialsPage() {
  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("is_published", true)
    .order("order", { ascending: true });

  const videoList = videos ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Video Tutorials</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">
          Expert-led video tutorials covering all medical license exam topics.
        </p>
      </div>

      {videoList.length === 0 ? (
        <div className="text-center py-16">
          <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Videos coming soon. Check back shortly!</p>
          <Link href="/register" className="mt-4 inline-block">
            <Badge variant="info" className="text-sm px-4 py-2 cursor-pointer">Get notified when available</Badge>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoList.map((video: {
            id: string;
            title_en: string;
            thumbnail?: string;
            is_free: boolean;
            duration?: number;
          }) => (
            <Card key={video.id} hover>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-t-xl overflow-hidden">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title_en} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                      <PlayCircle className="w-12 h-12 text-white/60" />
                    </div>
                  )}
                  {!video.is_free && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="warning" className="gap-1"><Lock className="w-3 h-3" /> Premium</Badge>
                    </div>
                  )}
                  {video.is_free && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="success">Free</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{video.title_en}</h3>
                  {video.duration && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
