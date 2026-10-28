"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useViewMode } from "@/components/view-mode";

const consultantLinks = [
  { href: "/", label: "Resumen" },
  { href: "/contactos", label: "Contactos" },
  { href: "/empresas", label: "Empresas" },
];

const opsLinks = [
  ...consultantLinks,
  { href: "/importar", label: "Importar" },
];

export function AppNav() {
  const pathname = usePathname();
  const { mode, setMode, ready } = useViewMode();
  const links = mode === "operativa" ? opsLinks : consultantLinks;

  return (
    <header className="border-b border-[#e5e8ec] bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-10">
        <a href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/quantum-mark.svg" alt="" className="size-8" />
          <div className="leading-tight">
            <p className="text-[13px] font-bold tracking-[0.18em] text-[#6b1f2a] uppercase">
              Quantum America
            </p>
            <p className="text-[11px] tracking-wide text-[#8a929c]">
              {mode === "operativa"
                ? "Vista operativa"
                : "Directorio comercial"}
            </p>
          </div>
        </a>

        <div className="flex flex-wrap items-center gap-4">
          <nav className="flex flex-wrap gap-1">
            {links.map((l) => {
              const active =
                l.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(l.href);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors",
                    active
                      ? "text-[#6b1f2a]"
                      : "text-[#8a929c] hover:text-[#1a2332]",
                  )}
                >
                  {l.label}
                  {active && (
                    <span className="absolute inset-x-3 bottom-0 h-px bg-[#6b1f2a]" />
                  )}
                </a>
              );
            })}
          </nav>

          {ready && (
            <div
              className="flex rounded border border-[#e5e8ec] p-0.5 text-[11px]"
              role="group"
              aria-label="Vista"
            >
              <button
                type="button"
                onClick={() => setMode("consultor")}
                className={cn(
                  "rounded px-2.5 py-1 font-medium tracking-wide transition-colors",
                  mode === "consultor"
                    ? "bg-[#6b1f2a] text-white"
                    : "text-[#8a929c] hover:text-[#1a2332]",
                )}
              >
                Consultor
              </button>
              <button
                type="button"
                onClick={() => setMode("operativa")}
                className={cn(
                  "rounded px-2.5 py-1 font-medium tracking-wide transition-colors",
                  mode === "operativa"
                    ? "bg-[#6b1f2a] text-white"
                    : "text-[#8a929c] hover:text-[#1a2332]",
                )}
              >
                Operativa
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
