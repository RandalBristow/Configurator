export type AppMode = "data" | "design" | "preview";

type Props = {
  mode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  apiBase: string;
};

export function Header({
  mode,
  onChangeMode,
  apiBase,
}: Props) {
  return (
    <header className="app-topbar">
      <div className="topbar-brand" aria-label="Company">
        <div className="topbar-mark" aria-hidden="true" />
        <div className="topbar-brand-text">
          <div className="topbar-brand-name">Configurator</div>
          <div className="topbar-brand-subtitle">Admin</div>
        </div>
      </div>

      <nav className="topbar-tabs" aria-label="Workspace mode">
        <button
          type="button"
          className={`topbar-tab ${mode === "data" ? "active" : ""}`}
          onClick={() => onChangeMode("data")}
        >
          Data
        </button>
        <button
          type="button"
          className={`topbar-tab ${mode === "design" ? "active" : ""}`}
          onClick={() => onChangeMode("design")}
        >
          Design
        </button>
        <button
          type="button"
          className={`topbar-tab ${mode === "preview" ? "active" : ""}`}
          onClick={() => onChangeMode("preview")}
        >
          Preview
        </button>
      </nav>

      <div className="topbar-right">
        <div className="topbar-meta">API: {apiBase}</div>
      </div>
    </header>
  );
}
