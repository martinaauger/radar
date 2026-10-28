"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShippingLabel } from "@/components/shipping-label";

export default function HomePage() {
  return (
    <div className="print-root min-h-full bg-[#f4f5f7] text-neutral-900">
      <div className="no-print mx-auto flex w-full max-w-[170mm] items-center justify-between gap-4 px-4 pt-6 pb-4">
        <h1 className="text-lg font-semibold">Etiqueta para el paquete</h1>
        <Button
          type="button"
          onClick={() => window.print()}
          className="h-11 bg-neutral-900 px-4 text-base text-white hover:bg-neutral-800"
        >
          <Printer />
          Imprimir
        </Button>
      </div>

      <div className="px-4 pb-24 sm:pb-10">
        <ShippingLabel />
      </div>

      <div className="no-print fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <Button
          type="button"
          onClick={() => window.print()}
          className="h-11 w-full bg-neutral-900 text-base text-white hover:bg-neutral-800"
        >
          <Printer />
          Imprimir
        </Button>
      </div>
    </div>
  );
}
