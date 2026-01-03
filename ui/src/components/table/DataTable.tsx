import { useEffect, useMemo, useRef, useState } from "react";
import { Filter } from "lucide-react";
import {
  ColumnFilterPopover,
  type ColumnFilterDraft,
  type ColumnFilterMenu,
} from "./DataTableColumnFilterPopover";

export type DataGridColumn<T> = {
  key: keyof T;
  header: string;
  type: "string" | "number" | "boolean" | "datetime";
  width?: number;
  align?: "left" | "center" | "right";
  enableSort?: boolean;
  filterLabel?: (value: any, row?: T) => string;
  options?: Array<{ value: string; label: string }>;
};

type DataGridProps<T> = {
  columns: DataGridColumn<T>[];
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
  showNewRow?: boolean;
  enableSelection?: boolean;
  selectionDisabled?: boolean;
  isRowSelectable?: (row: T) => boolean;
  isRowReadOnly?: (row: T) => boolean;
  enableFilters?: boolean;
  enableSorting?: boolean;
  getRowStatus?: (row: T) => "new" | "edited" | undefined;
  disabled?: boolean;
};

type SortState<T> = { key: keyof T; dir: "asc" | "desc" } | null;

type LayoutMetrics = {
  headerFont: string;
  cellFont: string;
  headerPaddingX: number;
  headerBorderX: number;
  cellPaddingX: number;
  cellBorderX: number;
  tableBorderX: number;
  filterButtonWidth: number;
  thInnerGap: number;
  thActionsGap: number;
  resizerGutter: number;
  sortIndicatorWidth: number;
};

const MIN_COLUMN_WIDTH_PX = 60;
const MAX_AUTO_COLUMN_WIDTH_PX = 360;
const SELECTION_COLUMN_WIDTH_PX = 34;
const CHECKBOX_WIDTH_PX = 18;

export function DataGrid<T>({
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
  showNewRow = true,
  enableSelection = true,
  selectionDisabled = false,
  isRowSelectable,
  isRowReadOnly,
  enableFilters = true,
  enableSorting = true,
  getRowStatus,
  disabled = false,
}: DataGridProps<T>) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const resizingRef = useRef<{
    colKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const userResizedColumnsRef = useRef<Set<string>>(new Set());
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<SortState<T>>(null);
  const [filters, setFilters] = useState<Record<string, { text: string; values: string[] }>>({});
  const [filterMenu, setFilterMenu] = useState<ColumnFilterMenu | null>(null);
  const [containerWidthPx, setContainerWidthPx] = useState<number | null>(null);
  const [layoutMetrics, setLayoutMetrics] = useState<LayoutMetrics | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const parsePx = (value: string) => {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const measureTextWidth = (text: string, font: string) => {
    if (!measureCtxRef.current) {
      const canvas = document.createElement("canvas");
      measureCtxRef.current = canvas.getContext("2d");
    }
    const ctx = measureCtxRef.current;
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return ctx.measureText(text).width;
  };

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const container = table.parentElement;
    if (!container) return;

    // Measure the *usable* width (content + padding), excluding borders and any scrollbars,
    // but preserve sub-pixel precision to avoid 1–2px "always-on" scrollbars.
    const update = () => {
      const rectWidth = container.getBoundingClientRect().width;
      const chromeDelta = container.offsetWidth - container.clientWidth; // borders + scrollbar
      const usable = rectWidth - chromeDelta;
      setContainerWidthPx(usable > 0 ? usable : container.clientWidth);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const th = table.querySelector("thead th") as HTMLElement | null;
    const td = table.querySelector("tbody td") as HTMLElement | null;
    const thStyle = th ? getComputedStyle(th) : null;
    const tdStyle = td ? getComputedStyle(td) : null;
    const tableStyle = getComputedStyle(table);

    const headerFont = thStyle?.font || tableStyle.font || "700 12.5px Inter";
    const cellFont = tdStyle?.font || tableStyle.font || "12.5px Inter";

    const headerPaddingX = thStyle ? parsePx(thStyle.paddingLeft) + parsePx(thStyle.paddingRight) : 12;
    const headerBorderX = thStyle ? parsePx(thStyle.borderLeftWidth) + parsePx(thStyle.borderRightWidth) : 2;
    const cellPaddingX = tdStyle ? parsePx(tdStyle.paddingLeft) + parsePx(tdStyle.paddingRight) : 12;
    const cellBorderX = tdStyle ? parsePx(tdStyle.borderLeftWidth) + parsePx(tdStyle.borderRightWidth) : 2;
    const tableBorderX = parsePx(tableStyle.borderLeftWidth) + parsePx(tableStyle.borderRightWidth);

    const filterBtn = table.querySelector("thead th button.filter-btn") as HTMLElement | null;
    const filterButtonWidth = filterBtn ? Math.round(filterBtn.getBoundingClientRect().width) : 24;

    setLayoutMetrics({
      headerFont,
      cellFont,
      headerPaddingX,
      headerBorderX,
      cellPaddingX,
      cellBorderX,
      tableBorderX,
      filterButtonWidth,
      thInnerGap: 4,
      thActionsGap: 4,
      resizerGutter: 10,
      sortIndicatorWidth: 12,
    });
  }, []);

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
      colId: colKey,
      title,
      position: { x: left, y: top },
      values,
      draft: {
        text: current.text ?? "",
        values: current.values ?? [],
      },
    });
  };

  const applyFilter = (draft: ColumnFilterDraft) => {
    if (!filterMenu) return;
    const text = draft.text.trim();
    const values = draft.values;
    const hasFilter = text.length > 0 || values.length > 0;
    setFilters((prev) => {
      const next = { ...prev };
      if (hasFilter) next[filterMenu.colId] = { text, values };
      else delete next[filterMenu.colId];
      return next;
    });
    closeFilterMenu();
  };

  const clearFilter = () => {
    if (!filterMenu) return;
    setFilters((prev) => {
      const next = { ...prev };
      delete next[filterMenu.colId];
      return next;
    });
    closeFilterMenu();
  };

  const visibleIds = useMemo(() => sortedFilteredRows.map((row) => getRowId(row)), [sortedFilteredRows, getRowId]);
  const visibleSelectableIds = useMemo(() => {
    if (!isRowSelectable) return visibleIds;
    const selectable = new Set<string>();
    sortedFilteredRows.forEach((row) => {
      if (isRowSelectable(row)) selectable.add(getRowId(row));
    });
    return visibleIds.filter((id) => selectable.has(id));
  }, [sortedFilteredRows, visibleIds, getRowId, isRowSelectable]);

  const allSelected = selectedIds
    ? visibleSelectableIds.length > 0 && visibleSelectableIds.every((id) => selectedIds.has(id))
    : false;

  const estimateColumnWidth = (col: DataGridColumn<T>) => {
    const metrics: LayoutMetrics = layoutMetrics ?? {
      headerFont: "700 12.5px Inter",
      cellFont: "12.5px Inter",
      headerPaddingX: 12,
      headerBorderX: 2,
      cellPaddingX: 12,
      cellBorderX: 2,
      tableBorderX: 2,
      filterButtonWidth: 24,
      thInnerGap: 4,
      thActionsGap: 4,
      resizerGutter: 10,
      sortIndicatorWidth: 12,
    };

    const headerTextWidth = measureTextWidth(col.header ?? "", metrics.headerFont);
    const canSort = enableSorting && col.enableSort !== false;
    const headerExtras =
      metrics.headerPaddingX +
      metrics.headerBorderX +
      metrics.resizerGutter +
      (enableFilters ? metrics.filterButtonWidth + metrics.thActionsGap : 0) +
      (canSort ? metrics.sortIndicatorWidth : 0) +
      metrics.thInnerGap;
    const headerWidth = Math.ceil(headerTextWidth + headerExtras);

    let maxCellText = 0;
    if (col.options?.length) {
      for (const opt of col.options) {
        maxCellText = Math.max(maxCellText, measureTextWidth(opt.label, metrics.cellFont));
      }
    } else if (col.type === "boolean") {
      maxCellText = CHECKBOX_WIDTH_PX;
    } else {
      const sample = rows.slice(0, 50);
      for (const r of sample) {
        const raw = (r as any)[col.key];
        if (raw === null || raw === undefined) continue;
        const txt = String(raw);
        if (!txt) continue;
        maxCellText = Math.max(maxCellText, measureTextWidth(txt, metrics.cellFont));
      }
    }

    const cellExtras = metrics.cellPaddingX + metrics.cellBorderX + metrics.resizerGutter;
    const cellWidth = Math.ceil(maxCellText + cellExtras);

    const base = Math.max(headerWidth, cellWidth, MIN_COLUMN_WIDTH_PX);
    return clamp(base, MIN_COLUMN_WIDTH_PX, MAX_AUTO_COLUMN_WIDTH_PX);
  };

  const getColWidth = (col: DataGridColumn<T>) => {
    const key = String(col.key);
    if (typeof col.width === "number" && Number.isFinite(col.width)) return col.width;
    const w = columnWidths[key];
    if (typeof w === "number" && Number.isFinite(w)) return w;
    return estimateColumnWidth(col);
  };

  const computedLayout = useMemo(() => {
    const selectionWidth = enableSelection ? SELECTION_COLUMN_WIDTH_PX : 0;
    const availableWidthPx =
      containerWidthPx && layoutMetrics ? containerWidthPx - layoutMetrics.tableBorderX : containerWidthPx;
    const availableWidth = typeof availableWidthPx === "number" ? Math.floor(availableWidthPx) : null;

    const baseWidths: Record<string, number> = {};
    let total = selectionWidth;
    for (const col of columns) {
      const w = Math.round(getColWidth(col));
      baseWidths[String(col.key)] = w;
      total += w;
    }

    const nextWidths: Record<string, number> = { ...baseWidths };
    if (availableWidth && columns.length > 0) {
      const lastColKey = String(columns[columns.length - 1].key);
      const EPSILON_PX = 2;

      if (total < availableWidth) {
        const slack = availableWidth - total;
        nextWidths[lastColKey] = (nextWidths[lastColKey] ?? 0) + slack;
        total += slack;
      } else if (
        total > availableWidth &&
        total - availableWidth <= EPSILON_PX &&
        !userResizedColumnsRef.current.has(lastColKey)
      ) {
        // Avoid tiny "always on" scrollbars due to rounding/text-measurement mismatch.
        const delta = total - availableWidth;
        const current = nextWidths[lastColKey] ?? MIN_COLUMN_WIDTH_PX;
        const reduced = Math.max(MIN_COLUMN_WIDTH_PX, current - delta);
        nextWidths[lastColKey] = reduced;
        total -= current - reduced;
      }
    }

    return { tableWidthPx: Math.max(200, total), widths: nextWidths };
  }, [
    columns,
    columnWidths,
    containerWidthPx,
    enableSelection,
    enableFilters,
    enableSorting,
    layoutMetrics,
    rows.length,
  ]);

  useEffect(() => {
    setColumnWidths((prev) => {
      let changed = false;
      const next: Record<string, number> = { ...prev };

      for (const col of columns) {
        const key = String(col.key);
        if (typeof col.width === "number") {
          if (next[key] !== col.width) {
            next[key] = col.width;
            changed = true;
          }
          continue;
        }

        if (userResizedColumnsRef.current.has(key)) continue;

        const autoWidth = estimateColumnWidth(col);
        if (next[key] !== autoWidth) {
          next[key] = autoWidth;
          changed = true;
        }
      }

      // Drop widths for columns that no longer exist
      const existingKeys = new Set(columns.map((c) => String(c.key)));
      for (const key of Object.keys(next)) {
        if (!existingKeys.has(key)) {
          delete next[key];
          userResizedColumnsRef.current.delete(key);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [columns, rows.length, enableFilters, enableSorting, layoutMetrics]);

  const startResize = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const th = headerCellRefs.current[colKey];
    const startWidth = th ? Math.round(th.getBoundingClientRect().width) : (columnWidths[colKey] ?? 120);
    resizingRef.current = { colKey, startX: e.clientX, startWidth };

    const onMove = (ev: MouseEvent) => {
      const s = resizingRef.current;
      if (!s) return;
      const nextWidth = Math.max(60, Math.round(s.startWidth + (ev.clientX - s.startX)));
      userResizedColumnsRef.current.add(s.colKey);
      setColumnWidths((prev) => ({ ...prev, [s.colKey]: nextWidth }));
    };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const renderCellInput = (
    value: any,
    col: DataGridColumn<T>,
    onChange: (val: any) => void,
    inputRef?: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (col.options) {
      return (
        <select
          className={`table-input ${col.align === "center" ? "center" : ""}`}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        >
          {col.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
    if (col.type === "boolean") {
      return (
        <input
          type="checkbox"
          className="table-checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          onDragStart={(e) => e.preventDefault()}
        />
      );
    }
    if (col.type === "number") {
      return (
        <input
          ref={inputRef}
          className={`table-input ${col.align === "center" ? "center" : ""}`}
          type="number"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(null);
              return;
            }
            const n = Number(raw);
            onChange(Number.isFinite(n) ? n : null);
          }}
          onFocus={onFocusSelectAll}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
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
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
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
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      />
    );
  };

  const renderReadOnlyValue = (value: any, col: DataGridColumn<T>) => {
    if (col.options) {
      const match = col.options.find((opt) => opt.value === String(value ?? ""));
      return match?.label ?? String(value ?? "");
    }
    if (col.type === "boolean") return value ? "\u2713" : "";
    return String(value ?? "");
  };

  return (
    <>
      <table
        ref={tableRef}
        className="data-table dense selectable"
        style={{
          ...(disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined),
          width: computedLayout.tableWidthPx,
        }}
        aria-disabled={disabled || undefined}
      >
      <colgroup>
        {enableSelection && <col style={{ width: SELECTION_COLUMN_WIDTH_PX }} />}
        {columns.map((col) => (
          <col key={String(col.key)} style={{ width: computedLayout.widths[String(col.key)] }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {enableSelection && (
            <th className="center sticky-left">
               <button
                 type="button"
                 className={`row-select-handle ${allSelected ? "active" : ""}`}
                 onClick={
                   selectionDisabled
                     ? undefined
                      : () => onToggleSelectAll?.(allSelected ? [] : visibleSelectableIds)
                 }
                 title="Select all"
                 disabled={selectionDisabled}
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
                ref={(el) => {
                  headerCellRefs.current[String(col.key)] = el;
                }}
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
                <span
                  className="resizer"
                  role="separator"
                  aria-orientation="vertical"
                  onMouseDown={(e) => startResize(String(col.key), e)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
          {sortedFilteredRows.map((row) => {
            const id = getRowId(row);
            const selected = selectedIds?.has(id);
            const rowStatus = getRowStatus?.(row);
            const rowSelectable = isRowSelectable ? isRowSelectable(row) : true;
            const rowReadOnly = isRowReadOnly ? isRowReadOnly(row) : false;
            const rowClass = [
              selected ? "row-selected" : "",
              rowStatus ? `row-status-${rowStatus}` : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <tr key={id} className={rowClass || undefined}>
                {enableSelection && (
                  <td
                    className={`center row-indicator-cell sticky-left ${rowStatus ? `row-status-${rowStatus}` : ""}`}
                  >
                    {rowStatus && (
                      <span className={`row-indicator row-indicator-${rowStatus}`} aria-hidden />
                    )}
                    <button
                      type="button"
                      className={`row-select-handle ${selected ? "active" : ""}`}
                      onClick={
                        selectionDisabled || !rowSelectable ? undefined : () => onToggleSelect?.(id)
                      }
                      title={selected ? "Deselect row" : "Select row"}
                      disabled={selectionDisabled || !rowSelectable}
                    >
                      o
                    </button>
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={`${id}-${String(col.key)}`}
                    className={col.align}
                  >
                    {rowReadOnly ? (
                      <span className="cell-readonly">
                        {renderReadOnlyValue((row as any)[col.key], col)}
                      </span>
                    ) : (
                      renderCellInput((row as any)[col.key], col, (val) => onRowChange(id, col.key, val))
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        {showNewRow && (
            <tr className="new-row" ref={newRowRef} onBlur={onNewRowBlur}>
              {enableSelection && <td className="sticky-left" />}
              {columns.map((col, idx) => (
                <td
                  key={`new-${String(col.key)}`}
                  className={col.align}
                >
                  {renderCellInput(
                    (newRow as any)[col.key],
                    col,
                    (val) => onNewRowChange(col.key, val),
                    idx === 0 ? newRowFirstInputRef : undefined,
                )}
              </td>
            ))}
          </tr>
        )}
      </tbody>
      </table>
      {filterMenu && (
        <ColumnFilterPopover
          menu={filterMenu}
          onClose={closeFilterMenu}
          onApply={applyFilter}
          onClear={clearFilter}
        />
      )}
    </>
  );
}
