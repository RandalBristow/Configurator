import type React from "react";
import { SidePanelSplitter } from "../components/layout/SidePanelSplitter";

export function Shell({
  header,
  menubar,
  nav,
  navCollapsed,
  navSize,
  navSplitterSize,
  onNavSplitterMouseDown,
  children,
  footer,
}: {
  header: React.ReactNode;
  menubar?: React.ReactNode;
  nav: React.ReactNode;
  navCollapsed?: boolean;
  navSize?: number;
  navSplitterSize?: number;
  onNavSplitterMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const cssVars: React.CSSProperties = {};
  if (typeof navSize === "number") (cssVars as any)["--sidenav-width"] = `${navSize}px`;
  if (typeof navSplitterSize === "number") (cssVars as any)["--splitter-width"] = `${navSplitterSize}px`;

  return (
    <div className="app-shell" style={cssVars}>
      {header}
      {menubar}
      <div className="shell-body">
        <aside className="app-sidenav" style={navSize ? { width: navSize } : undefined}>
          {nav}
        </aside>
        {typeof navSize === "number" &&
          typeof navSplitterSize === "number" &&
          typeof onNavSplitterMouseDown === "function" && (
            <SidePanelSplitter
              collapsed={Boolean(navCollapsed)}
              splitterSize={navSplitterSize}
              onMouseDown={onNavSplitterMouseDown}
            />
          )}
        <main className="content">{children}</main>
      </div>
      {footer}
    </div>
  );
}
