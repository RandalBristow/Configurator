import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export type ColumnFilterDraft = {
  text: string;
  values: string[];
};

export type ColumnFilterOption = {
  value: string;
  label: string;
};

export type ColumnFilterMenu = {
  colId: string;
  title: string;
  position: { x: number; y: number };
  values: ColumnFilterOption[];
  draft: ColumnFilterDraft;
};

type Props = {
  menu: ColumnFilterMenu;
  onClose: () => void;
  onApply: (draft: ColumnFilterDraft) => void;
  onClear: () => void;
};

export function ColumnFilterPopover({ menu, onClose, onApply, onClear }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [text, setText] = useState(menu.draft.text ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(menu.draft.values ?? []));

  useEffect(() => {
    setText(menu.draft.text ?? "");
    setSelected(new Set(menu.draft.values ?? []));
  }, [menu.colId, menu.draft.text, menu.draft.values]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const node = rootRef.current;
      if (!node) return;
      if (!node.contains(e.target as Node)) onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const filteredOptions = useMemo(() => {
    const term = text.trim().toLowerCase();
    if (!term) return menu.values;
    return menu.values.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term),
    );
  }, [menu.values, text]);

  const toggleValue = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleApply = () => {
    onApply({
      text,
      values: Array.from(selected),
    });
  };

  const handleClear = () => {
    setText("");
    setSelected(new Set());
    onClear();
  };

  return (
    <div
      ref={rootRef}
      className="filter-popover"
      style={{ top: menu.position.y, left: menu.position.x }}
      role="dialog"
      aria-label={`Filter ${menu.title}`}
    >
      <div className="filter-popover-header">
        <div className="filter-title">{menu.title}</div>
        <button
          className="icon-btn"
          type="button"
          title="Close filter"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <div className="filter-body">
        <div className="filter-label">Contains</div>
        <input
          className="table-input filter-input"
          placeholder="Type to search"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="filter-values">
          <div className="filter-values-scroll">
            {filteredOptions.length === 0 ? (
              <div className="muted small" style={{ padding: 8 }}>
                No values
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const checked = selected.has(opt.value);
                return (
                  <label key={opt.value} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleValue(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="filter-footer">
        <button className="btn secondary small-btn" type="button" onClick={handleClear}>
          Clear
        </button>
        <button className="btn primary small-btn" type="button" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
