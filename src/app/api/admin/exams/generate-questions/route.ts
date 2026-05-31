import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { LICENSE_CATEGORIES } from "@/lib/license-categories";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type DiffMix    = "balanced" | "progressive" | "challenge";

const MIXES: Record<DiffMix, Record<Difficulty, number>> = {
  balanced:    { EASY: 0.33, MEDIUM: 0.34, HARD: 0.33 },
  progressive: { EASY: 0.20, MEDIUM: 0.60, HARD: 0.20 },
  challenge:   { EASY: 0.10, MEDIUM: 0.40, HARD: 0.50 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function allocate(total: number, ratios: Record<Difficulty, number>): Record<Difficulty, number> {
  const easy   = Math.max(0, Math.round(total * ratios.EASY));
  const hard   = Math.max(0, Math.round(total * ratios.HARD));
  const medium = Math.max(0, total - easy - hard);
  return { EASY: easy, MEDIUM: medium, HARD: hard };
}

interface CategorySelection {
  category_id: string;
  count: number;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { category_selections, difficulty_mix = "progressive", license_category, language } = await req.json() as {
    category_selections: CategorySelection[];
    difficulty_mix: DiffMix;
    license_category?: string;
    language?: "EN" | "FR";
  };

  if (!Array.isArray(category_selections) || category_selections.length === 0)
    return NextResponse.json({ error: "No categories provided" }, { status: 400 });

  const ratios = MIXES[difficulty_mix] ?? MIXES.progressive;

  const allIds: string[] = [];
  const breakdown: {
    category_id: string;
    category_name: string;
    requested: number;
    selected: number;
    easy: number;
    medium: number;
    hard: number;
  }[] = [];

  for (const { category_id, count } of category_selections) {
    if (!count || count < 1) continue;

    // Fetch all approved questions for this category, then filter in JS
    // (JS filtering avoids Supabase array-contains exact-match issues with legacy label data)
    const { data: rawRows } = await supabase
      .from("questions")
      .select("id, difficulty, language, license_categories, category:categories(name_en)")
      .eq("category_id", category_id)
      .eq("is_approved", true);

    if (!rawRows || rawRows.length === 0) continue;

    // Flexible license_category match: ID, full label, or partial match
    const licCat = license_category
      ? LICENSE_CATEGORIES.find((c) => c.id === license_category)
      : null;
    const licLabel = licCat?.label?.toLowerCase() ?? "";

    const rows = rawRows.filter((r) => {
      // Strict language filter: only questions matching the exam language
      if (language && r.language !== language) return false;
      // License category filter
      if (license_category) {
        const lcs: string[] = r.license_categories ?? [];
        const matches = lcs.some((lc) => {
          const lcLower = lc.toLowerCase();
          return (
            lc === license_category ||
            lcLower === licLabel ||
            (licLabel && licLabel.includes(lcLower)) ||
            lcLower.includes(license_category.replace(/_/g, " "))
          );
        });
        if (!matches) return false;
      }
      return true;
    });

    if (rows.length === 0) continue;

    // Group by difficulty
    const pools: Record<Difficulty, string[]> = { EASY: [], MEDIUM: [], HARD: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const catName = (rows[0].category as any)?.[0]?.name_en ?? (rows[0].category as any)?.name_en ?? "";

    for (const r of rows) {
      const d = r.difficulty as Difficulty;
      if (pools[d]) pools[d].push(r.id);
    }

    // Shuffle each pool
    for (const d of (["EASY", "MEDIUM", "HARD"] as Difficulty[])) {
      pools[d] = shuffle(pools[d]);
    }

    const alloc = allocate(Math.min(count, rows.length), ratios);
    const picked: Record<Difficulty, string[]> = { EASY: [], MEDIUM: [], HARD: [] };
    const used = new Set<string>();

    // First pass: pick from each difficulty's allocated count
    for (const d of (["EASY", "MEDIUM", "HARD"] as Difficulty[])) {
      const take = pools[d].slice(0, alloc[d]);
      picked[d] = take;
      take.forEach((id) => used.add(id));
    }

    // Second pass: fill shortfall from any remaining pool
    // Shortfall = requested minus what we actually picked
    let remaining = Math.min(count, rows.length) - used.size;
    if (remaining > 0) {
      // Priority: MEDIUM overflow first, then EASY, then HARD
      for (const d of (["MEDIUM", "EASY", "HARD"] as Difficulty[])) {
        if (remaining <= 0) break;
        const overflow = pools[d].filter((id) => !used.has(id));
        const take = overflow.slice(0, remaining);
        picked[d].push(...take);
        take.forEach((id) => used.add(id));
        remaining -= take.length;
      }
    }

    const selectedIds = [...picked.EASY, ...picked.MEDIUM, ...picked.HARD];
    allIds.push(...selectedIds);

    breakdown.push({
      category_id,
      category_name: catName,
      requested: count,
      selected: selectedIds.length,
      easy:   picked.EASY.length,
      medium: picked.MEDIUM.length,
      hard:   picked.HARD.length,
    });
  }

  return NextResponse.json({
    question_ids: shuffle(allIds),   // shuffle the combined set
    breakdown,
    total: allIds.length,
  });
}
