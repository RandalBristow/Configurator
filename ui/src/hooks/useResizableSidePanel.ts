import { useEffect, useMemo, useRef, useState } from "react";

type Options = {
  storageKeyBase: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapsedWidth?: number;
  splitterSize?: number;
  side?: "left" | "right";
  enableCollapse?: boolean;
};

export function useResizableSidePanel({
  storageKeyBase,
  defaultWidth = 320,
  minWidth = 260,
  maxWidth = 520,
  collapsedWidth = 48,
  splitterSize = 8,
  side = "right",
  enableCollapse = true,
}: Options) {
  const widthKey = `${storageKeyBase}.panelWidth`;
  const collapsedKey = `${storageKeyBase}.panelCollapsed`;

  const clamp = (v: number) => Math.min(maxWidth, Math.max(minWidth, v));

  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window === "undefined") return defaultWidth;
    const stored = window.localStorage.getItem(widthKey);
    const parsed = stored ? Number(stored) : defaultWidth;
    return Number.isFinite(parsed) ? clamp(parsed) : defaultWidth;
  });

  const [panelCollapsed, setPanelCollapsed] = useState(() => {
    if (!enableCollapse) return false;
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(collapsedKey) === "true";
  });

  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    window.localStorage.setItem(widthKey, String(panelWidth));
  }, [panelWidth, widthKey]);

  useEffect(() => {
    if (!enableCollapse) return;
    window.localStorage.setItem(collapsedKey, String(panelCollapsed));
  }, [panelCollapsed, collapsedKey, enableCollapse]);

  const panelSize = useMemo(
    () => (enableCollapse && panelCollapsed ? collapsedWidth : panelWidth),
    [panelCollapsed, collapsedWidth, panelWidth]
  );

  const onSplitterMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (enableCollapse && panelCollapsed) return;
    e.preventDefault();

    dragRef.current = { startX: e.clientX, startWidth: panelWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (evt: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = evt.clientX - dragRef.current.startX;
      const signedDelta = side === "left" ? delta : -delta;
      setPanelWidth(clamp(dragRef.current.startWidth + signedDelta));
    };

    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return {
    panelCollapsed,
    setPanelCollapsed,
    panelSize,
    splitterSize,
    onSplitterMouseDown,
  };
}
