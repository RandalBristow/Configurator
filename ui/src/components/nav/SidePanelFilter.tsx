type Props = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export function SidePanelFilter({ value, placeholder, onChange }: Props) {
  return (
    <div className="sidepanel-filter">
      <input
        className="sidepanel-filter__input"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

