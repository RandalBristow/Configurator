import type React from "react";
import { SidePanelSplitter } from "../components/layout/SidePanelSplitter";

export function Shell({
  header,
  menubar,
  rail,
  railWidth,
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
  rail?: React.ReactNode;
  railWidth?: number;
  nav?: React.ReactNode;
  navCollapsed?: boolean;
  navSize?: number;
  navSplitterSize?: number;
  onNavSplitterMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const hasNav = Boolean(nav);
  const hasRail = Boolean(rail);
  const cssVars: React.CSSProperties = {};
  if (typeof railWidth === "number") (cssVars as any)["--rail-width"] = `${railWidth}px`;
  if (hasNav && typeof navSize === "number") {
    (cssVars as any)["--sidenav-width"] = `${navSize}px`;
  }
  if (hasNav && typeof navSplitterSize === "number") {
    const splitterWidth = navCollapsed ? 0 : navSplitterSize;
    (cssVars as any)["--splitter-width"] = `${splitterWidth}px`;
  }

  return (
    <div className="app-shell" style={cssVars}>
      {header}
      {menubar}
      <div
        className={`shell-body ${hasNav ? "" : "shell-body--no-nav"} ${
          hasRail ? "" : "shell-body--no-rail"
        }`}
      >
        {hasRail && <aside className="app-rail">{rail}</aside>}
        {hasNav && (
          <aside
            className={`app-sidenav ${navCollapsed ? "is-collapsed" : ""}`}
            style={typeof navSize === "number" ? { width: navSize } : undefined}
          >
            {nav}
          </aside>
        )}
        {hasNav &&
          typeof navSize === "number" &&
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
