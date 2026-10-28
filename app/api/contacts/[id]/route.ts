import { NextRequest, NextResponse } from "next/server";
import { deleteContact, getContact } from "@/lib/db";

export const runtime = "nodejs";

export function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return ctx.params.then(({ id }) => {
    const contact = getContact(id);
    if (!contact) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(contact);
  });
}

export function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return ctx.params.then(({ id }) => {
    deleteContact(id);
    return NextResponse.json({ ok: true });
  });
}
