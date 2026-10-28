"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ViewMode = "consultor" | "operativa";

const STORAGE_KEY = "quantum-radar-view";

type Ctx = {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  ready: boolean;
};

const ViewModeContext = createContext<Ctx>({
  mode: "consultor",
  setMode: () => {},
  ready: false,
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("consultor");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "operativa" || raw === "consultor") setModeState(raw);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setMode = useCallback((m: ViewMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ViewModeContext.Provider value={{ mode, setMode, ready }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
