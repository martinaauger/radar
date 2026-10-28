import { NextRequest, NextResponse } from "next/server";
import {
  getCompany,
  listContacts,
  updateCompanySgqHistory,
} from "@/lib/db";

export const runtime = "nodejs";

export function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return ctx.params.then(({ id }) => {
    const company = getCompany(id);
    if (!company) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    const contacts = listContacts({ companyId: id });
    return NextResponse.json({ company, contacts });
  });
}

/** Actualiza antecedentes Quantum (SGQ) de la empresa */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json();
  if (!("quantumHistory" in body) && !("sgqHistory" in body)) {
    return NextResponse.json(
      { error: "Enviar quantumHistory (antecedentes SGQ)" },
      { status: 400 },
    );
  }
  const text =
    body.quantumHistory !== undefined
      ? body.quantumHistory
      : body.sgqHistory;
  const company = updateCompanySgqHistory(
    id,
    typeof text === "string" ? text : null,
  );
  if (!company) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json(company);
}
