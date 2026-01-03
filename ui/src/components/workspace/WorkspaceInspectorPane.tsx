import type React from "react";

type Props = {
  children: React.ReactNode;
};

export function WorkspaceInspectorPane({ children }: Props) {
  return (
    <div className="side-pane">
      <div className="side-pane-scroll">{children}</div>
    </div>
  );
}
