import { NextRequest, NextResponse } from "next/server";
import { getCoverage } from "@/lib/db";
import { importContactsCSV, inspectCsvUpload } from "@/lib/csv";
import type { ProfileOwner, SourceType } from "@/lib/types";
import { OWNERS } from "@/lib/types";

export const runtime = "nodejs";

function asOwnerList(raw: unknown): ProfileOwner[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const owners = raw
    .map((x) => String(x).toLowerCase())
    .filter((x): x is ProfileOwner =>
      (OWNERS as readonly string[]).includes(x),
    );
  return owners.length ? owners : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = String(body.csv || "");
  if (!text.trim()) {
    return NextResponse.json({ error: "CSV vacío" }, { status: 400 });
  }

  const filename =
    typeof body.filename === "string" ? body.filename : null;
  const detected = inspectCsvUpload(text, filename);
  const overrideOwners = asOwnerList(body.owners);
  const overrideSource =
    typeof body.sourceType === "string"
      ? (body.sourceType as SourceType)
      : null;

  // Un import = un owner. Auto: filename/columna → fallback UI → error.
  const forceManual = body.forceManual === true;
  const owner = forceManual
    ? (overrideOwners?.[0] ?? detected.owner ?? null)
    : (detected.owner ?? overrideOwners?.[0] ?? null);
  if (!owner) {
    return NextResponse.json(
      {
        error:
          "No pude identificar el perfil. Nombrá el archivo con el owner (ej. Connections_elias.csv) o elegí el perfil en la UI.",
        detected,
      },
      { status: 400 },
    );
  }

  const sourceType = forceManual
    ? (overrideSource ?? detected.sourceType)
    : (detected.sourceType ?? overrideSource ?? "manual");

  if (body.inspectOnly) {
    return NextResponse.json({
      detected: { ...detected, owner },
      owner,
      sourceType,
    });
  }

  const result = importContactsCSV(text, {
    defaultOwners: [owner],
    sourceType,
  });

  const coverage = getCoverage();
  const byOwner = coverage.byOwner.find((o) => o.key === owner) ?? null;

  return NextResponse.json({
    ...result,
    owner,
    sourceType,
    detected: {
      ...detected,
      owner,
      sourceType,
    },
    coverage: { byOwner: coverage.byOwner, forOwner: byOwner },
  });
}
