import type { BusinessUnit, OrgType, ProfileOwner, UseTag, SourceType, DecisionLevel, MailStatus } from "./types";

type SeedCompany = {
  id: string;
  name: string;
  country: string;
  city: string | null;
  businessUnit: BusinessUnit;
  orgType: OrgType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type SeedContact = {
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
  createdAt: string;
  updatedAt: string;
  owners: ProfileOwner[];
  uses: UseTag[];
  sources: {
    id: string;
    sourceType: SourceType;
    owner: ProfileOwner | null;
    note: string | null;
    recordedAt: string;
  }[];
};

export const SEED_COMPANIES: SeedCompany[] = [
  {
    id: "co-edenor",
    name: "Edenor",
    country: "Argentina",
    city: "Buenos Aires",
    businessUnit: "electricidad",
    orgType: "distribuidora",
    notes: null,
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "co-enre",
    name: "ENRE",
    country: "Argentina",
    city: "Buenos Aires",
    businessUnit: "electricidad",
    orgType: "regulador",
    notes: null,
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "co-metrogas",
    name: "Metrogas",
    country: "Argentina",
    city: "Buenos Aires",
    businessUnit: "gas",
    orgType: "distribuidora",
    notes: null,
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "co-enargas",
    name: "ENARGAS",
    country: "Argentina",
    city: "Buenos Aires",
    businessUnit: "gas",
    orgType: "regulador",
    notes: null,
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "co-aysa",
    name: "AySA",
    country: "Argentina",
    city: "Buenos Aires",
    businessUnit: "agua",
    orgType: "distribuidora",
    notes: null,
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "co-ypfluz",
    name: "YPF Luz",
    country: "Argentina",
    city: "Buenos Aires",
    businessUnit: "generacion",
    orgType: "generadora",
    notes: null,
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "co-ceamse",
    name: "CEAMSE",
    country: "Argentina",
    city: "Buenos Aires",
    businessUnit: "nuevos_negocios",
    orgType: "otro",
    notes: "Residuos sólidos — semilla nuevos negocios",
    createdAt: "2025-09-01T10:00:00.000Z",
    updatedAt: "2025-09-01T10:00:00.000Z",
  },
  {
    id: "co-adeera",
    name: "ADEERA",
    country: "Argentina",
    city: "Buenos Aires",
    businessUnit: "electricidad",
    orgType: "asociacion",
    notes: null,
    createdAt: "2025-06-01T10:00:00.000Z",
    updatedAt: "2025-06-01T10:00:00.000Z",
  },
  {
    id: "co-aneel",
    name: "ANEEL",
    country: "Brasil",
    city: "Brasília",
    businessUnit: "electricidad",
    orgType: "regulador",
    notes: null,
    createdAt: "2025-01-20T10:00:00.000Z",
    updatedAt: "2025-01-20T10:00:00.000Z",
  },
  {
    id: "co-osinergmin",
    name: "OSINERGMIN",
    country: "Perú",
    city: "Lima",
    businessUnit: "transversal",
    orgType: "regulador",
    notes: null,
    createdAt: "2025-07-01T10:00:00.000Z",
    updatedAt: "2025-07-01T10:00:00.000Z",
  },
];

export const SEED_CONTACTS: SeedContact[] = [
  {
    id: "ct-1",
    companyId: "co-edenor",
    fullName: "María Eugenia Roldán",
    title: "Gerente de Regulación",
    email: "m.roldan@ejemplo-edenor.com",
    phone: null,
    linkedinUrl: "https://linkedin.com/in/ejemplo-roldan",
    decisionLevel: "decisor",
    mailStatus: "completo",
    notes: null,
    createdAt: "2025-03-12T10:00:00.000Z",
    updatedAt: "2025-03-12T10:00:00.000Z",
    owners: ["elias", "fernando"],
    uses: ["licitacion", "seminario"],
    sources: [
      {
        id: "src-1",
        sourceType: "sales_navigator",
        owner: "elias",
        note: "Búsqueda decisores distribución AR",
        recordedAt: "2025-03-12T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-2",
    companyId: "co-enre",
    fullName: "Ricardo Palacios",
    title: "Director de Planificación",
    email: null,
    phone: null,
    linkedinUrl: null,
    decisionLevel: "influenciador",
    mailStatus: "pendiente",
    notes: "Prioridad enriquecer mail para seminario",
    createdAt: "2025-04-02T10:00:00.000Z",
    updatedAt: "2025-04-02T10:00:00.000Z",
    owners: ["elias"],
    uses: ["benchmarking", "seminario"],
    sources: [
      {
        id: "src-2",
        sourceType: "sales_navigator",
        owner: "elias",
        note: null,
        recordedAt: "2025-04-02T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-3",
    companyId: "co-metrogas",
    fullName: "Claudia Méndez",
    title: "Jefa de Tarifas",
    email: "c.mendez@ejemplo-metrogas.com",
    phone: "+54 11 4000-0000",
    linkedinUrl: null,
    decisionLevel: "decisor",
    mailStatus: "completo",
    notes: null,
    createdAt: "2025-02-18T10:00:00.000Z",
    updatedAt: "2025-02-18T10:00:00.000Z",
    owners: ["cesar"],
    uses: ["licitacion", "benchmarking", "campana"],
    sources: [
      {
        id: "src-3",
        sourceType: "sales_navigator",
        owner: "cesar",
        note: null,
        recordedAt: "2025-02-18T10:00:00.000Z",
      },
      {
        id: "src-3b",
        sourceType: "manual",
        owner: null,
        note: "Mail completado en enriquecimiento semanal",
        recordedAt: "2025-08-01T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-4",
    companyId: "co-enargas",
    fullName: "Sofía Benítez",
    title: "Directora de Estudios",
    email: null,
    phone: null,
    linkedinUrl: null,
    decisionLevel: "decisor",
    mailStatus: "pendiente",
    notes: null,
    createdAt: "2025-03-28T10:00:00.000Z",
    updatedAt: "2025-03-28T10:00:00.000Z",
    owners: ["cesar"],
    uses: ["benchmarking", "seminario"],
    sources: [
      {
        id: "src-4",
        sourceType: "sales_navigator",
        owner: "cesar",
        note: null,
        recordedAt: "2025-03-28T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-5",
    companyId: "co-aysa",
    fullName: "Hernán Quiroga",
    title: "CFO",
    email: "h.quiroga@ejemplo-aysa.com",
    phone: null,
    linkedinUrl: null,
    decisionLevel: "decisor",
    mailStatus: "completo",
    notes: null,
    createdAt: "2025-08-03T10:00:00.000Z",
    updatedAt: "2025-08-03T10:00:00.000Z",
    owners: ["laura", "fernando"],
    uses: ["licitacion", "benchmarking"],
    sources: [
      {
        id: "src-5",
        sourceType: "manual",
        owner: "laura",
        note: "Base Laura — cobertura admin/institucional",
        recordedAt: "2025-08-03T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-6",
    companyId: "co-ypfluz",
    fullName: "Rodrigo Salas",
    title: "Gerente de Desarrollo de Negocios",
    email: null,
    phone: null,
    linkedinUrl: null,
    decisionLevel: "influenciador",
    mailStatus: "pendiente",
    notes: null,
    createdAt: "2025-09-20T10:00:00.000Z",
    updatedAt: "2025-09-20T10:00:00.000Z",
    owners: ["elias"],
    uses: ["licitacion"],
    sources: [
      {
        id: "src-6",
        sourceType: "sales_navigator",
        owner: "elias",
        note: null,
        recordedAt: "2025-09-20T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-7",
    companyId: "co-ceamse",
    fullName: "Laura Domínguez",
    title: "Gerente de Planificación",
    email: null,
    phone: null,
    linkedinUrl: null,
    decisionLevel: "decisor",
    mailStatus: "pendiente",
    notes: "Semilla nuevos negocios / residuos",
    createdAt: "2025-09-15T10:00:00.000Z",
    updatedAt: "2025-09-15T10:00:00.000Z",
    owners: ["fernando"],
    uses: ["licitacion"],
    sources: [
      {
        id: "src-7",
        sourceType: "manual",
        owner: "fernando",
        note: "Exploración nuevos negocios",
        recordedAt: "2025-09-15T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-8",
    companyId: "co-adeera",
    fullName: "Patricia Álvarez",
    title: "Secretaria Ejecutiva",
    email: null,
    phone: null,
    linkedinUrl: null,
    decisionLevel: "influenciador",
    mailStatus: "pendiente",
    notes: "Búsqueda asociados con César",
    createdAt: "2025-06-21T10:00:00.000Z",
    updatedAt: "2025-06-21T10:00:00.000Z",
    owners: ["cesar", "elias"],
    uses: ["asociado", "seminario"],
    sources: [
      {
        id: "src-8",
        sourceType: "asociados",
        owner: "cesar",
        note: "Listado asociados",
        recordedAt: "2025-06-21T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-9",
    companyId: "co-aneel",
    fullName: "João Batista Silva",
    title: "Superintendente de Regulação",
    email: null,
    phone: null,
    linkedinUrl: null,
    decisionLevel: "decisor",
    mailStatus: "pendiente",
    notes: null,
    createdAt: "2025-01-30T10:00:00.000Z",
    updatedAt: "2025-01-30T10:00:00.000Z",
    owners: ["fernando", "elias"],
    uses: ["seminario", "benchmarking"],
    sources: [
      {
        id: "src-9",
        sourceType: "sales_navigator",
        owner: "fernando",
        note: null,
        recordedAt: "2025-01-30T10:00:00.000Z",
      },
    ],
  },
  {
    id: "ct-10",
    companyId: "co-osinergmin",
    fullName: "Lucía Vargas",
    title: "Gerente Comercial Regulatoria",
    email: "l.vargas@ejemplo-osinergmin.pe",
    phone: null,
    linkedinUrl: null,
    decisionLevel: "influenciador",
    mailStatus: "completo",
    notes: null,
    createdAt: "2025-07-14T10:00:00.000Z",
    updatedAt: "2025-07-14T10:00:00.000Z",
    owners: ["fernando"],
    uses: ["seminario", "campana"],
    sources: [
      {
        id: "src-10",
        sourceType: "linkedin_export",
        owner: "fernando",
        note: null,
        recordedAt: "2025-07-14T10:00:00.000Z",
      },
    ],
  },
];
