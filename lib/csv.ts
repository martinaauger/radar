import {
  findCompanyByNameCountry,
  findContactByLinkedinUrl,
  upsertCompany,
  upsertContact,
} from "./db";
import type {
  BusinessUnit,
  DecisionLevel,
  OrgType,
  ProfileOwner,
  SourceType,
  UseTag,
} from "./types";

function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function norm(h: string) {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseList(v?: string) {
  if (!v) return [];
  return v
    .split(/[|;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function asBU(v?: string): BusinessUnit {
  const s = (v || "").toLowerCase();
  if (s.includes("elec")) return "electricidad";
  if (s.includes("gas")) return "gas";
  if (s.includes("agua") || s.includes("sanea")) return "agua";
  if (s.includes("gener")) return "generacion";
  if (s.includes("nuevo") || s.includes("resid")) return "nuevos_negocios";
  return "transversal";
}

function asOrg(v?: string): OrgType {
  const s = (v || "").toLowerCase();
  if (s.includes("distrib")) return "distribuidora";
  if (s.includes("transp")) return "transportista";
  if (s.includes("gener")) return "generadora";
  if (s.includes("regul") || s.includes("ente")) return "regulador";
  if (s.includes("gob") || s.includes("minist")) return "gobierno";
  if (s.includes("asoc") || s.includes("camar") || s.includes("associa"))
    return "asociacion";
  if (s.includes("consult")) return "consultora";
  return "otro";
}

function asDecision(v?: string): DecisionLevel {
  const s = (v || "").toLowerCase();
  if (
    s.includes("ceo") ||
    s.includes("director") ||
    s.includes("gerente") ||
    s.includes("presidente") ||
    s.includes("cfo") ||
    s.includes("coo") ||
    s.includes("decis")
  )
    return "decisor";
  if (
    s.includes("asesor") ||
    s.includes("regul") ||
    s.includes("legal") ||
    s.includes("influ") ||
    s.includes("coordina") ||
    s.includes("jefe") ||
    s.includes("head")
  )
    return "influenciador";
  if (
    s.includes("especialista") ||
    s.includes("analista") ||
    s.includes("ingenier") ||
    s.includes("tecnic") ||
    s.includes("técnic")
  )
    return "tecnico";
  if (s.includes("oper")) return "operativo";
  return "desconocido";
}

function asOwners(
  v?: string,
  fallback: ProfileOwner[] = ["fernando"],
): ProfileOwner[] {
  const parsed = parseList(v)
    .map((x) => x.toLowerCase())
    .map((x): ProfileOwner | null => {
      if (x.includes("fern")) return "fernando";
      if (x.includes("elia")) return "elias";
      if (x.includes("cesar") || x.includes("césar")) return "cesar";
      if (x.includes("laura")) return "laura";
      return null;
    })
    .filter((x): x is ProfileOwner => !!x);
  return parsed.length ? parsed : fallback;
}

function asUses(v?: string): UseTag[] {
  return parseList(v)
    .map((x) => x.toLowerCase())
    .map((x): UseTag | null => {
      if (x.includes("licit")) return "licitacion";
      if (x.includes("semi")) return "seminario";
      if (x.includes("bench")) return "benchmarking";
      if (x.includes("camp")) return "campana";
      if (x.includes("asoc")) return "asociado";
      return null;
    })
    .filter((x): x is UseTag => !!x);
}

function inferBuFromText(blob: string): BusinessUnit {
  const s = blob.toLowerCase();
  if (/(gas|gnl|metrogas|enargas)/.test(s)) return "gas";
  if (/(água|agua|saneamiento|saneamento|aysa)/.test(s)) return "agua";
  if (/(gera|genera|abrage|abiape|statkraft)/.test(s)) return "generacion";
  if (
    /(energi|electric|distrib|aneel|enre|copel|cemig|transener|isa )/.test(s)
  )
    return "electricidad";
  return "transversal";
}

function inferOrgFromText(blob: string): OrgType {
  const s = blob.toLowerCase();
  if (/(associa|asocia|câmara|camara|abrage|abiape)/.test(s))
    return "asociacion";
  if (/(aneel|enre|enargas|osinerg|creg|regul)/.test(s)) return "regulador";
  return "otro";
}

/** LinkedIn Connections puts a Notes: preamble before the real header. */
function findHeaderLineIndex(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const n = norm(splitCSVLine(lines[i])[0] || "");
    if (
      n === "first_name" ||
      n === "full_name" ||
      n === "nombre" ||
      n === "name" ||
      n === "company" ||
      n === "empresa"
    ) {
      return i;
    }
    const cols = splitCSVLine(lines[i]).map(norm);
    if (
      cols.includes("first_name") &&
      (cols.includes("last_name") || cols.includes("company"))
    ) {
      return i;
    }
  }
  return 0;
}

export type CsvFormat =
  | "linkedin_connections"
  | "sales_nav"
  | "quantum";

export type CsvInspection = {
  format: CsvFormat;
  sourceType: SourceType;
  /** Owner inferred from filename and/or owners column; null if ambiguous */
  owner: ProfileOwner | null;
  ownerConfidence: "filename" | "column" | "none";
  headerLine: number;
  headers: string[];
  rowCount: number;
  label: string;
};

const FORMAT_TO_SOURCE: Record<CsvFormat, SourceType> = {
  linkedin_connections: "linkedin_export",
  sales_nav: "sales_navigator",
  quantum: "manual",
};

const FORMAT_LABEL: Record<CsvFormat, string> = {
  linkedin_connections: "LinkedIn Connections",
  sales_nav: "Sales Navigator",
  quantum: "Plantilla Quantum / base clasificada",
};

function detectFormat(headers: string[]): CsvFormat {
  const h = new Set(headers);
  if (
    h.has("connected_on") ||
    (h.has("first_name") &&
      h.has("last_name") &&
      h.has("url") &&
      (h.has("email_address") || h.has("position") || h.has("company")))
  ) {
    return "linkedin_connections";
  }
  if (
    h.has("account_name") ||
    h.has("person_linkedin_url") ||
    h.has("company_domain") ||
    h.has("years_in_position") ||
    (h.has("first_name") &&
      (h.has("title") || h.has("company") || h.has("company_name")) &&
      (h.has("profile_url") ||
        h.has("linkedin_url") ||
        h.has("person_linkedin_url") ||
        h.has("linkedin")))
  ) {
    return "sales_nav";
  }
  if (
    h.has("first_name") &&
    (h.has("company") || h.has("account_name") || h.has("title"))
  ) {
    return "sales_nav";
  }
  return "quantum";
}

/** Infer owner from upload filename (Connections_elias.csv, Perfil_LF_…). */
export function detectOwnerFromFilename(
  filename?: string | null,
): ProfileOwner | null {
  if (!filename) return null;
  const s = filename
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (
    s.includes("laura") ||
    s.includes("perfil_lf") ||
    s.includes("perfil-lf") ||
    /(^|[^a-z])lf([^a-z]|$)/.test(s)
  )
    return "laura";
  if (s.includes("elias")) return "elias";
  if (s.includes("cesar")) return "cesar";
  if (s.includes("fernando") || /(^|[^a-z])fern([^a-z]|$)/.test(s))
    return "fernando";
  return null;
}

function detectOwnerFromRows(
  headers: string[],
  lines: string[],
): ProfileOwner | null {
  const ownerIdx = headers.findIndex((h) => h === "owners" || h === "perfiles");
  if (ownerIdx < 0) return null;
  const counts: Partial<Record<ProfileOwner, number>> = {};
  for (let i = 1; i < Math.min(lines.length, 40); i++) {
    const cols = splitCSVLine(lines[i]);
    for (const o of asOwners(cols[ownerIdx], [])) {
      counts[o] = (counts[o] || 0) + 1;
    }
  }
  const ranked = (Object.entries(counts) as [ProfileOwner, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  if (ranked.length === 1) return ranked[0][0];
  if (ranked.length > 1 && ranked[0][1] >= ranked[1][1] * 2) return ranked[0][0];
  return null;
}

/** Identify CSV format + likely owner before/without writing. */
export function inspectCsvUpload(
  text: string,
  filename?: string | null,
): CsvInspection {
  const rawLines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (rawLines.length < 2) {
    return {
      format: "quantum",
      sourceType: "manual",
      owner: detectOwnerFromFilename(filename),
      ownerConfidence: detectOwnerFromFilename(filename) ? "filename" : "none",
      headerLine: 0,
      headers: [],
      rowCount: 0,
      label: "CSV vacío o sin filas",
    };
  }

  const headerIdx = findHeaderLineIndex(rawLines);
  const lines = rawLines.slice(headerIdx);
  const headers = splitCSVLine(lines[0]).map(norm);
  const format = detectFormat(headers);
  const fromFile = detectOwnerFromFilename(filename);
  const fromCol = detectOwnerFromRows(headers, lines);
  const owner = fromFile ?? fromCol;
  const ownerConfidence: CsvInspection["ownerConfidence"] = fromFile
    ? "filename"
    : fromCol
      ? "column"
      : "none";

  return {
    format,
    sourceType: FORMAT_TO_SOURCE[format],
    owner,
    ownerConfidence,
    headerLine: headerIdx + 1,
    headers,
    rowCount: Math.max(0, lines.length - 1),
    label: FORMAT_LABEL[format],
  };
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (row[k]?.trim()) return row[k].trim();
  }
  return "";
}

export function importContactsCSV(
  text: string,
  opts: { defaultOwners: ProfileOwner[]; sourceType: SourceType },
) {
  const rawLines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (rawLines.length < 2)
    return {
      imported: 0,
      companiesCreated: 0,
      merged: 0,
      errors: ["CSV vacío"],
      detected: inspectCsvUpload(text),
    };

  const headerIdx = findHeaderLineIndex(rawLines);
  const lines = rawLines.slice(headerIdx);
  const headers = splitCSVLine(lines[0]).map(norm);
  const format = detectFormat(headers);

  let imported = 0;
  let companiesCreated = 0;
  let merged = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (cols[idx]) row[h] = cols[idx];
    });

    const fullName =
      pick(row, ["full_name", "nombre", "name"]) ||
      [pick(row, ["first_name"]), pick(row, ["last_name"])]
        .filter(Boolean)
        .join(" ");

    const companyName = pick(row, [
      "company",
      "empresa",
      "organization",
      "account_name",
      "company_name",
    ]);

    if (!fullName) {
      errors.push(`Fila ${headerIdx + i + 1}: falta nombre`);
      continue;
    }
    if (!companyName) {
      // Connections sometimes lacks company — keep with placeholder
      if (format === "linkedin_connections" || format === "sales_nav") {
        // allow placeholder below
      } else {
        errors.push(`Fila ${headerIdx + i + 1}: falta empresa`);
        continue;
      }
    }

    const resolvedCompany = companyName || "(Sin empresa)";
    const title = pick(row, ["title", "cargo", "position", "job_title"]);
    const email =
      pick(row, ["email", "correo", "email_address", "emails"]) || null;
    const linkedinUrl =
      pick(row, [
        "linkedin_url",
        "linkedin",
        "url",
        "profile_url",
        "linkedin_profile_url",
        "person_linkedin_url",
      ]) || null;
    const country = pick(row, [
      "country",
      "pais",
      "geography",
      "location",
      "company_location",
    ]);
    const city = pick(row, ["city", "ciudad"]) || null;

    const blob = `${resolvedCompany} ${title} ${pick(row, ["sector", "industry", "business_unit", "unidad"])}`;
    const businessUnit =
      pick(row, ["sector", "business_unit", "unidad", "industry"])
        ? asBU(pick(row, ["sector", "business_unit", "unidad", "industry"]))
        : inferBuFromText(blob);
    const orgType = pick(row, ["org_type", "tipo_org"])
      ? asOrg(pick(row, ["org_type", "tipo_org"]))
      : inferOrgFromText(blob);

    const defaultOwners = asOwners(
      pick(row, ["owners", "perfiles"]),
      opts.defaultOwners,
    );
    const decisionLevel = asDecision(
      pick(row, ["decision_level", "nivel"]) || title,
    );
    const uses = asUses(pick(row, ["uses", "uso", "relevance"]));

    const existingLi = findContactByLinkedinUrl(linkedinUrl);
    if (existingLi) {
      const owners = Array.from(
        new Set([...existingLi.owners, ...defaultOwners]),
      );
      upsertContact({
        id: existingLi.id,
        companyId: existingLi.companyId,
        fullName: existingLi.fullName || fullName,
        title: title || existingLi.title,
        email: email || existingLi.email,
        phone: existingLi.phone,
        linkedinUrl: linkedinUrl || existingLi.linkedinUrl,
        decisionLevel:
          existingLi.decisionLevel !== "desconocido"
            ? existingLi.decisionLevel
            : decisionLevel,
        owners,
        uses: uses.length ? uses : existingLi.uses,
        source: {
          sourceType: opts.sourceType,
          owner: defaultOwners[0] ?? null,
          note: `Import ${format} — merge por LinkedIn (fila ${headerIdx + i + 1})`,
        },
      });
      merged += 1;
      imported += 1;
      continue;
    }

    let company = findCompanyByNameCountry(
      resolvedCompany,
      country || "—",
    );
    if (!company) {
      company = upsertCompany({
        name: resolvedCompany,
        country: country || "Sin país",
        city,
        businessUnit,
        orgType,
      });
      companiesCreated += 1;
    }

    upsertContact({
      companyId: company.id,
      fullName,
      title,
      email,
      linkedinUrl,
      decisionLevel,
      owners: defaultOwners,
      uses,
      source: {
        sourceType: opts.sourceType,
        owner: defaultOwners[0] ?? null,
        note: `Import ${format} fila ${headerIdx + i + 1}`,
      },
    });
    imported += 1;
  }

  return {
    imported,
    companiesCreated,
    merged,
    errors,
    detected: {
      format,
      sourceType: opts.sourceType,
      label: FORMAT_LABEL[format],
      rowCount: Math.max(0, lines.length - 1),
    },
  };
}
