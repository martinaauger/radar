"use client";

import { useEffect, useState } from "react";
import type { CoverageStats } from "@/lib/types";
import { AppShell } from "@/components/app-shell";
import { useViewMode } from "@/components/view-mode";

export function CoverageView() {
  const { mode } = useViewMode();
  const [stats, setStats] = useState<CoverageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coverage")
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then(setStats)
      .catch(() => setError("Error al cargar el resumen."));
  }, []);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 sm:py-12">
        {error && (
          <p className="text-sm text-[#c41e24]" role="alert">
            {error}
          </p>
        )}
        {!stats && !error && (
          <p className="text-sm text-[#8a929c]">Cargando…</p>
        )}
        {stats &&
          (mode === "operativa" ? (
            <OpsHome stats={stats} />
          ) : (
            <ConsultantHome stats={stats} />
          ))}
      </main>
    </AppShell>
  );
}

/** Vista publicada: vende la base, sin colas ni métricas personales */
function ConsultantHome({ stats }: { stats: CoverageStats }) {
  return (
    <div className="space-y-14 animate-rise">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#6b1f2a] uppercase">
          Quantum America
        </p>
        <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-[#1a2332] sm:text-[2.35rem]">
          Directorio comercial
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5c6570]">
          Empresas y contactos del sector de servicios públicos en Latinoamérica.
          Buscá por país, sector y puesto.
        </p>
      </header>

      <section className="border-y border-[#e5e8ec] py-6">
        <dl className="grid grid-cols-3 gap-x-8 gap-y-6">
          <Stat
            label="Contactos"
            value={stats.totals.contacts}
            href="/contactos"
          />
          <Stat
            label="Empresas"
            value={stats.totals.companies}
            href="/empresas"
          />
          <Stat label="Países" value={stats.totals.countries} />
        </dl>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold tracking-[0.18em] text-[#8a929c] uppercase">
          Sectores
        </h2>
        <ul className="mt-5 divide-y divide-[#e5e8ec] border-y border-[#e5e8ec]">
          {stats.coreBusinesses.map((b) => (
            <li key={b.key}>
              <a
                href={`/contactos?businessUnit=${b.key}`}
                className="group flex flex-wrap items-baseline justify-between gap-2 py-4 transition-colors"
              >
                <span className="text-lg font-medium text-[#1a2332] group-hover:text-[#6b1f2a]">
                  {b.label}
                </span>
                <span className="text-sm tabular-nums text-[#8a929c]">
                  {b.contacts} contactos
                  <span className="mx-2 text-[#d8dee6]">·</span>
                  {b.companies} empresas
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold tracking-[0.18em] text-[#8a929c] uppercase">
          Países
        </h2>
        <ul className="mt-4 max-w-md space-y-0">
          {stats.byCountry.slice(0, 8).map((c) => (
            <li
              key={c.key}
              className="flex items-baseline justify-between border-b border-[#e5e8ec] py-2.5 text-sm last:border-0"
            >
              <a
                href={`/contactos?country=${encodeURIComponent(c.key)}`}
                className="font-medium text-[#1a2332] underline-offset-4 hover:underline"
              >
                {c.key}
              </a>
              <span className="tabular-nums text-[#8a929c]">{c.contacts}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Vista tuya: colas, asociados, enriquecer */
function OpsHome({ stats }: { stats: CoverageStats }) {
  return (
    <div className="space-y-12 animate-rise">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#6b1f2a] uppercase">
          Solo vos
        </p>
        <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-[#1a2332]">
          Colas de trabajo
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5c6570]">
          Ir juntando mails y LinkedIn. Las campañas grandes van por mail
          Quantum; lo cercano, por perfiles personales. Esta vista no la ve el
          consultor.
        </p>
      </header>

      <section className="border-y border-[#e5e8ec] py-5">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat label="Contactos" value={stats.totals.contacts} href="/contactos" />
          <Stat
            label="Con mail"
            value={stats.totals.withEmail ?? 0}
            href="/contactos?channel=con_mail"
          />
          <Stat
            label="Solo LinkedIn"
            value={stats.totals.linkedinOnly ?? 0}
            href="/contactos?channel=solo_linkedin"
          />
          <Stat
            label="Potenciales socios"
            value={stats.totals.associates ?? 0}
            href="/contactos?use=asociado"
          />
        </dl>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold tracking-[0.18em] text-[#8a929c] uppercase">
          Prioridades
        </h2>
        <ul className="mt-4 divide-y divide-[#e5e8ec] border-y border-[#e5e8ec]">
          <QueueRow
            title="Solo LinkedIn"
            detail="Perfil sí, mail no — acercamiento o pedir intro a quien lo tiene."
            value={stats.totals.linkedinOnly ?? 0}
            href="/contactos?channel=solo_linkedin"
          />
          <QueueRow
            title="Pendiente enriquecer mail"
            detail="Para campañas / seminarios desde comercial@quantum…"
            value={stats.totals.pendingEmail ?? 0}
            href="/contactos?mailStatus=pendiente"
          />
          <QueueRow
            title="Potenciales socios"
            detail={`${stats.totals.associatesWithEmail ?? 0} ya tienen mail · CV e historial en la ficha.`}
            value={stats.totals.associates ?? 0}
            href="/contactos?use=asociado"
          />
          <QueueRow
            title="Sin canal"
            detail="Ni LinkedIn ni mail."
            value={stats.totals.noChannel ?? 0}
            href="/contactos?channel=sin_canales"
          />
          <QueueRow
            title="Listos para campaña mail"
            detail="Con mail cargado."
            value={stats.totals.withEmail ?? 0}
            href="/contactos?channel=con_mail"
          />
        </ul>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold tracking-[0.18em] text-[#8a929c] uppercase">
          Sectores (atajo)
        </h2>
        <ul className="mt-4 divide-y divide-[#e5e8ec] border-y border-[#e5e8ec]">
          {stats.coreBusinesses.map((b) => (
            <li key={b.key}>
              <a
                href={`/contactos?businessUnit=${b.key}`}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="font-medium text-[#1a2332]">{b.label}</span>
                <span className="tabular-nums text-[#8a929c]">
                  {b.contacts} · {b.withEmail} con mail
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <dt className="text-[11px] font-semibold tracking-[0.14em] text-[#8a929c] uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-[#1a2332]">
        {value}
      </dd>
    </>
  );
  if (href) {
    return (
      <a href={href} className="block hover:opacity-80">
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

function QueueRow({
  title,
  detail,
  value,
  href,
}: {
  title: string;
  detail: string;
  value: number;
  href: string;
}) {
  return (
    <li>
      <a
        href={href}
        className="flex flex-wrap items-baseline justify-between gap-3 py-4"
      >
        <div className="min-w-0 max-w-xl">
          <p className="font-medium text-[#1a2332]">{title}</p>
          <p className="mt-0.5 text-sm text-[#8a929c]">{detail}</p>
        </div>
        <span className="text-xl font-semibold tabular-nums text-[#6b1f2a]">
          {value}
        </span>
      </a>
    </li>
  );
}
