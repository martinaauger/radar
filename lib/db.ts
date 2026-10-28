import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  BusinessUnit,
  Company,
  Contact,
  ContactSource,
  CoverageStats,
  DecisionLevel,
  MailStatus,
  OrgType,
  ProfileOwner,
  SourceType,
  UseTag,
} from "./types";
import {
  BU_LABELS,
  BUSINESS_UNITS,
  ORG_LABELS,
  ORG_TYPES,
  OWNER_LABELS,
  OWNERS,
} from "./types";
import { SEED_COMPANIES, SEED_CONTACTS } from "./seed-data";
import {
  ensureHistorySchema,
  listHistoryForContact,
  syncAllHistoryFromSignals,
  syncContactHistorySignals,
  syncManualHistoryNote,
} from "./quantum-history";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "radar.sqlite");

let dbInstance: Database.Database | null = null;

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT '',
      city TEXT,
      business_unit TEXT NOT NULL,
      org_type TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      email TEXT,
      phone TEXT,
      linkedin_url TEXT,
      decision_level TEXT NOT NULL DEFAULT 'desconocido',
      mail_status TEXT NOT NULL DEFAULT 'pendiente',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_owners (
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      owner TEXT NOT NULL,
      PRIMARY KEY (contact_id, owner)
    );

    CREATE TABLE IF NOT EXISTS contact_uses (
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      use_tag TEXT NOT NULL,
      PRIMARY KEY (contact_id, use_tag)
    );

    CREATE TABLE IF NOT EXISTS contact_sources (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      owner TEXT,
      note TEXT,
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_companies_bu ON companies(business_unit);
    CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
    CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_mail ON contacts(mail_status);
    CREATE INDEX IF NOT EXISTS idx_contacts_li ON contacts(linkedin_url);
    CREATE INDEX IF NOT EXISTS idx_contact_sources_contact ON contact_sources(contact_id);
    CREATE INDEX IF NOT EXISTS idx_contact_uses_tag ON contact_uses(use_tag);
  `);
  migrateColumns(db);
}

function tableColumns(db: Database.Database, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  return new Set(rows.map((r) => r.name));
}

function migrateColumns(db: Database.Database) {
  const companyCols = tableColumns(db, "companies");
  if (!companyCols.has("quantum_history")) {
    db.exec(`ALTER TABLE companies ADD COLUMN quantum_history TEXT`);
  }
  const contactCols = tableColumns(db, "contacts");
  if (!contactCols.has("cv_summary")) {
    db.exec(`ALTER TABLE contacts ADD COLUMN cv_summary TEXT`);
  }
  if (!contactCols.has("quantum_history")) {
    db.exec(`ALTER TABLE contacts ADD COLUMN quantum_history TEXT`);
  }
  ensureHistorySchema(db);
  const historyCount = db
    .prepare(`SELECT COUNT(*) AS n FROM quantum_history_events`)
    .get() as { n: number };
  if (historyCount.n === 0) {
    syncAllHistoryFromSignals(db);
  }
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM companies").get() as {
    n: number;
  };
  if (count.n > 0) return;

  const insertCompany = db.prepare(`
    INSERT INTO companies (id, name, country, city, business_unit, org_type, notes, created_at, updated_at)
    VALUES (@id, @name, @country, @city, @businessUnit, @orgType, @notes, @createdAt, @updatedAt)
  `);
  const insertContact = db.prepare(`
    INSERT INTO contacts (id, company_id, full_name, title, email, phone, linkedin_url, decision_level, mail_status, notes, created_at, updated_at)
    VALUES (@id, @companyId, @fullName, @title, @email, @phone, @linkedinUrl, @decisionLevel, @mailStatus, @notes, @createdAt, @updatedAt)
  `);
  const insertOwner = db.prepare(
    `INSERT INTO contact_owners (contact_id, owner) VALUES (?, ?)`,
  );
  const insertUse = db.prepare(
    `INSERT INTO contact_uses (contact_id, use_tag) VALUES (?, ?)`,
  );
  const insertSource = db.prepare(`
    INSERT INTO contact_sources (id, contact_id, source_type, owner, note, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const c of SEED_COMPANIES) {
      insertCompany.run({
        id: c.id,
        name: c.name,
        country: c.country,
        city: c.city,
        businessUnit: c.businessUnit,
        orgType: c.orgType,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }
    for (const c of SEED_CONTACTS) {
      insertContact.run({
        id: c.id,
        companyId: c.companyId,
        fullName: c.fullName,
        title: c.title,
        email: c.email,
        phone: c.phone,
        linkedinUrl: c.linkedinUrl,
        decisionLevel: c.decisionLevel,
        mailStatus: c.mailStatus,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
      for (const o of c.owners) insertOwner.run(c.id, o);
      for (const u of c.uses) insertUse.run(c.id, u);
      for (const s of c.sources) {
        insertSource.run(
          s.id,
          c.id,
          s.sourceType,
          s.owner,
          s.note,
          s.recordedAt,
        );
      }
    }
  });
  tx();
}

export function getDb() {
  if (dbInstance) return dbInstance;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  dbInstance = new Database(DB_PATH);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");
  ensureSchema(dbInstance);
  seedIfEmpty(dbInstance);
  return dbInstance;
}

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    country: String(row.country ?? ""),
    city: (row.city as string) ?? null,
    businessUnit: row.business_unit as BusinessUnit,
    orgType: row.org_type as OrgType,
    notes: (row.notes as string) ?? null,
    quantumHistory: (row.quantum_history as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    contactCount: Number(row.contact_count ?? 0),
    withEmailCount: Number(row.with_email_count ?? 0),
  };
}

function loadOwners(db: Database.Database, contactId: string): ProfileOwner[] {
  return (
    db
      .prepare(`SELECT owner FROM contact_owners WHERE contact_id = ?`)
      .all(contactId) as { owner: ProfileOwner }[]
  ).map((r) => r.owner);
}

function loadUses(db: Database.Database, contactId: string): UseTag[] {
  return (
    db
      .prepare(`SELECT use_tag FROM contact_uses WHERE contact_id = ?`)
      .all(contactId) as { use_tag: UseTag }[]
  ).map((r) => r.use_tag);
}

function loadSources(db: Database.Database, contactId: string): ContactSource[] {
  return (
    db
      .prepare(
        `SELECT id, contact_id, source_type, owner, note, recorded_at
         FROM contact_sources WHERE contact_id = ? ORDER BY recorded_at DESC`,
      )
      .all(contactId) as Record<string, unknown>[]
  ).map((r) => ({
    id: String(r.id),
    contactId: String(r.contact_id),
    sourceType: r.source_type as SourceType,
    owner: (r.owner as ProfileOwner) ?? null,
    note: (r.note as string) ?? null,
    recordedAt: String(r.recorded_at),
  }));
}

function mapContact(
  db: Database.Database,
  row: Record<string, unknown>,
): Contact {
  const id = String(row.id);
  return {
    id,
    companyId: String(row.company_id),
    fullName: String(row.full_name),
    title: String(row.title ?? ""),
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    linkedinUrl: (row.linkedin_url as string) ?? null,
    decisionLevel: row.decision_level as DecisionLevel,
    mailStatus: row.mail_status as MailStatus,
    notes: (row.notes as string) ?? null,
    cvSummary: (row.cv_summary as string) ?? null,
    quantumHistory: (row.quantum_history as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    companyName: row.company_name ? String(row.company_name) : undefined,
    country: row.country ? String(row.country) : undefined,
    city: (row.city as string) ?? null,
    businessUnit: row.business_unit as BusinessUnit | undefined,
    orgType: row.org_type as OrgType | undefined,
    companyQuantumHistory: (row.company_quantum_history as string) ?? null,
    owners: loadOwners(db, id),
    uses: loadUses(db, id),
    sources: loadSources(db, id),
  };
}

export function attachHistory(contact: Contact): Contact {
  const db = getDb();
  return {
    ...contact,
    historyEvents: listHistoryForContact(
      db,
      contact.id,
      contact.companyId,
    ),
  };
}

export type ListFilters = {
  q?: string;
  businessUnit?: string;
  country?: string;
  owner?: string;
  orgType?: string;
  decisionLevel?: string;
  mailStatus?: string;
  use?: string;
  /** con_mail | solo_linkedin | con_linkedin | sin_canales */
  channel?: string;
  companyId?: string;
};

export function listCompanies(filters: ListFilters = {}): Company[] {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, string> = {};

  if (filters.businessUnit && filters.businessUnit !== "all") {
    where.push("c.business_unit = @businessUnit");
    params.businessUnit = filters.businessUnit;
  }
  if (filters.country && filters.country !== "all") {
    where.push("c.country = @country");
    params.country = filters.country;
  }
  if (filters.orgType && filters.orgType !== "all") {
    where.push("c.org_type = @orgType");
    params.orgType = filters.orgType;
  }
  if (filters.q) {
    where.push("(c.name LIKE @q OR c.country LIKE @q OR IFNULL(c.city,'') LIKE @q)");
    params.q = `%${filters.q}%`;
  }
  if (filters.owner && filters.owner !== "all") {
    where.push(`EXISTS (
      SELECT 1 FROM contacts ct
      JOIN contact_owners co ON co.contact_id = ct.id
      WHERE ct.company_id = c.id AND co.owner = @owner
    )`);
    params.owner = filters.owner;
  }

  const sql = `
    SELECT c.*,
      (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id) AS contact_count,
      (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id AND ct.mail_status = 'completo') AS with_email_count
    FROM companies c
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY c.name COLLATE NOCASE
  `;
  return (db.prepare(sql).all(params) as Record<string, unknown>[]).map(
    mapCompany,
  );
}

export function getCompany(id: string): Company | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id) AS contact_count,
        (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id AND ct.mail_status = 'completo') AS with_email_count
       FROM companies c WHERE c.id = ?`,
    )
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapCompany(row) : null;
}

export function upsertCompany(input: {
  id?: string;
  name: string;
  country: string;
  city?: string | null;
  businessUnit: BusinessUnit;
  orgType: OrgType;
  notes?: string | null;
  quantumHistory?: string | null;
}): Company {
  const db = getDb();
  const now = new Date().toISOString();
  const id = input.id || randomUUID();
  const existing = input.id ? getCompany(input.id) : null;

  if (existing) {
    db.prepare(
      `UPDATE companies SET name=@name, country=@country, city=@city,
       business_unit=@businessUnit, org_type=@orgType, notes=@notes,
       quantum_history=@quantumHistory, updated_at=@updatedAt
       WHERE id=@id`,
    ).run({
      id,
      name: input.name.trim(),
      country: input.country.trim(),
      city: input.city?.trim() || null,
      businessUnit: input.businessUnit,
      orgType: input.orgType,
      notes: input.notes?.trim() || null,
      quantumHistory:
        input.quantumHistory !== undefined
          ? input.quantumHistory?.trim() || null
          : existing.quantumHistory,
      updatedAt: now,
    });
    if (input.quantumHistory !== undefined) {
      syncManualHistoryNote(
        db,
        "company",
        id,
        input.quantumHistory,
        now,
      );
    }
  } else {
    db.prepare(
      `INSERT INTO companies (id, name, country, city, business_unit, org_type, notes, quantum_history, created_at, updated_at)
       VALUES (@id, @name, @country, @city, @businessUnit, @orgType, @notes, @quantumHistory, @createdAt, @updatedAt)`,
    ).run({
      id,
      name: input.name.trim(),
      country: input.country.trim(),
      city: input.city?.trim() || null,
      businessUnit: input.businessUnit,
      orgType: input.orgType,
      notes: input.notes?.trim() || null,
      quantumHistory: input.quantumHistory?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }
  return getCompany(id)!;
}

/** Antecedentes SGQ a nivel empresa (trabajos Quantum para la cuenta) */
export function updateCompanySgqHistory(
  companyId: string,
  quantumHistory: string | null,
): Company | null {
  const existing = getCompany(companyId);
  if (!existing) return null;
  return upsertCompany({
    id: existing.id,
    name: existing.name,
    country: existing.country,
    city: existing.city,
    businessUnit: existing.businessUnit,
    orgType: existing.orgType,
    notes: existing.notes,
    quantumHistory,
  });
}

export function findCompanyByNameCountry(
  name: string,
  country: string,
): Company | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM companies WHERE lower(name) = lower(?) AND lower(country) = lower(?)`,
    )
    .get(name.trim(), country.trim()) as Record<string, unknown> | undefined;
  return row ? mapCompany(row) : null;
}

export function listContacts(filters: ListFilters = {}): Contact[] {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, string> = {};

  if (filters.companyId) {
    where.push("ct.company_id = @companyId");
    params.companyId = filters.companyId;
  }
  if (filters.businessUnit && filters.businessUnit !== "all") {
    where.push("c.business_unit = @businessUnit");
    params.businessUnit = filters.businessUnit;
  }
  if (filters.country && filters.country !== "all") {
    where.push("c.country = @country");
    params.country = filters.country;
  }
  if (filters.orgType && filters.orgType !== "all") {
    where.push("c.org_type = @orgType");
    params.orgType = filters.orgType;
  }
  if (filters.decisionLevel && filters.decisionLevel !== "all") {
    where.push("ct.decision_level = @decisionLevel");
    params.decisionLevel = filters.decisionLevel;
  }
  if (filters.mailStatus && filters.mailStatus !== "all") {
    where.push("ct.mail_status = @mailStatus");
    params.mailStatus = filters.mailStatus;
  }
  if (filters.owner && filters.owner !== "all") {
    where.push(
      `EXISTS (SELECT 1 FROM contact_owners co WHERE co.contact_id = ct.id AND co.owner = @owner)`,
    );
    params.owner = filters.owner;
  }
  if (filters.use && filters.use !== "all") {
    where.push(
      `EXISTS (SELECT 1 FROM contact_uses cu WHERE cu.contact_id = ct.id AND cu.use_tag = @use)`,
    );
    params.use = filters.use;
  }
  if (filters.channel && filters.channel !== "all") {
    if (filters.channel === "con_mail") {
      where.push(`IFNULL(ct.email,'') != ''`);
    } else if (filters.channel === "solo_linkedin") {
      where.push(
        `IFNULL(ct.linkedin_url,'') != '' AND IFNULL(ct.email,'') = ''`,
      );
    } else if (filters.channel === "con_linkedin") {
      where.push(`IFNULL(ct.linkedin_url,'') != ''`);
    } else if (filters.channel === "sin_canales") {
      where.push(
        `IFNULL(ct.linkedin_url,'') = '' AND IFNULL(ct.email,'') = ''`,
      );
    }
  }
  if (filters.q) {
    where.push(
      `(ct.full_name LIKE @q OR ct.title LIKE @q OR c.name LIKE @q OR IFNULL(ct.email,'') LIKE @q OR IFNULL(ct.linkedin_url,'') LIKE @q OR c.country LIKE @q)`,
    );
    params.q = `%${filters.q}%`;
  }

  const sql = `
    SELECT ct.*, c.name AS company_name, c.country, c.city, c.business_unit, c.org_type,
      c.quantum_history AS company_quantum_history
    FROM contacts ct
    JOIN companies c ON c.id = ct.company_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY c.name COLLATE NOCASE, ct.full_name COLLATE NOCASE
  `;
  return (db.prepare(sql).all(params) as Record<string, unknown>[]).map((r) =>
    mapContact(db, r),
  );
}

/** Normalize LinkedIn profile URL for dedupe (strip query, trailing slash, lowercase host/path). */
export function normalizeLinkedinUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes("linkedin.com")) return url.trim().toLowerCase();
    const path = u.pathname.replace(/\/+$/, "").toLowerCase();
    return `https://www.linkedin.com${path}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  }
}

export function findContactByLinkedinUrl(
  url: string | null | undefined,
): Contact | null {
  const key = normalizeLinkedinUrl(url);
  if (!key) return null;
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ct.*, c.name AS company_name, c.country, c.city, c.business_unit, c.org_type,
              c.quantum_history AS company_quantum_history
       FROM contacts ct
       JOIN companies c ON c.id = ct.company_id
       WHERE IFNULL(ct.linkedin_url,'') != ''`,
    )
    .all() as Record<string, unknown>[];
  for (const row of rows) {
    if (normalizeLinkedinUrl(String(row.linkedin_url)) === key) {
      return mapContact(db, row);
    }
  }
  return null;
}

export function getContact(id: string): Contact | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT ct.*, c.name AS company_name, c.country, c.city, c.business_unit, c.org_type,
        c.quantum_history AS company_quantum_history
       FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE ct.id = ?`,
    )
    .get(id) as Record<string, unknown> | undefined;
  return row ? attachHistory(mapContact(db, row)) : null;
}

function replaceOwners(
  db: Database.Database,
  contactId: string,
  owners: ProfileOwner[],
) {
  db.prepare(`DELETE FROM contact_owners WHERE contact_id = ?`).run(contactId);
  const ins = db.prepare(
    `INSERT INTO contact_owners (contact_id, owner) VALUES (?, ?)`,
  );
  for (const o of owners) ins.run(contactId, o);
}

function replaceUses(db: Database.Database, contactId: string, uses: UseTag[]) {
  db.prepare(`DELETE FROM contact_uses WHERE contact_id = ?`).run(contactId);
  const ins = db.prepare(
    `INSERT INTO contact_uses (contact_id, use_tag) VALUES (?, ?)`,
  );
  for (const u of uses) ins.run(contactId, u);
}

export function upsertContact(input: {
  id?: string;
  companyId: string;
  fullName: string;
  title?: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  decisionLevel?: DecisionLevel;
  mailStatus?: MailStatus;
  notes?: string | null;
  cvSummary?: string | null;
  quantumHistory?: string | null;
  owners: ProfileOwner[];
  uses?: UseTag[];
  source?: {
    sourceType: SourceType;
    owner?: ProfileOwner | null;
    note?: string | null;
  };
}): Contact {
  const db = getDb();
  const now = new Date().toISOString();
  const id = input.id || randomUUID();
  const email = input.email?.trim() || null;
  const mailStatus =
    input.mailStatus ||
    (email ? "completo" : "pendiente");

  const existing = input.id ? getContact(input.id) : null;

  const tx = db.transaction(() => {
    if (existing) {
      db.prepare(
        `UPDATE contacts SET company_id=@companyId, full_name=@fullName, title=@title,
         email=@email, phone=@phone, linkedin_url=@linkedinUrl, decision_level=@decisionLevel,
         mail_status=@mailStatus, notes=@notes, cv_summary=@cvSummary,
         quantum_history=@quantumHistory, updated_at=@updatedAt WHERE id=@id`,
      ).run({
        id,
        companyId: input.companyId,
        fullName: input.fullName.trim(),
        title: input.title?.trim() || "",
        email,
        phone: input.phone?.trim() || null,
        linkedinUrl: input.linkedinUrl?.trim() || null,
        decisionLevel: input.decisionLevel || existing.decisionLevel,
        mailStatus,
        notes: input.notes?.trim() || null,
        cvSummary:
          input.cvSummary !== undefined
            ? input.cvSummary?.trim() || null
            : existing.cvSummary,
        quantumHistory:
          input.quantumHistory !== undefined
            ? input.quantumHistory?.trim() || null
            : existing.quantumHistory,
        updatedAt: now,
      });
    } else {
      db.prepare(
        `INSERT INTO contacts (id, company_id, full_name, title, email, phone, linkedin_url,
         decision_level, mail_status, notes, cv_summary, quantum_history, created_at, updated_at)
         VALUES (@id, @companyId, @fullName, @title, @email, @phone, @linkedinUrl,
         @decisionLevel, @mailStatus, @notes, @cvSummary, @quantumHistory, @createdAt, @updatedAt)`,
      ).run({
        id,
        companyId: input.companyId,
        fullName: input.fullName.trim(),
        title: input.title?.trim() || "",
        email,
        phone: input.phone?.trim() || null,
        linkedinUrl: input.linkedinUrl?.trim() || null,
        decisionLevel: input.decisionLevel || "desconocido",
        mailStatus,
        notes: input.notes?.trim() || null,
        cvSummary: input.cvSummary?.trim() || null,
        quantumHistory: input.quantumHistory?.trim() || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    replaceOwners(db, id, input.owners.length ? input.owners : ["fernando"]);
    if (input.uses) replaceUses(db, id, input.uses);

    if (input.source) {
      db.prepare(
        `INSERT INTO contact_sources (id, contact_id, source_type, owner, note, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(),
        id,
        input.source.sourceType,
        input.source.owner ?? null,
        input.source.note ?? null,
        now,
      );
    } else if (!existing) {
      db.prepare(
        `INSERT INTO contact_sources (id, contact_id, source_type, owner, note, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(),
        id,
        "manual",
        input.owners[0] ?? null,
        "Alta inicial",
        now,
      );
    }

    if (input.quantumHistory !== undefined) {
      syncManualHistoryNote(
        db,
        "contact",
        id,
        input.quantumHistory,
        now,
      );
    }
    syncContactHistorySignals(db, id);
  });
  tx();
  return getContact(id)!;
}

export function deleteContact(id: string) {
  getDb().prepare(`DELETE FROM contacts WHERE id = ?`).run(id);
}

export function listCountries(): string[] {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT DISTINCT country FROM companies WHERE country != '' ORDER BY country`,
      )
      .all() as { country: string }[]
  ).map((r) => r.country);
}

const CORE_BUSINESSES = [
  "electricidad",
  "gas",
  "agua",
  "generacion",
] as const;

export function getCoverage(): CoverageStats {
  const db = getDb();
  const totals = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM companies) AS companies,
        (SELECT COUNT(*) FROM contacts) AS contacts,
        (SELECT COUNT(*) FROM contacts WHERE mail_status = 'completo') AS withEmail,
        (SELECT COUNT(*) FROM contacts WHERE mail_status = 'pendiente') AS pendingEmail,
        (SELECT COUNT(*) FROM contacts WHERE IFNULL(linkedin_url,'') != '') AS withLinkedin,
        (SELECT COUNT(*) FROM contacts
          WHERE IFNULL(linkedin_url,'') != '' AND IFNULL(email,'') = '') AS linkedinOnly,
        (SELECT COUNT(*) FROM contacts
          WHERE IFNULL(linkedin_url,'') = '' AND IFNULL(email,'') = '') AS noChannel,
        (SELECT COUNT(*) FROM contact_uses WHERE use_tag = 'asociado') AS associates,
        (SELECT COUNT(*) FROM contacts ct
          JOIN contact_uses cu ON cu.contact_id = ct.id AND cu.use_tag = 'asociado'
          WHERE IFNULL(ct.email,'') != '') AS associatesWithEmail,
        (SELECT COUNT(*) FROM contacts WHERE decision_level = 'decisor') AS decisors,
        (SELECT COUNT(*) FROM contacts ct
          JOIN companies c ON c.id = ct.company_id
          WHERE c.org_type = 'regulador'
             OR lower(ct.title) LIKE '%regul%'
             OR lower(ct.title) LIKE '%tarifa%') AS regulationContacts,
        (SELECT COUNT(*) FROM companies
          WHERE org_type = 'regulador') AS regulationCompanies,
        (SELECT COUNT(DISTINCT country) FROM companies WHERE country != '') AS countries`,
    )
    .get() as Record<string, number>;

  const byBusinessUnit = BUSINESS_UNITS.map((key) => {
    const row = db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM companies WHERE business_unit = ?) AS companies,
          (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE c.business_unit = ?) AS contacts,
          (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE c.business_unit = ? AND ct.mail_status = 'completo') AS withEmail`,
      )
      .get(key, key, key) as {
      companies: number;
      contacts: number;
      withEmail: number;
    };
    return {
      key,
      label: BU_LABELS[key],
      companies: row.companies,
      contacts: row.contacts,
      withEmail: row.withEmail,
    };
  });

  const coreBusinesses = CORE_BUSINESSES.map((key) => {
    const row = db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM companies WHERE business_unit = ?) AS companies,
          (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE c.business_unit = ?) AS contacts,
          (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE c.business_unit = ? AND ct.mail_status = 'completo') AS withEmail,
          (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id
            WHERE c.business_unit = ?
              AND (c.org_type = 'regulador'
                OR lower(ct.title) LIKE '%regul%'
                OR lower(ct.title) LIKE '%tarifa%')) AS regulationContacts`,
      )
      .get(key, key, key, key) as {
      companies: number;
      contacts: number;
      withEmail: number;
      regulationContacts: number;
    };
    return {
      key,
      label: BU_LABELS[key],
      companies: row.companies,
      contacts: row.contacts,
      withEmail: row.withEmail,
      regulationContacts: row.regulationContacts,
    };
  });

  const byOwner = OWNERS.map((key) => {
    const row = db
      .prepare(
        `SELECT
          (SELECT COUNT(DISTINCT co.contact_id) FROM contact_owners co WHERE co.owner = ?) AS contacts,
          (SELECT COUNT(DISTINCT co.contact_id) FROM contact_owners co
            JOIN contacts ct ON ct.id = co.contact_id
            WHERE co.owner = ? AND ct.mail_status = 'completo') AS withEmail,
          (SELECT COUNT(DISTINCT ct.company_id) FROM contact_owners co
            JOIN contacts ct ON ct.id = co.contact_id WHERE co.owner = ?) AS companies`,
      )
      .get(key, key, key) as {
      contacts: number;
      withEmail: number;
      companies: number;
    };
    return {
      key,
      label: OWNER_LABELS[key],
      contacts: row.contacts,
      withEmail: row.withEmail,
      companies: row.companies,
    };
  });

  const byCountry = db
    .prepare(
      `SELECT c.country AS key,
        COUNT(DISTINCT c.id) AS companies,
        COUNT(ct.id) AS contacts
       FROM companies c
       LEFT JOIN contacts ct ON ct.company_id = c.id
       WHERE c.country != ''
       GROUP BY c.country
       ORDER BY contacts DESC, companies DESC
       LIMIT 12`,
    )
    .all() as { key: string; companies: number; contacts: number }[];

  const byOrgType = ORG_TYPES.map((key) => {
    const row = db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM companies WHERE org_type = ?) AS companies,
          (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE c.org_type = ?) AS contacts`,
      )
      .get(key, key) as { companies: number; contacts: number };
    return {
      key: key as OrgType,
      label: ORG_LABELS[key],
      companies: row.companies,
      contacts: row.contacts,
    };
  }).filter((r) => r.companies > 0 || r.contacts > 0);

  const gaps: CoverageStats["gaps"] = [];
  for (const bu of coreBusinesses) {
    if (bu.companies === 0) {
      gaps.push({ label: bu.label, detail: "Sin cuentas registradas" });
    } else if (bu.regulationContacts === 0) {
      gaps.push({
        label: bu.label,
        detail: "Sin contactos de regulación identificados",
      });
    }
  }

  return {
    totals: {
      companies: totals.companies,
      contacts: totals.contacts,
      withEmail: totals.withEmail,
      pendingEmail: totals.pendingEmail,
      withLinkedin: totals.withLinkedin ?? 0,
      linkedinOnly: totals.linkedinOnly ?? 0,
      noChannel: totals.noChannel ?? 0,
      associates: totals.associates ?? 0,
      associatesWithEmail: totals.associatesWithEmail ?? 0,
      decisors: totals.decisors,
      regulationContacts: totals.regulationContacts,
      regulationCompanies: totals.regulationCompanies,
      countries: totals.countries,
    },
    coreBusinesses,
    byBusinessUnit,
    byOwner,
    byCountry,
    byOrgType,
    gaps,
  };
}

export function resetDemo() {
  const db = getDb();
  db.exec(`
    DELETE FROM contact_sources;
    DELETE FROM contact_uses;
    DELETE FROM contact_owners;
    DELETE FROM contacts;
    DELETE FROM companies;
  `);
  seedIfEmpty(db);
}
