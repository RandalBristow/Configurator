export function NavButton({
  label,
  count,
  active,
  disabled,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-link ${active ? "active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
    >
      <span>{label}</span>
      <span className="nav-badge">{count ?? 0}</span>
    </button>
  );
}
