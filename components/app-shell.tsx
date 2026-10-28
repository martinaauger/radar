"use client";

import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="quantum-frame">
      <div className="quantum-panel flex flex-col">
        <AppNav />
        {children}
      </div>
    </div>
  );
}
