"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  emptyFilters,
  FilterBar,
  type FilterState,
} from "@/components/filter-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "@/lib/types";
import { BU_LABELS, ORG_LABELS } from "@/lib/types";

export function CompaniesView() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.businessUnit !== "all")
      sp.set("businessUnit", filters.businessUnit);
    if (filters.country !== "all") sp.set("country", filters.country);
    if (filters.orgType !== "all") sp.set("orgType", filters.orgType);
    return sp.toString();
  }, [filters]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/companies?${query}`).then((r) => r.json()),
      fetch("/api/meta").then((r) => r.json()),
    ])
      .then(([cos, meta]) => {
        setCompanies(cos);
        setCountries(meta.countries || []);
      })
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10 sm:px-10">
        <header>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#1a2332]">
            Empresas
          </h1>
          <p className="mt-1 text-sm text-[#5c6570]">
            Cuentas por país y sector.
          </p>
        </header>

        <FilterBar
          value={filters}
          onChange={setFilters}
          countries={countries}
          resultCount={companies.length}
        />

        {loading ? (
          <p className="text-sm text-[#8a929c]">Cargando…</p>
        ) : companies.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#8a929c]">
            Sin empresas para estos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#e5e8ec] hover:bg-transparent">
                  <TableHead className="text-[11px] tracking-wide text-[#8a929c] uppercase">
                    Empresa
                  </TableHead>
                  <TableHead className="text-[11px] tracking-wide text-[#8a929c] uppercase">
                    País
                  </TableHead>
                  <TableHead className="hidden text-[11px] tracking-wide text-[#8a929c] uppercase sm:table-cell">
                    Sector
                  </TableHead>
                  <TableHead className="hidden text-[11px] tracking-wide text-[#8a929c] uppercase md:table-cell">
                    Tipo
                  </TableHead>
                  <TableHead className="text-right text-[11px] tracking-wide text-[#8a929c] uppercase">
                    Contactos
                  </TableHead>
                  <TableHead className="text-right text-[11px] tracking-wide text-[#8a929c] uppercase">
                    Con mail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id} className="border-[#e5e8ec]">
                    <TableCell>
                      <a
                        href={`/contactos?q=${encodeURIComponent(c.name)}`}
                        className="font-medium text-[#1a2332] underline-offset-2 hover:underline"
                      >
                        {c.name}
                      </a>
                      {c.city && (
                        <p className="text-xs text-[#8a929c]">{c.city}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-[#5c6570]">{c.country}</TableCell>
                    <TableCell className="hidden text-[#5c6570] sm:table-cell">
                      {BU_LABELS[c.businessUnit]}
                    </TableCell>
                    <TableCell className="hidden text-[#5c6570] md:table-cell">
                      {ORG_LABELS[c.orgType]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[#1a2332]">
                      {c.contactCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[#5c6570]">
                      {c.withEmailCount ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </AppShell>
  );
}
