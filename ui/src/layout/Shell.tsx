import type React from "react";

export function Shell({
  header,
  nav,
  children,
  footer,
}: {
  header: React.ReactNode;
  nav: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      {header}
      <div className="shell-body">
        {nav}
        <main className="content">{children}</main>
      </div>
      {footer}
    </div>
  );
}
