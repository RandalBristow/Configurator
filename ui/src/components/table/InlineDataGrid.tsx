import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, X } from "lucide-react";

export type InlineDataGridColumn<T> = {
  key: keyof T;
  header: string;
  type: "string" | "number" | "boolean" | "datetime";
  width?: number;
  align?: "left" | "center" | "right";
  enableSort?: boolean;
  filterLabel?: (value: any, row?: T) => string;
};

type InlineDataGridProps<T> = {
  columns: InlineDataGridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (ids: string[]) => void;
  onRowChange: (id: string, key: keyof T, value: any) => void;
  newRow: Partial<T>;
  onNewRowChange: (key: keyof T, value: any) => void;
  onFocusSelectAll?: (e: React.FocusEvent<HTMLInputElement>) => void;
  newRowRef?: React.RefObject<HTMLTableRowElement | null>;
  newRowFirstInputRef?: React.RefObject<HTMLInputElement | null>;
  onNewRowBlur?: (e: React.FocusEvent<HTMLTableRowElement>) => void;
  enableSelection?: boolean;
  enableFilters?: boolean;
  enableSorting?: boolean;
};

type SortState<T> = { key: keyof T; dir: "asc" | "desc" } | null;

export function InlineDataGrid<T>({
  columns,
  rows,
  getRowId,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowChange,
  newRow,
  onNewRowChange,
  onFocusSelectAll,
  newRowRef,
  newRowFirstInputRef,
  onNewRowBlur,
  enableSelection = true,
  enableFilters = true,
  enableSorting = true,
}: InlineDataGridProps<T>) {
  const [sort, setSort] = useState<SortState<T>>(null);
  const [filters, setFilters] = useState<Record<string, { text: string; values: string[] }>>({});
  const [filterMenu, setFilterMenu] = useState<{
    colKey: string;
    title: string;
    position: { x: number; y: number };
    values: { value: string; label: string }[];
    draft: { text: string; values: Set<string> };
  } | null>(null);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  const sortedFilteredRows = useMemo(() => {
    let data = rows;
    if (enableFilters) {
      data = data.filter((row) => {
        return columns.every((col) => {
          const filterValue = filters[String(col.key)];
          if (!filterValue) return true;
          const text = filterValue.text.trim().toLowerCase();
          const values = filterValue.values ?? [];
          const cell = (row as any)[col.key];
          const value = cell === null || cell === undefined ? "" : String(cell);
          const target = value.toLowerCase();
          if (text && !target.includes(text)) return false;
          if (values.length && !values.some((v) => v.toLowerCase() === target)) return false;
          return true;
        });
      });
    }
    if (enableSorting && sort) {
      const { key, dir } = sort;
      const col = columns.find((c) => c.key === key);
      data = [...data].sort((a, b) => {
        const av = (a as any)[key];
        const bv = (b as any)[key];
        if (av === bv) return 0;
        if (av === undefined || av === null) return dir === "asc" ? -1 : 1;
        if (bv === undefined || bv === null) return dir === "asc" ? 1 : -1;
        if (col?.type === "number") return dir === "asc" ? av - bv : bv - av;
        if (col?.type === "boolean") return dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
        if (col?.type === "datetime") {
          const ad = new Date(av).getTime();
          const bd = new Date(bv).getTime();
          if (!Number.isNaN(ad) && !Number.isNaN(bd)) return dir === "asc" ? ad - bd : bd - ad;
        }
        return dir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return data;
  }, [rows, columns, filters, sort, enableFilters, enableSorting]);

  const closeFilterMenu = () => setFilterMenu(null);

  const openFilterMenu = (colKey: string, title: string, eventTarget: HTMLElement) => {
    const col = columns.find((c) => String(c.key) === colKey);
    if (!col) return;
    const current = filters[colKey] ?? { text: "", values: [] };
    const rect = eventTarget.getBoundingClientRect();
    const popWidth = 260;
    const popHeight = 300;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - popWidth - 8);
    const top = Math.min(Math.max(8, rect.bottom + 4), window.innerHeight - popHeight);

    const uniques = new Map<string, string>();
    rows.forEach((r) => {
      const raw = (r as any)[colKey as keyof T];
      const value = raw === null || raw === undefined ? "" : String(raw);
      if (!value) return;
      const label = col.filterLabel ? col.filterLabel(raw, r) : value;
      if (!uniques.has(value)) uniques.set(value, label);
    });

    const values = Array.from(uniques.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));

    setFilterMenu({
      colKey,
      title,
      position: { x: left, y: top },
      values,
      draft: {
        text: current.text ?? "",
        values: new Set(current.values ?? []),
      },
    });
  };

  const applyFilter = () => {
    if (!filterMenu) return;
    const text = filterMenu.draft.text.trim();
    const values = Array.from(filterMenu.draft.values);
    const hasFilter = text.length > 0 || values.length > 0;
    setFilters((prev) => {
      const next = { ...prev };
      if (hasFilter) next[filterMenu.colKey] = { text, values };
      else delete next[filterMenu.colKey];
      return next;
    });
    closeFilterMenu();
  };

  const clearFilter = () => {
    if (!filterMenu) return;
    setFilters((prev) => {
      const next = { ...prev };
      delete next[filterMenu.colKey];
      return next;
    });
    closeFilterMenu();
  };

  useEffect(() => {
    if (!filterMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const node = filterPopoverRef.current;
      if (node && !node.contains(e.target as Node)) {
        closeFilterMenu();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFilterMenu();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [filterMenu]);

  const visibleIds = useMemo(() => sortedFilteredRows.map((row) => getRowId(row)), [sortedFilteredRows, getRowId]);
  const allSelected = selectedIds ? visibleIds.every((id) => selectedIds.has(id)) : false;

  const renderCellInput = (
    value: any,
    col: InlineDataGridColumn<T>,
    onChange: (val: any) => void,
    inputRef?: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (col.type === "boolean") {
      return (
        <input
          type="checkbox"
          className="table-checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    }
    if (col.type === "number") {
      return (
        <input
          ref={inputRef}
          className={`table-input ${col.align === "center" ? "center" : ""}`}
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          onFocus={onFocusSelectAll}
        />
      );
    }
    if (col.type === "datetime") {
      return (
        <input
          ref={inputRef}
          className="table-input"
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocusSelectAll}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        className="table-input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocusSelectAll}
      />
    );
  };

  return (
    <>
      <table className="data-table dense selectable">
      <thead>
        <tr>
          {enableSelection && (
            <th style={{ width: 34 }} className="center">
              <button
                type="button"
                className={`row-select-handle ${allSelected ? "active" : ""}`}
                onClick={() => onToggleSelectAll?.(allSelected ? [] : visibleIds)}
                title="Select all"
              >
                o
              </button>
            </th>
          )}
          {columns.map((col) => {
            const isSorted = sort?.key === col.key;
            const indicator = isSorted ? (sort?.dir === "asc" ? "\u25B2" : "\u25BC") : "";
            const canSort = enableSorting && col.enableSort !== false;
            const filterActive = Boolean(filters[String(col.key)]);
            return (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={col.align}
                onClick={
                  canSort
                    ? () =>
                        setSort((prev) =>
                          !prev || prev.key !== col.key
                            ? { key: col.key, dir: "asc" }
                            : prev.dir === "asc"
                              ? { key: col.key, dir: "desc" }
                              : null,
                        )
                    : undefined
                }
                title={canSort ? "Click to sort" : undefined}
              >
                <div className="th-inner">
                  <span className="th-label">
                    {col.header}
                    {indicator && <span className="th-sort">{indicator}</span>}
                  </span>
                  <span className="th-actions">
                    {enableFilters && (
                      <button
                        className={`filter-btn ${filterActive ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilterMenu(String(col.key), col.header, e.currentTarget);
                        }}
                        title="Filter"
                        type="button"
                      >
                        <Filter size={14} />
                      </button>
                    )}
                  </span>
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedFilteredRows.map((row) => {
          const id = getRowId(row);
          const selected = selectedIds?.has(id);
          return (
            <tr key={id} className={selected ? "row-selected" : undefined}>
              {enableSelection && (
                <td className="center">
                  <button
                    type="button"
                    className={`row-select-handle ${selected ? "active" : ""}`}
                    onClick={() => onToggleSelect?.(id)}
                    title={selected ? "Deselect row" : "Select row"}
                  >
                    o
                  </button>
                </td>
              )}
              {columns.map((col) => (
                <td key={`${id}-${String(col.key)}`} className={col.align}>
                  {renderCellInput((row as any)[col.key], col, (val) => onRowChange(id, col.key, val))}
                </td>
              ))}
            </tr>
          );
        })}
        <tr className="new-row" ref={newRowRef} onBlur={onNewRowBlur}>
          {enableSelection && <td />}
          {columns.map((col, idx) => (
            <td key={`new-${String(col.key)}`} className={col.align}>
              {renderCellInput(
                (newRow as any)[col.key],
                col,
                (val) => onNewRowChange(col.key, val),
                idx === 0 ? newRowFirstInputRef : undefined,
              )}
            </td>
          ))}
        </tr>
      </tbody>
      </table>
      {filterMenu && (
        <div
          ref={filterPopoverRef}
          className="filter-popover"
          style={{ top: filterMenu.position.y, left: filterMenu.position.x }}
        >
          <div className="filter-popover-header">
            <div className="filter-title">{filterMenu.title}</div>
            <button className="btn secondary icon-btn" onClick={closeFilterMenu} title="Close" type="button">
              <X size={14} />
            </button>
          </div>
          <div className="filter-body">
            <label className="filter-label">Contains</label>
            <input
              className="table-input filter-input"
              value={filterMenu.draft.text}
              onChange={(e) =>
                setFilterMenu((prev) =>
                  prev ? { ...prev, draft: { ...prev.draft, text: e.target.value } } : prev,
                )
              }
              placeholder="Type to search"
            />
            <div className="filter-values">
              <div className="filter-values-scroll">
                {filterMenu.values.map((val) => {
                  const checked = filterMenu.draft.values.has(val.value);
                  return (
                    <label key={val.value} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setFilterMenu((prev) => {
                            if (!prev) return prev;
                            const next = new Set(prev.draft.values);
                            if (e.target.checked) next.add(val.value);
                            else next.delete(val.value);
                            return { ...prev, draft: { ...prev.draft, values: next } };
                          });
                        }}
                      />
                      <span>{val.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="filter-footer">
            <button className="btn secondary small-btn" onClick={clearFilter} type="button">
              Clear
            </button>
            <button className="btn primary small-btn" onClick={applyFilter} type="button">
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
}
