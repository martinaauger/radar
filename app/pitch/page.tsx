import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Radar comercial — pedido de aprobación · Quantum America",
  description:
    "Propuesta para desarrollar el directorio interno de contactos a partir de los 4 perfiles LinkedIn.",
};

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-[#6b1f2a] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 20% 0%, #9a2f3d 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 100%, #4a1520 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 py-14 sm:px-10 sm:py-20">
        <p className="text-[12px] font-semibold tracking-[0.22em] text-white/70 uppercase">
          Quantum America · borrador interno
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Radar
        </h1>
        <p className="mt-3 max-w-xl text-lg leading-relaxed text-white/85">
          Base unificada de contactos comerciales: empresa → país → puesto →
          persona, con canales LinkedIn y mail.
        </p>
        <p className="mt-6 max-w-xl rounded-md border border-white/20 bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/95">
          <span className="font-semibold">Pedido:</span> autorizar el desarrollo
          como proyecto interno de operación comercial / prospecting.
        </p>

        <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ["6.106", "Contactos"],
            ["3.718", "Empresas"],
            ["16", "Países"],
            ["391", "Pot. socios"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="text-[11px] tracking-wide text-white/60 uppercase">
                {label}
              </dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-14 space-y-4 border-t border-white/15 pt-10">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-white/70 uppercase">
            El problema
          </h2>
          <p className="text-[15px] leading-relaxed text-white/90">
            Los contactos viven en 4 perfiles LinkedIn (Fernando, Elías, César,
            Laura). No hay una base única para buscar ni saber si el camino es
            LinkedIn (acercamiento / intro) o mail (campaña Quantum).
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-white/70 uppercase">
            La propuesta
          </h2>
          <ul className="space-y-3 text-[15px] leading-relaxed text-white/90">
            <li>
              <span className="font-semibold text-white">Vista consultor</span>{" "}
              — búsqueda limpia por sector, país y empresa; ficha con datos, CV
              de socio y actividad.
            </li>
            <li>
              <span className="font-semibold text-white">Vista operativa</span>{" "}
              — import de las 4 bases y colas (sin mail, solo LinkedIn,
              potenciales socios). Solo para quien mantiene la base.
            </li>
            <li>
              <span className="font-semibold text-white">Antecedentes SGQ</span>{" "}
              — espacio por empresa para trabajos Quantum reales (ej. qué se
              hizo para EPEC), sin inventar movimientos.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-white/70 uppercase">
            Estado del prototipo
          </h2>
          <p className="text-[15px] leading-relaxed text-white/90">
            Laura + Fernando ya unificados. Faltan Elías y César. Listas /
            export / campañas y vínculo SGQ quedan para la siguiente fase.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-white/70 uppercase">
            Si hay OK
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-white/90">
            <li>Proyecto / repo propio del Radar.</li>
            <li>Completar bases de Elías y César.</li>
            <li>Vincular antecedentes desde SGQ.</li>
            <li>Listas personales + export para campañas.</li>
          </ol>
        </section>

        <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-white/15 pt-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#6b1f2a] transition hover:bg-white/90"
          >
            Abrir prototipo
          </Link>
          <Link
            href="/contactos"
            className="inline-flex items-center justify-center rounded-md border border-white/35 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ver contactos
          </Link>
        </div>

        <p className="mt-10 text-xs text-white/50">
          Octubre 2026 · Electricidad · Gas · Agua · Generación
        </p>
      </div>
    </div>
  );
}
