import { NextRequest } from "next/server";
import { saveTheoryExam } from "@/lib/admin-content";
export async function POST(req: NextRequest) { return saveTheoryExam(req, null); }
