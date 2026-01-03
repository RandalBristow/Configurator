import type React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function WorkspacePane({ title, subtitle, headerRight, children, className }: Props) {
  return (
    <section className={`workspace-pane ${className ?? ""}`.trim()}>
      {(title || subtitle || headerRight) && (
        <div className="workspace-pane__header">
          <div className="workspace-pane__header-left">
            {title && <div className="workspace-pane__title">{title}</div>}
            {subtitle && <div className="workspace-pane__subtitle">{subtitle}</div>}
          </div>
          {headerRight && <div className="workspace-pane__header-right">{headerRight}</div>}
        </div>
      )}
      <div className="workspace-pane__body">{children}</div>
    </section>
  );
}

