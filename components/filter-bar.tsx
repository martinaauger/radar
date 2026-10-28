"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BU_LABELS,
  CHANNEL_LABELS,
  DECISION_LABELS,
  MAIL_LABELS,
  ORG_LABELS,
  USE_LABELS,
} from "@/lib/types";
import { Search, X } from "lucide-react";

export type FilterState = {
  q: string;
  businessUnit: string;
  country: string;
  owner: string;
  orgType: string;
  decisionLevel: string;
  mailStatus: string;
  use: string;
  channel: string;
};

export const emptyFilters: FilterState = {
  q: "",
  businessUnit: "all",
  country: "all",
  owner: "all",
  orgType: "all",
  decisionLevel: "all",
  mailStatus: "all",
  use: "all",
  channel: "all",
};

export function FilterBar({
  value,
  onChange,
  countries,
  resultCount,
  /** En vista consultor se ocultan filtros de operación */
  ops = false,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  countries: string[];
  resultCount: number;
  ops?: boolean;
}) {
  function set<K extends keyof FilterState>(key: K, v: FilterState[K]) {
    onChange({ ...value, [key]: v });
  }

  const active =
    value.q ||
    value.businessUnit !== "all" ||
    value.country !== "all" ||
    value.orgType !== "all" ||
    value.decisionLevel !== "all" ||
    value.mailStatus !== "all" ||
    value.use !== "all" ||
    value.channel !== "all";

  return (
    <div className="space-y-3 border-b border-[#e5e8ec] pb-5">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-[#8a929c]" />
        <Input
          value={value.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Empresa, persona, puesto o país"
          className="h-10 border-0 border-b border-[#e5e8ec] bg-transparent pl-7 text-sm shadow-none rounded-none focus-visible:border-[#6b1f2a] focus-visible:ring-0"
          aria-label="Buscar"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {ops && (
          <FilterSelect
            label="Canal"
            value={value.channel}
            onChange={(v) => set("channel", v)}
            items={CHANNEL_LABELS}
          />
        )}
        <FilterSelect
          label="Sector"
          value={value.businessUnit}
          onChange={(v) => set("businessUnit", v)}
          items={{ all: "Todos los sectores", ...BU_LABELS }}
        />
        <FilterSelect
          label="País"
          value={value.country}
          onChange={(v) => set("country", v)}
          items={{
            all: "Todos los países",
            ...Object.fromEntries(countries.map((c) => [c, c])),
          }}
        />
        <FilterSelect
          label="Tipo de organización"
          value={value.orgType}
          onChange={(v) => set("orgType", v)}
          items={{ all: "Todo tipo de org.", ...ORG_LABELS }}
        />
        <FilterSelect
          label="Nivel"
          value={value.decisionLevel}
          onChange={(v) => set("decisionLevel", v)}
          items={{ all: "Todos los niveles", ...DECISION_LABELS }}
        />
        {ops && (
          <>
            <FilterSelect
              label="Mail"
              value={value.mailStatus}
              onChange={(v) => set("mailStatus", v)}
              items={{ all: "Con o sin mail", ...MAIL_LABELS }}
            />
            <FilterSelect
              label="Para qué"
              value={value.use}
              onChange={(v) => set("use", v)}
              items={{ all: "Cualquier uso", ...USE_LABELS }}
            />
          </>
        )}
        {active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 text-[#8a929c]"
            onClick={() => onChange({ ...emptyFilters })}
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>
      <p className="text-xs text-[#8a929c]">
        {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)} items={items}>
      <SelectTrigger
        className="h-9 w-auto min-w-[9.5rem] border-[#e5e8ec] bg-white text-[13px]"
        aria-label={label}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-[60]">
        {Object.entries(items).map(([k, lab]) => (
          <SelectItem key={k} value={k}>
            {lab}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
