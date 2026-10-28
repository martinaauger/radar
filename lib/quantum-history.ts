import { randomUUID } from "crypto";
import type Database from "better-sqlite3";
import type {
  HistoryEventKind,
  ProfileOwner,
  QuantumHistoryEvent,
  SourceType,
  UseTag,
} from "./types";
import { HISTORY_KIND_LABELS, OWNER_LABELS, SOURCE_LABELS } from "./types";

export function ensureHistorySchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS quantum_history_events (
      id TEXT PRIMARY KEY,
      subject_type TEXT NOT NULL CHECK (subject_type IN ('contact', 'company')),
      subject_id TEXT NOT NULL,
      event_kind TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT,
      source_system TEXT NOT NULL,
      source_ref TEXT,
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (subject_type, subject_id, source_system, source_ref)
    );
    CREATE INDEX IF NOT EXISTS idx_qhe_subject
      ON quantum_history_events(subject_type, subject_id, occurred_at DESC);
  `);
}

function mapEvent(row: Record<string, unknown>): QuantumHistoryEvent {
  return {
    id: String(row.id),
    subjectType: row.subject_type as "contact" | "company",
    subjectId: String(row.subject_id),
    eventKind: row.event_kind as HistoryEventKind,
    title: String(row.title),
    detail: (row.detail as string) ?? null,
    sourceSystem: String(row.source_system),
    sourceRef: (row.source_ref as string) ?? null,
    occurredAt: String(row.occurred_at),
    createdAt: String(row.created_at),
  };
}

function upsertEvent(
  db: Database.Database,
  input: {
    subjectType: "contact" | "company";
    subjectId: string;
    eventKind: HistoryEventKind;
    title: string;
    detail?: string | null;
    sourceSystem: string;
    sourceRef: string;
    occurredAt: string;
  },
) {
  const existing = db
    .prepare(
      `SELECT id FROM quantum_history_events
       WHERE subject_type = ? AND subject_id = ? AND source_system = ? AND source_ref = ?`,
    )
    .get(
      input.subjectType,
      input.subjectId,
      input.sourceSystem,
      input.sourceRef,
    ) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE quantum_history_events
       SET event_kind = ?, title = ?, detail = ?, occurred_at = ?
       WHERE id = ?`,
    ).run(
      input.eventKind,
      input.title,
      input.detail ?? null,
      input.occurredAt,
      existing.id,
    );
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO quantum_history_events
     (id, subject_type, subject_id, event_kind, title, detail, source_system, source_ref, occurred_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    input.subjectType,
    input.subjectId,
    input.eventKind,
    input.title,
    input.detail ?? null,
    input.sourceSystem,
    input.sourceRef,
    input.occurredAt,
    now,
  );
}

function kindFromSource(sourceType: SourceType): HistoryEventKind {
  return sourceType === "linkedin_export"
    ? "linkedin_connection"
    : "base_import";
}

function titleFromSource(sourceType: SourceType): string {
  if (sourceType === "linkedin_export") return "Conexión LinkedIn";
  if (sourceType === "sales_navigator") return "Ingreso Sales Navigator";
  if (sourceType === "asociados") return "Ingreso vía asociados / cámaras";
  return "Ingreso a la base Quantum";
}

function kindFromUse(use: UseTag): HistoryEventKind | null {
  switch (use) {
    case "licitacion":
      return "tagged_licitacion";
    case "asociado":
      return "tagged_asociado";
    case "seminario":
      return "tagged_seminario";
    case "campana":
      return "tagged_campana";
    case "benchmarking":
      return "tagged_benchmarking";
    default:
      return null;
  }
}

function titleFromUse(use: UseTag): string {
  const kind = kindFromUse(use);
  return kind ? HISTORY_KIND_LABELS[kind] : use;
}

/** Reconstruye eventos desde contact_sources + contact_uses (+ rollup empresa) */
export function syncAllHistoryFromSignals(db: Database.Database) {
  const sources = db
    .prepare(
      `SELECT id, contact_id, source_type, owner, note, recorded_at
       FROM contact_sources`,
    )
    .all() as Record<string, unknown>[];

  for (const s of sources) {
    const sourceType = s.source_type as SourceType;
    const owner = s.owner as ProfileOwner | null;
    const ownerLabel = owner ? OWNER_LABELS[owner] : null;
    const note = (s.note as string) || null;
    const detailParts = [
      SOURCE_LABELS[sourceType] || sourceType,
      ownerLabel ? `Perfil: ${ownerLabel}` : null,
      note,
    ].filter(Boolean);

    upsertEvent(db, {
      subjectType: "contact",
      subjectId: String(s.contact_id),
      eventKind: kindFromSource(sourceType),
      title: titleFromSource(sourceType),
      detail: detailParts.join(" · "),
      sourceSystem: "contact_sources",
      sourceRef: String(s.id),
      occurredAt: String(s.recorded_at),
    });
  }

  const uses = db
    .prepare(
      `SELECT cu.contact_id, cu.use_tag, ct.updated_at
       FROM contact_uses cu
       JOIN contacts ct ON ct.id = cu.contact_id`,
    )
    .all() as { contact_id: string; use_tag: UseTag; updated_at: string }[];

  for (const u of uses) {
    const kind = kindFromUse(u.use_tag);
    if (!kind) continue;
    upsertEvent(db, {
      subjectType: "contact",
      subjectId: u.contact_id,
      eventKind: kind,
      title: titleFromUse(u.use_tag),
      detail: `Etiqueta comercial en directorio Radar`,
      sourceSystem: "contact_uses",
      sourceRef: `${u.contact_id}:${u.use_tag}`,
      occurredAt: u.updated_at,
    });
  }

  // Notas libres ya guardadas en quantum_history
  const notes = db
    .prepare(
      `SELECT id, quantum_history, updated_at FROM contacts
       WHERE IFNULL(quantum_history, '') != ''`,
    )
    .all() as { id: string; quantum_history: string; updated_at: string }[];
  for (const n of notes) {
    upsertEvent(db, {
      subjectType: "contact",
      subjectId: n.id,
      eventKind: "manual_note",
      title: "Nota de historial",
      detail: n.quantum_history,
      sourceSystem: "contact_quantum_history",
      sourceRef: n.id,
      occurredAt: n.updated_at,
    });
  }

  const companyNotes = db
    .prepare(
      `SELECT id, quantum_history, updated_at FROM companies
       WHERE IFNULL(quantum_history, '') != ''`,
    )
    .all() as { id: string; quantum_history: string; updated_at: string }[];
  for (const n of companyNotes) {
    upsertEvent(db, {
      subjectType: "company",
      subjectId: n.id,
      eventKind: "manual_note",
      title: "Nota de historial (empresa)",
      detail: n.quantum_history,
      sourceSystem: "company_quantum_history",
      sourceRef: n.id,
      occurredAt: n.updated_at,
    });
  }

  // Rollup por empresa: presencia según origen de sus contactos
  const companyPresence = db
    .prepare(
      `SELECT c.id AS company_id,
              cs.source_type,
              COUNT(DISTINCT ct.id) AS n,
              MIN(cs.recorded_at) AS first_at
       FROM companies c
       JOIN contacts ct ON ct.company_id = c.id
       JOIN contact_sources cs ON cs.contact_id = ct.id
       GROUP BY c.id, cs.source_type`,
    )
    .all() as {
    company_id: string;
    source_type: SourceType;
    n: number;
    first_at: string;
  }[];

  for (const row of companyPresence) {
    const label =
      row.source_type === "linkedin_export"
        ? "Contactos vía LinkedIn"
        : row.source_type === "manual"
          ? "Presente en base Laura / carga manual"
          : `Presente vía ${SOURCE_LABELS[row.source_type] || row.source_type}`;
    upsertEvent(db, {
      subjectType: "company",
      subjectId: row.company_id,
      eventKind: "company_presence",
      title: label,
      detail: `${row.n} contacto${row.n === 1 ? "" : "s"} en el directorio`,
      sourceSystem: "company_source_rollup",
      sourceRef: `${row.company_id}:${row.source_type}`,
      occurredAt: row.first_at,
    });
  }
}

export function syncContactHistorySignals(
  db: Database.Database,
  contactId: string,
) {
  const sources = db
    .prepare(
      `SELECT id, contact_id, source_type, owner, note, recorded_at
       FROM contact_sources WHERE contact_id = ?`,
    )
    .all(contactId) as Record<string, unknown>[];

  for (const s of sources) {
    const sourceType = s.source_type as SourceType;
    const owner = s.owner as ProfileOwner | null;
    upsertEvent(db, {
      subjectType: "contact",
      subjectId: contactId,
      eventKind: kindFromSource(sourceType),
      title: titleFromSource(sourceType),
      detail: [
        SOURCE_LABELS[sourceType] || sourceType,
        owner ? `Perfil: ${OWNER_LABELS[owner]}` : null,
        (s.note as string) || null,
      ]
        .filter(Boolean)
        .join(" · "),
      sourceSystem: "contact_sources",
      sourceRef: String(s.id),
      occurredAt: String(s.recorded_at),
    });
  }

  const uses = db
    .prepare(
      `SELECT cu.use_tag, ct.updated_at, ct.company_id
       FROM contact_uses cu
       JOIN contacts ct ON ct.id = cu.contact_id
       WHERE cu.contact_id = ?`,
    )
    .all(contactId) as {
    use_tag: UseTag;
    updated_at: string;
    company_id: string;
  }[];

  for (const u of uses) {
    const kind = kindFromUse(u.use_tag);
    if (!kind) continue;
    upsertEvent(db, {
      subjectType: "contact",
      subjectId: contactId,
      eventKind: kind,
      title: titleFromUse(u.use_tag),
      detail: `Etiqueta comercial en directorio Radar`,
      sourceSystem: "contact_uses",
      sourceRef: `${contactId}:${u.use_tag}`,
      occurredAt: u.updated_at,
    });
  }

  // refresh company rollup for this contact's company
  const companyId = db
    .prepare(`SELECT company_id FROM contacts WHERE id = ?`)
    .get(contactId) as { company_id: string } | undefined;
  if (companyId) {
    const rows = db
      .prepare(
        `SELECT cs.source_type, COUNT(DISTINCT ct.id) AS n, MIN(cs.recorded_at) AS first_at
         FROM contacts ct
         JOIN contact_sources cs ON cs.contact_id = ct.id
         WHERE ct.company_id = ?
         GROUP BY cs.source_type`,
      )
      .all(companyId.company_id) as {
      source_type: SourceType;
      n: number;
      first_at: string;
    }[];
    for (const row of rows) {
      const label =
        row.source_type === "linkedin_export"
          ? "Contactos vía LinkedIn"
          : row.source_type === "manual"
            ? "Presente en base Laura / carga manual"
            : `Presente vía ${SOURCE_LABELS[row.source_type] || row.source_type}`;
      upsertEvent(db, {
        subjectType: "company",
        subjectId: companyId.company_id,
        eventKind: "company_presence",
        title: label,
        detail: `${row.n} contacto${row.n === 1 ? "" : "s"} en el directorio`,
        sourceSystem: "company_source_rollup",
        sourceRef: `${companyId.company_id}:${row.source_type}`,
        occurredAt: row.first_at,
      });
    }
  }
}

export function syncManualHistoryNote(
  db: Database.Database,
  subjectType: "contact" | "company",
  subjectId: string,
  text: string | null,
  occurredAt: string,
) {
  const trimmed = text?.trim() || "";
  if (!trimmed) {
    db.prepare(
      `DELETE FROM quantum_history_events
       WHERE subject_type = ? AND subject_id = ?
         AND source_system = ? AND source_ref = ?`,
    ).run(
      subjectType,
      subjectId,
      subjectType === "contact"
        ? "contact_quantum_history"
        : "company_quantum_history",
      subjectId,
    );
    return;
  }
  upsertEvent(db, {
    subjectType,
    subjectId,
    eventKind: "manual_note",
    title:
      subjectType === "company"
        ? "Nota de historial (empresa)"
        : "Nota de historial",
    detail: trimmed,
    sourceSystem:
      subjectType === "contact"
        ? "contact_quantum_history"
        : "company_quantum_history",
    sourceRef: subjectId,
    occurredAt,
  });
}

export function listHistoryForContact(
  db: Database.Database,
  contactId: string,
  companyId: string,
): QuantumHistoryEvent[] {
  const rows = db
    .prepare(
      `SELECT * FROM quantum_history_events
       WHERE (subject_type = 'contact' AND subject_id = ?)
          OR (subject_type = 'company' AND subject_id = ?)
       ORDER BY occurred_at DESC, created_at DESC`,
    )
    .all(contactId, companyId) as Record<string, unknown>[];
  return rows.map(mapEvent);
}
