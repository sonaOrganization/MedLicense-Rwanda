import { NextRequest } from "next/server";
import { saveQuestion } from "@/lib/admin-content";
export async function POST(req: NextRequest) { return saveQuestion(req, null); }
