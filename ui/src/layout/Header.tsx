export function Header({
  showInactive,
  onToggleInactive,
  apiBase,
}: {
  showInactive: boolean;
  onToggleInactive: (val: boolean) => void;
  apiBase: string;
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand">Configurator Admin</div>
        <div className="muted small">Manage catalog, lists, and attributes</div>
      </div>
      <div className="header-right">
        <label className="small flex items-center gap-2">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => onToggleInactive(e.target.checked)}
          />
          Show inactive
        </label>
        <div className="muted small">API: {apiBase}</div>
      </div>
    </header>
  );
}
