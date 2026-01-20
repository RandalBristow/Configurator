export type AppMode = "data" | "design" | "preview";

type Props = {
  apiBase: string;
};

export function Header({ apiBase }: Props) {
  return (
    <header className="app-topbar">
      <div className="topbar-brand" aria-label="Company">
        <div className="topbar-mark" aria-hidden="true" />
        <div className="topbar-brand-text">
          <div className="topbar-brand-name">Configurator</div>
          <div className="topbar-brand-subtitle">Admin</div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-meta">API: {apiBase}</div>
      </div>
    </header>
  );
}
