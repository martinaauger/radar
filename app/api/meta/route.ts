import { NextResponse } from "next/server";
import { listCountries } from "@/lib/db";
import {
  BU_LABELS,
  DECISION_LABELS,
  MAIL_LABELS,
  ORG_LABELS,
  OWNER_LABELS,
  SOURCE_LABELS,
  USE_LABELS,
} from "@/lib/types";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    countries: listCountries(),
    labels: {
      businessUnit: BU_LABELS,
      orgType: ORG_LABELS,
      owner: OWNER_LABELS,
      decision: DECISION_LABELS,
      mail: MAIL_LABELS,
      use: USE_LABELS,
      source: SOURCE_LABELS,
    },
  });
}
