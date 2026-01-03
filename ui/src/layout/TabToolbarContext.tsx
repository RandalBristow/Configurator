import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";

type TabToolbarContextValue = {
  leftToolbar: React.ReactNode;
  rightToolbar: React.ReactNode;
  setLeftToolbar: (node: React.ReactNode) => void;
  setRightToolbar: (node: React.ReactNode) => void;
};

const TabToolbarContext = createContext<TabToolbarContextValue | null>(null);

export function TabToolbarProvider({ children }: { children: React.ReactNode }) {
  const [leftToolbar, setLeftToolbar] = useState<React.ReactNode>(null);
  const [rightToolbar, setRightToolbar] = useState<React.ReactNode>(null);
  const value = useMemo(
    () => ({ leftToolbar, rightToolbar, setLeftToolbar, setRightToolbar }),
    [leftToolbar, rightToolbar]
  );
  return <TabToolbarContext.Provider value={value}>{children}</TabToolbarContext.Provider>;
}

export function useTabToolbar() {
  const ctx = useContext(TabToolbarContext);
  if (!ctx) throw new Error("useTabToolbar must be used within TabToolbarProvider");
  return ctx;
}
