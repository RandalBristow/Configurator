import type React from "react";

type Props = {
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function WorkspaceToolbar({ left, right }: Props) {
  if (!left && !right) return null;
  return (
    <div className="workspace-toolbar">
      <div className="workspace-toolbar__left">{left}</div>
      <div className="workspace-toolbar__right">{right}</div>
    </div>
  );
}

