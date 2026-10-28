"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type {
  Contact,
  MailStatus,
  ProfileOwner,
  QuantumHistoryEvent,
  UseTag,
} from "@/lib/types";
import {
  BU_LABELS,
  DECISION_LABELS,
  HISTORY_KIND_LABELS,
  MAIL_LABELS,
  ORG_LABELS,
  OWNER_LABELS,
  SOURCE_LABELS,
  USE_LABELS,
} from "@/lib/types";
import { Copy, ExternalLink, Mail, Phone, UserRound } from "lucide-react";

function normalizeLinkedinUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.includes("linkedin.com")) return `https://${t.replace(/^\/+/, "")}`;
  return `https://www.linkedin.com/in/${t.replace(/^\/+/, "")}`;
}

/** Mini CV a partir de lo que ya tenemos si no hay texto cargado */
function fallbackCv(contact: Contact): string {
  const bits: string[] = [];
  if (contact.title) bits.push(contact.title);
  if (contact.companyName) bits.push(`Hoy en ${contact.companyName}`);
  const place = [contact.city, contact.country].filter(Boolean).join(", ");
  if (place) bits.push(place);
  return bits.join(" · ");
}

export function ContactSheet({
  contact,
  ops,
  onClose,
  onSave,
  onRefresh,
}: {
  contact: Contact | null;
  ops: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Contact> & { id: string }) => Promise<void>;
  onRefresh?: () => Promise<void>;
}) {
  const [emailDraft, setEmailDraft] = useState("");
  const [linkedinDraft, setLinkedinDraft] = useState("");
  const [cvDraft, setCvDraft] = useState("");
  const [sgqDraft, setSgqDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [sgqSaving, setSgqSaving] = useState(false);

  useEffect(() => {
    setEmailDraft(contact?.email || "");
    setLinkedinDraft(contact?.linkedinUrl || "");
    setCvDraft(contact?.cvSummary || "");
    setSgqDraft(contact?.companyQuantumHistory || "");
    setNotesDraft(contact?.notes || "");
    setCopied(false);
  }, [
    contact?.id,
    contact?.email,
    contact?.linkedinUrl,
    contact?.cvSummary,
    contact?.companyQuantumHistory,
    contact?.notes,
  ]);

  const c = contact;
  const isAssociate = !!c?.uses.includes("asociado");
  const liUrl = c?.linkedinUrl ? normalizeLinkedinUrl(c.linkedinUrl) : null;
  const cvText = c
    ? c.cvSummary?.trim() || fallbackCv(c)
    : "";
  const companyHistory = c?.companyQuantumHistory?.trim();
  const radarEvents = (c?.historyEvents || []).filter(
    (e) => e.eventKind !== "manual_note",
  );

  async function copyEmail() {
    if (!c?.email) return;
    try {
      await navigator.clipboard.writeText(c.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  function patch(extra: Partial<Contact>) {
    if (!c) return Promise.resolve();
    return onSave({
      id: c.id,
      companyId: c.companyId,
      fullName: c.fullName,
      owners: c.owners,
      uses: c.uses,
      ...extra,
    });
  }

  function toggleAssociate() {
    if (!c) return;
    const uses: UseTag[] = isAssociate
      ? c.uses.filter((u) => u !== "asociado")
      : [...c.uses, "asociado"];
    void patch({ uses });
  }

  return (
    <Sheet open={!!c} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="overflow-y-auto border-l border-[#e5e8ec] sm:max-w-md"
        showCloseButton={false}
      >
        {c && (
          <>
        <div className="flex items-start justify-between gap-2 border-b border-[#e5e8ec] p-5">
          <SheetHeader className="space-y-1 p-0 text-left">
            <SheetTitle className="text-xl text-[#1a2332]">
              {c.fullName}
            </SheetTitle>
            <SheetDescription className="text-sm text-[#5c6570]">
              {c.title || "Sin puesto"}
            </SheetDescription>
          </SheetHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </Button>
        </div>

        <div className="grid gap-6 p-5">
          {/* Badge potencial socio */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#5c6570]">
            <span>{DECISION_LABELS[c.decisionLevel]}</span>
            {c.businessUnit && (
              <>
                <span className="text-[#d8dee6]">·</span>
                <span>{BU_LABELS[c.businessUnit]}</span>
              </>
            )}
            {isAssociate && (
              <>
                <span className="text-[#d8dee6]">·</span>
                <span className="font-semibold tracking-wide text-[#6b1f2a] uppercase">
                  Potencial socio
                </span>
              </>
            )}
          </div>

          {/* Datos completos */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
              Datos
            </h3>
            <dl className="space-y-2.5 text-sm">
              <Row label="Empresa" value={c.companyName || "—"} />
              <Row
                label="País / ciudad"
                value={
                  [c.city, c.country].filter(Boolean).join(", ") || "—"
                }
              />
              <Row
                label="Tipo de org."
                value={c.orgType ? ORG_LABELS[c.orgType] : "—"}
              />
              <Row label="Puesto" value={c.title || "—"} />
              <Row label="Mail" value={c.email || "Sin mail"} />
              <Row label="Teléfono" value={c.phone || "—"} />
            </dl>
          </section>

          {/* Acciones de canal */}
          <section className="flex flex-wrap gap-2 border-t border-[#e5e8ec] pt-5">
            {liUrl && (
              <Button
                type="button"
                className="bg-[#6b1f2a] text-white hover:bg-[#5a1822]"
                onClick={() =>
                  window.open(liUrl, "_blank", "noopener,noreferrer")
                }
              >
                LinkedIn
                <ExternalLink className="size-3.5" />
              </Button>
            )}
            {c.email && (
              <>
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex h-8 items-center gap-1.5 border border-[#e5e8ec] px-3 text-xs font-medium text-[#1a2332] hover:bg-[#f3f5f7]"
                >
                  <Mail className="size-3.5" />
                  Escribir
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyEmail}
                >
                  <Copy className="size-3.5" />
                  {copied ? "Copiado" : "Copiar mail"}
                </Button>
              </>
            )}
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="inline-flex h-8 items-center gap-1.5 border border-[#e5e8ec] px-3 text-xs font-medium text-[#1a2332] hover:bg-[#f3f5f7]"
              >
                <Phone className="size-3.5" />
                Llamar
              </a>
            )}
          </section>

          {/* CV — siempre visible; enfatizado si potencial socio */}
          <section
            className={
              isAssociate
                ? "border border-[#6b1f2a]/25 bg-[#6b1f2a]/[0.03] p-4"
                : "border-t border-[#e5e8ec] pt-5"
            }
          >
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
              {isAssociate ? "Resumen CV · potencial socio" : "Resumen"}
            </h3>
            {ops ? (
              <div className="mt-2 grid gap-2">
                <Textarea
                  value={cvDraft}
                  onChange={(e) => setCvDraft(e.target.value)}
                  onBlur={() => patch({ cvSummary: cvDraft })}
                  rows={4}
                  placeholder="Dónde trabajó, qué hace, de qué país es…"
                  className="text-sm"
                />
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[#1a2332]">
                {cvText || "Sin resumen todavía."}
              </p>
            )}
          </section>

          {/* Antecedentes reales Quantum ↔ empresa (vienen de SGQ) */}
          <section className="border-t border-[#e5e8ec] pt-5">
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
              Antecedentes Quantum · SGQ
            </h3>
            <p className="mt-1 text-xs text-[#8a929c]">
              Trabajos de Quantum con la{" "}
              <span className="font-medium text-[#5c6570]">
                organización
              </span>
              {c.companyName ? ` (${c.companyName})` : ""}. Ej.: si Dallasta es
              de EPEC, acá van los trabajos que Quantum hizo para EPEC. Sale de
              SGQ — no del LinkedIn.
            </p>
            {ops ? (
              <div className="mt-3 grid gap-2">
                <Textarea
                  className="text-sm"
                  value={sgqDraft}
                  onChange={(e) => setSgqDraft(e.target.value)}
                  rows={4}
                  placeholder="Pegar o resumir desde SGQ: proyectos, propuestas, contratos…"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={sgqSaving}
                  onClick={async () => {
                    if (!c.companyId) return;
                    setSgqSaving(true);
                    try {
                      const res = await fetch(
                        `/api/companies/${c.companyId}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            quantumHistory: sgqDraft || null,
                          }),
                        },
                      );
                      if (res.ok) {
                        await onRefresh?.();
                      }
                    } finally {
                      setSgqSaving(false);
                    }
                  }}
                >
                  {sgqSaving ? "Guardando…" : "Guardar antecedentes SGQ"}
                </Button>
              </div>
            ) : companyHistory ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#1a2332]">
                {companyHistory}
              </p>
            ) : (
              <p className="mt-3 text-sm text-[#8a929c] italic">
                Sin antecedentes cargados desde SGQ todavía.
              </p>
            )}
          </section>

          {/* Movimientos en este Radar (no son trabajos Quantum) */}
          <section className="border-t border-[#e5e8ec] pt-5">
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
              Actividad en el Radar
            </h3>
            <p className="mt-1 text-xs text-[#8a929c]">
              Cómo entró este contacto al directorio (Laura, LinkedIn,
              etiquetas). No son trabajos hechos por Quantum.
            </p>
            <HistoryTimeline events={radarEvents} />
          </section>

          {ops && (
            <>
              <section className="space-y-3 border-t border-[#e5e8ec] pt-5">
                <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
                  Completar canales
                </h3>
                <div className="grid gap-2">
                  <Label htmlFor="email">Mail</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                    />
                    <Button
                      type="button"
                      className="bg-[#6b1f2a] text-white hover:bg-[#5a1822]"
                      onClick={() =>
                        patch({
                          email: emailDraft || null,
                          mailStatus: emailDraft.trim()
                            ? ("completo" as MailStatus)
                            : ("pendiente" as MailStatus),
                        })
                      }
                    >
                      Guardar
                    </Button>
                  </div>
                  <p className="text-xs text-[#8a929c]">
                    {MAIL_LABELS[c.mailStatus]}
                  </p>
                </div>
                {!liUrl && (
                  <div className="grid gap-2">
                    <Label htmlFor="li">LinkedIn</Label>
                    <div className="flex gap-2">
                      <Input
                        id="li"
                        value={linkedinDraft}
                        onChange={(e) => setLinkedinDraft(e.target.value)}
                        placeholder="linkedin.com/in/…"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          patch({
                            linkedinUrl: normalizeLinkedinUrl(linkedinDraft),
                          })
                        }
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}
                <OwnersBlock owners={c.owners} />
              </section>

              <Button
                type="button"
                variant={isAssociate ? "default" : "outline"}
                className={
                  isAssociate
                    ? "bg-[#6b1f2a] text-white hover:bg-[#5a1822]"
                    : undefined
                }
                onClick={toggleAssociate}
              >
                <UserRound className="size-3.5" />
                {isAssociate
                  ? "Marcado como potencial socio"
                  : "Marcar como potencial socio"}
              </Button>

              <section className="grid gap-2">
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea
                  id="notes"
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={() => patch({ notes: notesDraft })}
                  rows={2}
                />
              </section>

              {c.uses.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
                    Etiquetas
                  </h3>
                  <p className="mt-2 text-sm text-[#5c6570]">
                    {c.uses.map((u) => USE_LABELS[u]).join(" · ")}
                  </p>
                </section>
              )}

              <section>
                <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
                  Origen del dato
                </h3>
                <ul className="mt-2 space-y-2">
                  {c.sources.length === 0 && (
                    <li className="text-xs text-[#8a929c]">Sin historial de origen.</li>
                  )}
                  {c.sources.map((s) => (
                    <li
                      key={s.id}
                      className="border-b border-[#e5e8ec] py-2 text-xs last:border-0"
                    >
                      <p className="font-medium text-[#1a2332]">
                        {SOURCE_LABELS[s.sourceType]}
                        {s.owner ? ` · ${OWNER_LABELS[s.owner]}` : ""}
                      </p>
                      <p className="text-[#8a929c]">
                        {new Date(s.recordedAt).toLocaleDateString("es-AR", {
                          timeZone: "America/Buenos_Aires",
                        })}
                        {s.note ? ` — ${s.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-[#8a929c]">{label}</dt>
      <dd className="text-[#1a2332]">{value}</dd>
    </div>
  );
}

function HistoryTimeline({ events }: { events: QuantumHistoryEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="mt-3 text-sm text-[#8a929c] italic">
        Todavía no hay eventos vinculados para esta persona o empresa.
      </p>
    );
  }

  return (
    <ol className="mt-4 space-y-0 border-l border-[#e5e8ec] pl-4">
      {events.map((e) => (
        <li key={e.id} className="relative pb-4 last:pb-0">
          <span className="absolute top-1.5 -left-[1.15rem] size-2 rounded-full bg-[#6b1f2a]" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-[#1a2332]">{e.title}</p>
            <time className="text-[11px] tabular-nums text-[#8a929c]">
              {new Date(e.occurredAt).toLocaleDateString("es-AR", {
                timeZone: "America/Buenos_Aires",
              })}
            </time>
          </div>
          <p className="mt-0.5 text-[11px] tracking-wide text-[#8a929c] uppercase">
            {e.subjectType === "company" ? "Empresa" : "Persona"}
            {" · "}
            {HISTORY_KIND_LABELS[e.eventKind] || e.eventKind}
          </p>
          {e.detail && (
            <p className="mt-1 text-sm leading-relaxed text-[#5c6570]">
              {e.detail}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function OwnersBlock({ owners }: { owners: ProfileOwner[] }) {
  if (owners.length === 0) {
    return (
      <p className="text-xs text-[#8a929c]">
        Todavía no sabemos en qué perfil está conectado.
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-[#1a2332]">
        Quién lo tiene (pedir intro)
      </p>
      <ul className="space-y-1">
        {owners.map((o) => (
          <li
            key={o}
            className="flex items-center gap-2 text-sm text-[#5c6570]"
          >
            <UserRound className="size-3.5 shrink-0 text-[#6b1f2a]" />
            {OWNER_LABELS[o]}
          </li>
        ))}
      </ul>
    </div>
  );
}
