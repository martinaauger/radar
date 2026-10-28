"use client";

import type { ReactNode } from "react";
import { ViewModeProvider } from "@/components/view-mode";

export function Providers({ children }: { children: ReactNode }) {
  return <ViewModeProvider>{children}</ViewModeProvider>;
}
