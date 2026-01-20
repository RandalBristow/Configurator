import type { ReactNode } from "react";

type Props = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  action?: ReactNode;
};

export function SidePanelFilter({ value, placeholder, onChange, action }: Props) {
  return (
    <div className="sidepanel-filter">
      <input
        className="sidepanel-filter__input"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {action ? <div className="sidepanel-filter__action">{action}</div> : null}
    </div>
  );
}
