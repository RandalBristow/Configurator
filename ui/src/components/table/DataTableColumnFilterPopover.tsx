import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export type ColumnFilterDraft = {
  text: string;
  values: string[];
  valuesMode?: "all" | "some" | "none";
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
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const [text, setText] = useState(menu.draft.text ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(menu.draft.values ?? []));
  const [valuesMode, setValuesMode] = useState<"all" | "some" | "none">(() => {
    if (menu.draft.valuesMode) return menu.draft.valuesMode;
    return (menu.draft.values ?? []).length > 0 ? "some" : "all";
  });

  useEffect(() => {
    setText(menu.draft.text ?? "");
    setSelected(new Set(menu.draft.values ?? []));
    setValuesMode(
      menu.draft.valuesMode ?? ((menu.draft.values ?? []).length > 0 ? "some" : "all"),
    );
  }, [menu.colId, menu.draft.text, menu.draft.values, menu.draft.valuesMode]);

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

  const visibleValues = useMemo(
    () => filteredOptions.map((option) => option.value),
    [filteredOptions],
  );

  const allOptionValues = useMemo(
    () => menu.values.map((option) => option.value),
    [menu.values],
  );

  const selectedVisibleCount =
    valuesMode === "all"
      ? visibleValues.length
      : valuesMode === "none"
        ? 0
        : visibleValues.filter((value) => selected.has(value)).length;
  const allVisibleSelected = visibleValues.length > 0 && selectedVisibleCount === visibleValues.length;
  const noneVisibleSelected = selectedVisibleCount === 0;

  useEffect(() => {
    const node = selectAllRef.current;
    if (!node) return;
    node.indeterminate = !allVisibleSelected && !noneVisibleSelected;
  }, [allVisibleSelected, noneVisibleSelected]);

  const handleToggleSelectAll = () => {
    if (!visibleValues.length) return;
    setSelected((prev) => {
      if (valuesMode === "all") {
        const next = new Set(allOptionValues);
        visibleValues.forEach((value) => next.delete(value));
        setValuesMode(next.size === 0 ? "none" : "some");
        return next;
      }

      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleValues.forEach((value) => next.delete(value));
      } else {
        visibleValues.forEach((value) => next.add(value));
      }

      if (next.size === 0) {
        setValuesMode("none");
      } else if (next.size === allOptionValues.length) {
        setValuesMode("all");
        return new Set();
      } else {
        setValuesMode("some");
      }
      return next;
    });
  };

  const toggleValue = (value: string) => {
    setSelected((prev) => {
      if (valuesMode === "all") {
        const next = new Set(allOptionValues);
        next.delete(value);
        setValuesMode(next.size === 0 ? "none" : "some");
        return next;
      }
      if (valuesMode === "none") {
        const next = new Set<string>();
        next.add(value);
        setValuesMode("some");
        return next;
      }
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);

      if (next.size === 0) {
        setValuesMode("none");
      } else if (next.size === allOptionValues.length) {
        setValuesMode("all");
        return new Set();
      }
      return next;
    });
  };

  const handleApply = () => {
    onApply({
      text,
      values: valuesMode === "some" ? Array.from(selected) : [],
      valuesMode,
    });
  };

  const handleClear = () => {
    setText("");
    setSelected(new Set());
    setValuesMode("all");
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
              <>
                <label className="filter-checkbox filter-checkbox--all">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleToggleSelectAll}
                  />
                  <span>Select All</span>
                </label>
                {filteredOptions.map((opt) => {
                  const checked =
                    valuesMode === "all"
                      ? true
                      : valuesMode === "none"
                        ? false
                        : selected.has(opt.value);
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
                })}
              </>
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
