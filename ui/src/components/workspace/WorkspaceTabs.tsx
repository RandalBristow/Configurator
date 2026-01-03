type TabItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "pills" | "menubar";
};

export function WorkspaceTabs({ items, activeId, onChange, variant = "pills" }: Props) {
  const tabListClassName = [
    "workspace-tabs",
    variant === "menubar" ? "workspace-tabs--menubar" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={tabListClassName} role="tablist" aria-label="Inspector tabs">
      {items.map((t) => {
        const active = t.id === activeId;
        const tabClassName =
          variant === "menubar"
            ? `menubar-tab ${active ? "active" : ""}`
            : `workspace-tab ${active ? "active" : ""}`;
        return (
          <button
            key={t.id}
            type="button"
            className={tabClassName}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            disabled={t.disabled}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
