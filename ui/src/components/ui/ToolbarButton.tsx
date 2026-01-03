import type React from "react";

type BaseProps = {
  icon?: React.ReactNode;
  label?: string;
};

type Props = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ToolbarButton({ icon, label, className, children, ...rest }: Props) {
  return (
    <button type="button" className={["toolbar-btn", className].filter(Boolean).join(" ")} {...rest}>
      {children ?? (
        <>
          {icon}
          {label && <span className="toolbar-btn__label">{label}</span>}
        </>
      )}
    </button>
  );
}

type FileButtonProps = {
  icon?: React.ReactNode;
  label: string;
  title?: string;
  disabled?: boolean;
  accept?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ToolbarFileButton({ icon, label, title, disabled, accept, onChange }: FileButtonProps) {
  const style = disabled ? { pointerEvents: "none" as const, opacity: 0.5 } : undefined;
  return (
    <label className="toolbar-btn" title={title} style={style}>
      {icon}
      <span className="toolbar-btn__label">{label}</span>
      <input type="file" accept={accept} onChange={onChange} style={{ display: "none" }} />
    </label>
  );
}

export function ToolbarDivider() {
  return <div className="toolbar-divider" aria-hidden="true" />;
}

