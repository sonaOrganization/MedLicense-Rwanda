"use client";
import { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { PlayCircle, Lock, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Video { id: string; title_en: string; thumbnail?: string | null; is_free: boolean; duration?: number | null; }
interface Playback { playbackId: string; tokens?: { playback?: string; thumbnail?: string; storyboard?: string }; }
export function TutorialsClient({ videos }: { videos: Video[] }) {
  const [active, setActive] = useState<{ id: string; playback: Playback } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  async function play(video: Video) {
    setLoading(video.id);
    try {
      const res = await fetch("/api/videos/" + video.id + "/playback");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActive({ id: video.id, playback: data });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not play video"); }
    finally { setLoading(null); }
  }
  if (!videos.length) return <div className="text-center py-16"><PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p>Videos coming soon.</p><Link href="/register" className="inline-block mt-4 text-indigo-600">Create an account</Link></div>;
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{videos.map((video) => (
    <Card key={video.id}>
      <CardContent className="p-0">
        {active?.id === video.id ? <MuxPlayer playbackId={active.playback.playbackId} tokens={active.playback.tokens} metadata={{ video_title: video.title_en }} autoPlay /> : (
          <button onClick={() => play(video)} disabled={loading !== null} aria-label={"Play " + video.title_en} className="relative block w-full aspect-video bg-gray-900 rounded-t-xl overflow-hidden">
            {video.thumbnail && <Image src={video.thumbnail} alt={video.title_en} fill className="object-cover opacity-70" sizes="(max-width: 640px) 100vw, 33vw" />}
            <span className="absolute inset-0 flex items-center justify-center text-white"><PlayCircle className="w-12 h-12" /></span>
            <span className="absolute top-2 right-2"><Badge variant={video.is_free ? "success" : "warning"}>{!video.is_free && <Lock className="w-3 h-3 mr-1" />}{video.is_free ? "Free" : "Premium"}</Badge></span>
            {loading === video.id && <span className="absolute bottom-2 left-2 text-white text-sm">Opening video…</span>}
          </button>
        )}
        <div className="p-4"><h3 className="font-semibold text-sm mb-1">{video.title_en}</h3>{Boolean(video.duration) && <div className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3.5 h-3.5" />{Math.floor(video.duration! / 60)}:{(video.duration! % 60).toString().padStart(2,"0")}</div>}</div>
      </CardContent>
    </Card>
  ))}</div>;
}
