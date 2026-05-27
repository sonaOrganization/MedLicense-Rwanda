import { supabase } from "@/lib/supabase";
import { ContentClient } from "@/components/admin/ContentClient";

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

  const [{ data: videos }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name_en"),
  ]);

  const videoList = (videos ?? []).map((v: {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category?: any;
  }) => ({
    id: v.id,
    title_en: v.title_en,
    description: v.description,
    mux_playback_id: v.mux_playback_id,
    mux_asset_id: v.mux_asset_id,
    thumbnail: v.thumbnail,
    duration: v.duration,
    is_published: v.is_published,
    is_free: v.is_free,
    category_id: v.category_id,
    category: v.category
      ? { name_en: Array.isArray(v.category) ? v.category[0]?.name_en ?? "" : v.category.name_en ?? "" }
      : undefined,
  }));

  const categoryList = (categories ?? []).map((c: { id: string; name_en: string }) => ({
    id: c.id,
    name_en: c.name_en,
  }));

  return (
    <div className="max-w-6xl space-y-6">
      <ContentClient
        videos={videoList}
        categories={categoryList}
        currentCategory={category ?? ""}
        currentPublished={published ?? ""}
      />
    </div>
  );
}
