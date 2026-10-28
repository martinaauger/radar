import { NextResponse } from "next/server";
import { getCoverage } from "@/lib/db";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(getCoverage());
}
