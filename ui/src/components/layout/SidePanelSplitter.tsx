import type React from "react";

type Props = {
  collapsed: boolean;
  splitterSize: number;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  variant?: "default" | "flush";
};

export function SidePanelSplitter({
  collapsed,
  splitterSize,
  onMouseDown,
  variant = "default",
}: Props) {
  const isFlush = variant === "flush";
  return (
    <div
      className={`side-splitter ${collapsed ? "collapsed" : ""}`}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize side panel"
      onMouseDown={onMouseDown}
      style={{
        width: splitterSize,
        pointerEvents: collapsed ? "none" : "auto",
        height: "100%",
        alignSelf: "stretch",
        margin: 0,
        zIndex: 60,
        cursor: collapsed ? "default" : "col-resize",
        background: "linear-gradient(90deg, rgba(226,231,239,0.4), rgba(226,231,239,0.8))",
        boxShadow: "inset 1px 0 0 rgba(15,23,42,0.08), inset -1px 0 0 rgba(15,23,42,0.08)",
        borderRadius: isFlush ? 0 : 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!collapsed && (
        <div
          className="splitter-handle"
          onMouseDown={onMouseDown}
          style={{
            width: 28,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "col-resize",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          <div
            style={{
              width: 3,
              height: 20,
              background: "rgba(0,0,0,0.22)",
              borderRadius: 2,
            }}
          />
        </div>
      )}
    </div>
  );
}
