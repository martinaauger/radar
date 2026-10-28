"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ContactSheet } from "@/components/contact-sheet";
import {
  emptyFilters,
  FilterBar,
  type FilterState,
} from "@/components/filter-bar";
import { useViewMode } from "@/components/view-mode";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Contact } from "@/lib/types";
import { BU_LABELS, DECISION_LABELS } from "@/lib/types";
import { Building2, ExternalLink, Mail } from "lucide-react";

function filtersFromUrl(): FilterState {
  if (typeof window === "undefined") return emptyFilters;
  const sp = new URLSearchParams(window.location.search);
  return {
    ...emptyFilters,
    q: sp.get("q") || "",
    mailStatus: sp.get("mailStatus") || "all",
    businessUnit: sp.get("businessUnit") || "all",
    country: sp.get("country") || "all",
    orgType: sp.get("orgType") || "all",
    decisionLevel: sp.get("decisionLevel") || "all",
    use: sp.get("use") || "all",
    channel: sp.get("channel") || "all",
    owner: sp.get("owner") || "all",
  };
}

function writeUrl(filters: FilterState) {
  const sp = new URLSearchParams();
  (Object.entries(filters) as [keyof FilterState, string][]).forEach(
    ([k, v]) => {
      if (k === "owner") return;
      if (v && v !== "all") sp.set(k, v);
    },
  );
  const qs = sp.toString();
  window.history.replaceState(
    null,
    "",
    qs ? `?${qs}` : window.location.pathname,
  );
}

export function ContactsView() {
  const { mode } = useViewMode();
  const ops = mode === "operativa";
  const [filters, setFilters] = useState<FilterState>(filtersFromUrl);
  const [debouncedQ, setDebouncedQ] = useState(filters.q);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 280);
    return () => clearTimeout(t);
  }, [filters.q]);

  useEffect(() => {
    writeUrl(filters);
  }, [filters]);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    const effective = { ...filters, q: debouncedQ };
    Object.entries(effective).forEach(([k, v]) => {
      if (k === "owner") return;
      if (v && v !== "all") sp.set(k, v);
    });
    return sp.toString();
  }, [filters, debouncedQ]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/contacts?${query}`).then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      }),
      fetch("/api/meta").then((r) => r.json()),
    ])
      .then(([cts, meta]) => {
        setContacts(cts);
        setCountries(meta.countries || []);
      })
      .catch(() => setError("Error al cargar contactos. Reintentá."))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadContactDetail(id: string) {
    const full = (await fetch(`/api/contacts/${id}`).then((r) =>
      r.json(),
    )) as Contact;
    if (full?.id) setSelected(full);
    return full;
  }

  async function saveContact(patch: Partial<Contact> & { id: string }) {
    const base = selected;
    if (!base && !patch.companyId) return;
    const body = {
      ...base,
      ...patch,
      owners: patch.owners || base?.owners || [],
      uses: patch.uses ?? base?.uses ?? [],
    };
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const updated = await res.json();
    setSelected(updated);
    setContacts((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10 sm:px-10">
        <header>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#1a2332]">
            Contactos
          </h1>
          <p className="mt-1 text-sm text-[#5c6570]">
            Tocá una fila para ver datos completos, CV y historial Quantum.
          </p>
        </header>

        <FilterBar
          value={filters}
          onChange={setFilters}
          countries={countries}
          resultCount={contacts.length}
          ops={ops}
        />

        {error && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="text-[#c41e24]" role="alert">
              {error}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={load}>
              Reintentar
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#8a929c]">Cargando contactos…</p>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="mx-auto size-6 text-[#d8dee6]" />
            <p className="mt-3 font-medium text-[#1a2332]">Sin resultados</p>
            <p className="mt-1 text-sm text-[#8a929c]">Ajustá los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#e5e8ec] hover:bg-transparent">
                  <TableHead className="text-[11px] tracking-wide text-[#8a929c] uppercase">
                    Persona
                  </TableHead>
                  <TableHead className="text-[11px] tracking-wide text-[#8a929c] uppercase">
                    Empresa
                  </TableHead>
                  <TableHead className="hidden text-[11px] tracking-wide text-[#8a929c] uppercase md:table-cell">
                    País
                  </TableHead>
                  <TableHead className="hidden text-[11px] tracking-wide text-[#8a929c] uppercase lg:table-cell">
                    Sector
                  </TableHead>
                  <TableHead className="hidden text-[11px] tracking-wide text-[#8a929c] uppercase sm:table-cell">
                    Nivel
                  </TableHead>
                  <TableHead className="w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer border-[#e5e8ec]"
                    onClick={() => {
                      setSelected(c);
                      void loadContactDetail(c.id);
                    }}
                  >
                    <TableCell>
                      <p className="font-medium text-[#1a2332]">{c.fullName}</p>
                      <p className="text-xs text-[#8a929c]">
                        {c.title || "Sin puesto"}
                      </p>
                      {c.uses.includes("asociado") && (
                        <span className="mt-1 inline-block text-[10px] font-semibold tracking-wide text-[#6b1f2a] uppercase">
                          Potencial socio
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-[#1a2332]">{c.companyName}</p>
                      <p className="text-xs text-[#8a929c] md:hidden">
                        {c.country}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-[#5c6570] md:table-cell">
                      {c.country || "—"}
                    </TableCell>
                    <TableCell className="hidden text-[#5c6570] lg:table-cell">
                      {c.businessUnit ? BU_LABELS[c.businessUnit] : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-[#5c6570]">
                        {DECISION_LABELS[c.decisionLevel]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 text-[#8a929c]">
                        <Mail
                          className={`size-3.5 ${c.email ? "text-[#6b1f2a]" : "opacity-30"}`}
                        />
                        <ExternalLink
                          className={`size-3.5 ${c.linkedinUrl ? "text-[#1a2332]" : "opacity-30"}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <ContactSheet
        contact={selected}
        ops={ops}
        onClose={() => setSelected(null)}
        onSave={saveContact}
        onRefresh={async () => {
          if (selected?.id) await loadContactDetail(selected.id);
        }}
      />
    </AppShell>
  );
}
