import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { TutorialsClient } from "@/components/pages/TutorialsClient";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Video Tutorials" };
export default async function TutorialsPage() {
  const { data: videos, error } = await supabase.from("videos").select("id, title_en, thumbnail, is_free, duration").eq("is_published", true).order("order", { ascending: true });
  if (error) throw new Error("Could not load video tutorials");
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20"><div className="text-center mb-12"><h1 className="text-4xl font-bold mb-4">Video Tutorials</h1><p className="text-xl text-gray-500">Expert-led video tutorials covering medical license exam topics.</p></div><TutorialsClient videos={videos ?? []} /></div>;
}
