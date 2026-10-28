export const BUSINESS_UNITS = [
  "electricidad",
  "gas",
  "agua",
  "generacion",
  "nuevos_negocios",
  "transversal",
] as const;

export type BusinessUnit = (typeof BUSINESS_UNITS)[number];

export const ORG_TYPES = [
  "distribuidora",
  "transportista",
  "generadora",
  "regulador",
  "gobierno",
  "asociacion",
  "consultora",
  "otro",
] as const;

export type OrgType = (typeof ORG_TYPES)[number];

export const OWNERS = ["fernando", "elias", "cesar", "laura"] as const;
export type ProfileOwner = (typeof OWNERS)[number];

export const DECISION_LEVELS = [
  "decisor",
  "influenciador",
  "tecnico",
  "operativo",
  "desconocido",
] as const;

export type DecisionLevel = (typeof DECISION_LEVELS)[number];

export const USE_TAGS = [
  "licitacion",
  "seminario",
  "benchmarking",
  "campana",
  "asociado",
] as const;

export type UseTag = (typeof USE_TAGS)[number];

export const SOURCE_TYPES = [
  "sales_navigator",
  "linkedin_export",
  "manual",
  "asociados",
  "validacion_gn",
  "otro",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const MAIL_STATUSES = [
  "completo",
  "pendiente",
  "no_aplica",
] as const;

export type MailStatus = (typeof MAIL_STATUSES)[number];

/** Etiquetas de sector (antes “BU”) — lenguaje de consultor Quantum */
export const BU_LABELS: Record<BusinessUnit, string> = {
  electricidad: "Electricidad",
  gas: "Gas",
  agua: "Agua y saneamiento",
  generacion: "Generación eléctrica",
  nuevos_negocios: "Nuevos negocios · residuos sólidos",
  transversal: "Transversal / multi-sector",
};

export const ORG_LABELS: Record<OrgType, string> = {
  distribuidora: "Distribuidora",
  transportista: "Transportista",
  generadora: "Generadora",
  regulador: "Ente regulador",
  gobierno: "Gobierno / ministerio",
  asociacion: "Asociación / cámara",
  consultora: "Consultora / peer",
  otro: "Otro",
};

export const OWNER_LABELS: Record<ProfileOwner, string> = {
  fernando: "Fernando (GG)",
  elias: "Elías (Electricidad)",
  cesar: "César (Gas)",
  laura: "Laura (Administración)",
};

export const DECISION_LABELS: Record<DecisionLevel, string> = {
  decisor: "Decisor",
  influenciador: "Influenciador",
  tecnico: "Técnico clave",
  operativo: "Operativo",
  desconocido: "Por clasificar",
};

export const USE_LABELS: Record<UseTag, string> = {
  licitacion: "Licitación",
  seminario: "Seminario",
  benchmarking: "Benchmarking",
  campana: "Campaña",
  asociado: "Potencial socio",
};

/** Cómo contactar: LinkedIn (cercano) vs mail (campañas Quantum) */
export const CHANNELS = [
  "all",
  "con_mail",
  "solo_linkedin",
  "con_linkedin",
  "sin_canales",
] as const;

export type ChannelFilter = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<ChannelFilter, string> = {
  all: "LinkedIn o mail",
  con_mail: "Con mail (campañas)",
  solo_linkedin: "Solo LinkedIn (sin mail)",
  con_linkedin: "Con LinkedIn",
  sin_canales: "Sin LinkedIn ni mail",
};

export const SOURCE_LABELS: Record<SourceType, string> = {
  sales_navigator: "Sales Navigator",
  linkedin_export: "Export LinkedIn",
  manual: "Carga manual",
  asociados: "Asociados / cámaras",
  validacion_gn: "Validado por GN",
  otro: "Otro",
};

export const MAIL_LABELS: Record<MailStatus, string> = {
  completo: "Con mail",
  pendiente: "Pendiente enriquecer",
  no_aplica: "Sin mail / N/A",
};

export interface Company {
  id: string;
  name: string;
  country: string;
  city: string | null;
  businessUnit: BusinessUnit;
  orgType: OrgType;
  notes: string | null;
  /** Antecedentes organizacionales desde SGQ: trabajos Quantum para esta empresa */
  quantumHistory: string | null;
  createdAt: string;
  updatedAt: string;
  contactCount?: number;
  withEmailCount?: number;
}

export interface Contact {
  id: string;
  companyId: string;
  fullName: string;
  title: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  decisionLevel: DecisionLevel;
  mailStatus: MailStatus;
  notes: string | null;
  /** Resumen CV: dónde trabajó, qué hace (sobre todo potenciales socios) */
  cvSummary: string | null;
  /** Nota libre sobre la persona (no reemplaza antecedentes SGQ de la empresa) */
  quantumHistory: string | null;
  createdAt: string;
  updatedAt: string;
  companyName?: string;
  country?: string;
  city?: string | null;
  businessUnit?: BusinessUnit;
  orgType?: OrgType;
  companyQuantumHistory?: string | null;
  owners: ProfileOwner[];
  uses: UseTag[];
  sources: ContactSource[];
  /** Timeline vinculada a imports, tags y notas */
  historyEvents?: QuantumHistoryEvent[];
}

export interface ContactSource {
  id: string;
  contactId: string;
  sourceType: SourceType;
  owner: ProfileOwner | null;
  note: string | null;
  recordedAt: string;
}

/** Eventos de relación Quantum ↔ persona/empresa, vinculados a fuentes reales */
export const HISTORY_EVENT_KINDS = [
  "base_import",
  "linkedin_connection",
  "tagged_licitacion",
  "tagged_asociado",
  "tagged_seminario",
  "tagged_campana",
  "tagged_benchmarking",
  "manual_note",
  "company_presence",
] as const;

export type HistoryEventKind = (typeof HISTORY_EVENT_KINDS)[number];

export const HISTORY_KIND_LABELS: Record<HistoryEventKind, string> = {
  base_import: "Ingreso a la base",
  linkedin_connection: "Conexión LinkedIn",
  tagged_licitacion: "Señal · licitaciones",
  tagged_asociado: "Potencial socio",
  tagged_seminario: "Señal · seminario",
  tagged_campana: "Señal · campaña",
  tagged_benchmarking: "Señal · benchmarking",
  manual_note: "Nota de historial",
  company_presence: "Presencia en base",
};

export interface QuantumHistoryEvent {
  id: string;
  subjectType: "contact" | "company";
  subjectId: string;
  eventKind: HistoryEventKind;
  title: string;
  detail: string | null;
  sourceSystem: string;
  sourceRef: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface CoverageStats {
  totals: {
    companies: number;
    contacts: number;
    withEmail: number;
    pendingEmail: number;
    withLinkedin: number;
    linkedinOnly: number;
    noChannel: number;
    associates: number;
    associatesWithEmail: number;
    decisors: number;
    regulationContacts: number;
    regulationCompanies: number;
    countries: number;
  };
  /** Electricidad, gas, agua, generación — los 4 negocios principales */
  coreBusinesses: {
    key: BusinessUnit;
    label: string;
    companies: number;
    contacts: number;
    withEmail: number;
    regulationContacts: number;
  }[];
  byBusinessUnit: {
    key: BusinessUnit;
    label: string;
    companies: number;
    contacts: number;
    withEmail: number;
  }[];
  byOwner: {
    key: ProfileOwner;
    label: string;
    contacts: number;
    withEmail: number;
    companies: number;
  }[];
  byCountry: { key: string; companies: number; contacts: number }[];
  byOrgType: { key: OrgType; label: string; companies: number; contacts: number }[];
  gaps: { label: string; detail: string }[];
}
