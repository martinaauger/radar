"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useViewMode } from "@/components/view-mode";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CSV_TEMPLATE } from "@/lib/csv-template";
import {
  OWNER_LABELS,
  OWNERS,
  SOURCE_LABELS,
  type CoverageStats,
  type ProfileOwner,
  type SourceType,
} from "@/lib/types";
import { Download, Upload } from "lucide-react";

const PROFILE_HINTS: Record<ProfileOwner, string> = {
  fernando: "GG — Connections / Sales Nav general",
  elias: "Electricidad — export del perfil de Elías",
  cesar: "Gas — export del perfil de César",
  laura: "Administración — base clasificada (Excel/CSV)",
};

type ImportResponse = {
  imported?: number;
  merged?: number;
  companiesCreated?: number;
  errors?: string[];
  owner?: ProfileOwner;
  sourceType?: SourceType;
  error?: string;
  detected?: {
    format?: string;
    label?: string;
    owner?: ProfileOwner | null;
    sourceType?: SourceType;
    rowCount?: number;
    ownerConfidence?: string;
  };
  coverage?: {
    byOwner: CoverageStats["byOwner"];
    forOwner: CoverageStats["byOwner"][number] | null;
  };
};

export function ImportView() {
  const { mode, setMode } = useViewMode();
  const [owner, setOwner] = useState<ProfileOwner>("laura");
  const [sourceType, setSourceType] = useState<SourceType>("manual");
  const [forceManual, setForceManual] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [detectedLine, setDetectedLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coverage, setCoverage] = useState<CoverageStats | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function refreshCoverage() {
    fetch("/api/coverage")
      .then((r) => r.json())
      .then(setCoverage)
      .catch(() => {});
  }

  useEffect(() => {
    refreshCoverage();
  }, []);

  // /importar es solo operativa: entrar a la ruta activa la vista.
  useEffect(() => {
    if (mode !== "operativa") setMode("operativa");
  }, [mode, setMode]);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    setDetectedLine(null);
    try {
      const csv = await file.text();
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv,
          filename: file.name,
          owners: [owner],
          sourceType,
          forceManual,
        }),
      });
      const data = (await res.json()) as ImportResponse;
      if (!res.ok) {
        if (data.detected?.label) {
          setDetectedLine(
            `Detectado: ${data.detected.label}` +
              (data.detected.rowCount != null
                ? ` · ${data.detected.rowCount} filas`
                : ""),
          );
        }
        setError(data.error || "Error al importar");
        return;
      }

      const usedOwner = data.owner ?? owner;
      const usedSource = data.sourceType ?? sourceType;
      setOwner(usedOwner);
      setSourceType(usedSource);
      setDetectedLine(
        `Identificado: ${OWNER_LABELS[usedOwner]} · ${SOURCE_LABELS[usedSource]}` +
          (data.detected?.label ? ` (${data.detected.label})` : "") +
          (data.detected?.rowCount != null
            ? ` · ${data.detected.rowCount} filas`
            : ""),
      );

      const forOwner = data.coverage?.forOwner;
      setResult(
        `${OWNER_LABELS[usedOwner]}: ${data.imported ?? 0} importados` +
          (data.merged ? ` · ${data.merged} mergeados por LinkedIn` : "") +
          ` · ${data.companiesCreated ?? 0} empresas nuevas` +
          (data.errors?.length
            ? ` · ${data.errors.length} filas omitidas`
            : "") +
          (forOwner
            ? ` · cobertura ${forOwner.contacts} contactos / ${forOwner.withEmail} con mail`
            : ""),
      );
      refreshCoverage();
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("No se pudo leer el archivo");
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quantum-directorio-plantilla.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (mode !== "operativa") {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-xl px-6 py-16 sm:px-10">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#6b1f2a] uppercase">
            Vista operativa
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[#1a2332]">
            Activando vista operativa…
          </h1>
          <p className="mt-2 text-sm text-[#5c6570]">
            Importar es solo para operación. Un momento.
          </p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl space-y-10 px-6 py-10 sm:px-10">
        <header>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#1a2332]">
            Procesar bases · 4 perfiles
          </h1>
          <p className="mt-1 text-sm text-[#5c6570]">
            Subí el CSV: se identifica perfil + tipo y se carga. Un import = un
            owner; el merge por LinkedIn URL suma owners.
          </p>
        </header>

        <section>
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
            Estado por perfil
          </h2>
          <ul className="mt-3 divide-y divide-[#e5e8ec] border-y border-[#e5e8ec]">
            {OWNERS.map((key) => {
              const row = coverage?.byOwner.find((o) => o.key === key);
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1a2332]">
                      {OWNER_LABELS[key]}
                    </p>
                    <p className="text-xs text-[#8a929c]">
                      {PROFILE_HINTS[key]}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums text-[#5c6570]">
                    {row ? (
                      <>
                        <span className="font-semibold text-[#1a2332]">
                          {row.contacts}
                        </span>{" "}
                        contactos · {row.withEmail} con mail
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-[#8a929c]">
            Orden sugerido: Laura → Fernando → Elías → César.
          </p>
        </section>

        <section className="space-y-5 border-y border-[#e5e8ec] py-6">
          <div className="border border-dashed border-[#e5e8ec] bg-[#fafbfc] p-6 text-center">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button
              type="button"
              className="gap-2 bg-[#6b1f2a] text-white hover:bg-[#5a1822]"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-4" />
              {busy ? "Identificando y cargando…" : "Subir CSV · auto-detectar"}
            </Button>
            <p className="mt-3 text-xs text-[#8a929c]">
              Connections, Sales Navigator o plantilla Quantum. Tip: incluí el
              nombre del perfil en el archivo (
              <code className="text-[11px]">Connections_elias.csv</code>).
            </p>
          </div>

          {detectedLine && (
            <p className="text-sm text-[#1a2332]" role="status">
              {detectedLine}
            </p>
          )}
          {error && (
            <p className="text-sm text-[#c41e24]" role="alert">
              {error}
            </p>
          )}
          {result && (
            <p className="text-sm text-[#1a2332]" role="status">
              {result}{" "}
              <a
                href="/contactos"
                className="font-medium text-[#6b1f2a] underline underline-offset-2"
              >
                Ver contactos
              </a>
              {" · "}
              <a
                href="/"
                className="font-medium text-[#6b1f2a] underline underline-offset-2"
              >
                Colas operativa
              </a>
            </p>
          )}

          <details className="rounded-none border border-[#e5e8ec] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[#1a2332]">
              Forzar perfil / tipo (si el nombre del archivo no alcanza)
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-2">
                <Label>Perfil de esta base</Label>
                <Select
                  value={owner}
                  onValueChange={(v) => {
                    if (!v) return;
                    setOwner(v as ProfileOwner);
                    setForceManual(true);
                  }}
                  items={OWNER_LABELS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {OWNER_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#8a929c]">{PROFILE_HINTS[owner]}</p>
              </div>

              <div className="grid gap-2">
                <Label>Tipo de archivo</Label>
                <Select
                  value={sourceType}
                  onValueChange={(v) => {
                    if (!v) return;
                    setSourceType(v as SourceType);
                    setForceManual(true);
                  }}
                  items={SOURCE_LABELS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SOURCE_LABELS) as SourceType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {SOURCE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {forceManual && (
                <p className="text-xs text-[#6b1f2a]">
                  Modo manual activo: el próximo upload usará el perfil/tipo
                  elegidos.
                </p>
              )}
            </div>
          </details>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={downloadTemplate}
          >
            <Download className="size-4" />
            Plantilla CSV
          </Button>
        </section>

        <p className="text-xs text-[#8a929c]">
          Antecedentes de trabajos Quantum–empresa (SGQ) no se cargan acá — ver{" "}
          <code className="text-[11px]">docs/pendientes-presentacion.md</code>.
        </p>
      </main>
    </AppShell>
  );
}
