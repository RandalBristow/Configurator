import type React from "react";

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function WorkspaceHeader({ title, subtitle, left, right }: Props) {
  return (
    <div className="workspace-header">
      <div className="workspace-header__left">
        <div className="workspace-header__titles">
          <div className="workspace-header__title">{title}</div>
          {subtitle && <div className="workspace-header__subtitle">{subtitle}</div>}
        </div>
        {left && <div className="workspace-header__left-actions">{left}</div>}
      </div>
      {right && <div className="workspace-header__right">{right}</div>}
    </div>
  );
}

