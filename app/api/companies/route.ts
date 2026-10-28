import { NextRequest, NextResponse } from "next/server";
import { listCompanies, upsertCompany } from "@/lib/db";
import type { BusinessUnit, OrgType } from "@/lib/types";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const companies = listCompanies({
    q: sp.get("q") || undefined,
    businessUnit: sp.get("businessUnit") || undefined,
    country: sp.get("country") || undefined,
    owner: sp.get("owner") || undefined,
    orgType: sp.get("orgType") || undefined,
  });
  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  const company = upsertCompany({
    id: body.id,
    name: body.name,
    country: body.country || "",
    city: body.city,
    businessUnit: (body.businessUnit || "transversal") as BusinessUnit,
    orgType: (body.orgType || "otro") as OrgType,
    notes: body.notes,
  });
  return NextResponse.json(company);
}
