import type React from "react";
import { SidePanelSplitter } from "../layout/SidePanelSplitter";
import { WorkspaceInspectorPane } from "./WorkspaceInspectorPane";

type Props = {
  panelSize: number;
  splitterSize: number;
  onSplitterMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;

  header?: React.ReactNode;
  main: React.ReactNode;
  inspector?: React.ReactNode;
  children?: React.ReactNode;
};

export function WorkspaceShell({
  panelSize,
  splitterSize,
  onSplitterMouseDown,
  header,
  main,
  inspector,
  children,
}: Props) {
  const hasInspector = inspector !== undefined && inspector !== null;
  return (
    <div className="select-list-screen">
      {header}
      <div
        className="inspector-shell"
        style={{
          gridTemplateColumns: hasInspector
            ? `minmax(0, 1fr) ${splitterSize}px ${panelSize}px`
            : "minmax(0, 1fr)",
          columnGap: 0,
        }}
      >
        <div className="select-list-main">{main}</div>

        {hasInspector ? (
          <>
            <SidePanelSplitter
              collapsed={false}
              splitterSize={splitterSize}
              onMouseDown={onSplitterMouseDown}
              variant="flush"
            />

            <WorkspaceInspectorPane>{inspector}</WorkspaceInspectorPane>
          </>
        ) : null}
      </div>
      {children}
    </div>
  );
}
