import { NextRequest, NextResponse } from "next/server";
import { listContacts, upsertContact } from "@/lib/db";
import type {
  DecisionLevel,
  MailStatus,
  ProfileOwner,
  SourceType,
  UseTag,
} from "@/lib/types";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const contacts = listContacts({
    q: sp.get("q") || undefined,
    businessUnit: sp.get("businessUnit") || undefined,
    country: sp.get("country") || undefined,
    owner: sp.get("owner") || undefined,
    orgType: sp.get("orgType") || undefined,
    decisionLevel: sp.get("decisionLevel") || undefined,
    mailStatus: sp.get("mailStatus") || undefined,
    use: sp.get("use") || undefined,
    channel: sp.get("channel") || undefined,
    companyId: sp.get("companyId") || undefined,
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.fullName?.trim() || !body.companyId) {
    return NextResponse.json(
      { error: "Nombre y empresa requeridos" },
      { status: 400 },
    );
  }
  const contact = upsertContact({
    id: body.id,
    companyId: body.companyId,
    fullName: body.fullName,
    title: body.title,
    email: body.email,
    phone: body.phone,
    linkedinUrl: body.linkedinUrl,
    decisionLevel: body.decisionLevel as DecisionLevel | undefined,
    mailStatus: body.mailStatus as MailStatus | undefined,
    notes: body.notes,
    cvSummary: body.cvSummary,
    quantumHistory: body.quantumHistory,
    owners: (body.owners || []) as ProfileOwner[],
    uses: (body.uses || []) as UseTag[],
    source: body.source
      ? {
          sourceType: body.source.sourceType as SourceType,
          owner: body.source.owner as ProfileOwner | null,
          note: body.source.note,
        }
      : body.id
        ? undefined
        : {
            sourceType: (body.sourceType as SourceType) || "manual",
            owner: (body.owners?.[0] as ProfileOwner) || null,
            note: body.sourceNote || null,
          },
  });
  return NextResponse.json(contact);
}
