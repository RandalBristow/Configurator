import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import {
  DataGrid,
  SelectColumn,
  type Column,
  type ColumnWidth,
  type ColumnWidths,
  type DataGridHandle,
  type RowsChangeData,
  type SortColumn,
} from "react-data-grid";
import type { DataGridColumn } from "./DataTable";
import {
  ColumnFilterPopover,
  type ColumnFilterDraft,
  type ColumnFilterMenu,
} from "./DataTableColumnFilterPopover";

const DEFAULT_NEW_ROW_ID_PREFIX = "__new__-";

function generateNewRowId(prefix: string) {
  const token = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  return `${prefix}${token}`;
}

type Props<T> = {
  columns: DataGridColumn<T>[];
  rows: T[];
  selectedIds: Set<string>;
  onToggleSelectAll: (ids: string[]) => void;
  onRowChange: (id: string, key: keyof T, value: any) => void;
  fillLastColumn?: boolean;
  fillColumnKey?: string;
  fillMinPx?: number;
  selectionDisabled?: boolean;

  newRow?: Partial<T>;
  onNewRowChange?: (key: keyof T, value: any) => void;
  onCommitNewRow?: (draft?: T) => void;
  showNewRow?: boolean;
  newRowIdPrefix?: string;

  disabled?: boolean;
  getRowStatus?: (row: T) => "new" | "edited" | undefined;
};

function SortIndicator({ dir }: { dir: "ASC" | "DESC" }) {
  return dir === "ASC" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

function NumberEditCell(props: any) {
  const key = String(props.column.key);
  const rowId = props.row?.id;
  const newRowId = props.newRowId;
  const selectOnFocus = props.selectOnFocus !== false;
  const onFocusHandled = props.onFocusHandled as undefined | (() => void);
  const [localValue, setLocalValue] = useState<string>(() => {
    const x = props.row?.[key];
    return x === null || x === undefined ? "" : String(x);
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const x = props.row?.[key];
    setLocalValue(x === null || x === undefined ? "" : String(x));
  }, [rowId, key, props.row]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (selectOnFocus) {
      input.select();
    } else {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
    onFocusHandled?.();
    // Intentionally not dependent on `selectOnFocus` so we don't re-select text on rerenders
    // (e.g. when we programmatically reopen the editor after committing the new row).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowId, key]);

  const update = (nextText: string) => {
    const cleaned0 = nextText.replace(/,/g, ".");
    let cleaned = cleaned0.replace(/[^0-9.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1)
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, "");

    setLocalValue(cleaned);

    if (cleaned === "") {
      const nextRow = { ...(props.row ?? {}), [key]: null };
      props.onRowChange(nextRow);
      return;
    }

    if (cleaned === ".") return;

    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      const nextRow = { ...(props.row ?? {}), [key]: parsed };
      props.onRowChange(nextRow);
    }
  };

  const handleBlur = () => {
    if (props.row?.id === newRowId) props.onFirstNewRowEdit?.(props.row, key);
    props.onClose?.(true, false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab" || event.key === "Enter") {
      if (props.row?.id === newRowId) props.onFirstNewRowEdit?.(props.row, key);
      // close editor so grid advances selection / triggers pending reopen
      props.onClose?.(true, false);
      event.preventDefault();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const keyChar = event.key;

    const isDecimalKey =
      keyChar === "." || keyChar === "," || keyChar === "Decimal";
    if (isDecimalKey) {
      const input = event.currentTarget;
      const selStart = input.selectionStart ?? 0;
      const selEnd = input.selectionEnd ?? 0;
      const selectedText = localValue.slice(selStart, selEnd);
      const willReplaceDot = selectedText.includes(".");
      if (!localValue.includes(".") || willReplaceDot) return;
      event.preventDefault();
      return;
    }

    if (keyChar.length === 1) {
      if (/^\d$/.test(keyChar)) return;
      event.preventDefault();
      return;
    }
    return;
  };

  return (
    <input
      className="rdg-text-editor"
      ref={inputRef}
      inputMode="decimal"
      value={localValue}
      onChange={(e) => update(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}

function SelectEditCell(props: any) {
  const key = String(props.column.key);
  const options = props.column?.editorOptions?.options ?? [];
  const value = props.row?.[key] ?? "";
  const newRowId = props.newRowId;
  const selectRef = useRef<HTMLSelectElement | null>(null);

  useLayoutEffect(() => {
    selectRef.current?.focus();
  }, []);

  return (
    <select
      className="rdg-text-editor"
      ref={selectRef}
      value={String(value)}
      onChange={(e) => {
        const nextRow = { ...(props.row ?? {}), [key]: e.target.value };
        props.onRowChange(nextRow);
      }}
      onBlur={() => {
        if (props.row?.id === newRowId) props.onFirstNewRowEdit?.(props.row, key);
        props.onClose?.(true, false);
      }}
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TextEditCell(props: any) {
  const key = String(props.column.key);
  const rowId = props.row?.id;
  const newRowId = props.newRowId;
  const selectOnFocus = props.selectOnFocus !== false;
  const onFocusHandled = props.onFocusHandled as undefined | (() => void);
  const [localValue, setLocalValue] = useState<string>(() => {
    const x = props.row?.[key];
    return x === null || x === undefined ? "" : String(x);
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const x = props.row?.[key];
    setLocalValue(x === null || x === undefined ? "" : String(x));
  }, [rowId, key, props.row]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (selectOnFocus) {
      input.select();
    } else {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
    onFocusHandled?.();
    // Intentionally not dependent on `selectOnFocus` so we don't re-select text on rerenders
    // (e.g. when we programmatically reopen the editor after committing the new row).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowId, key]);

  const handleBlur = () => {
    if (props.row?.id === newRowId) props.onFirstNewRowEdit?.(props.row, key);
    props.onClose?.(true, false);
  };

  return (
    <input
      className="rdg-text-editor"
      ref={inputRef}
      value={localValue}
      onChange={(e) => {
        const nextText = e.target.value;
        setLocalValue(nextText);
        const nextRow = { ...(props.row ?? {}), [key]: nextText };
        props.onRowChange(nextRow);
      }}
      onBlur={handleBlur}
      onKeyDown={(event) => {
            if (event.key === "Tab" || event.key === "Enter") {
              if (props.row?.id === newRowId) props.onFirstNewRowEdit?.(props.row, key);
              props.onClose?.(true, false);
              event.preventDefault();
              return;
            }
      }}
    />
  );
}

export function RdgGrid<T extends { id: string }>({
  columns,
  rows,
  selectedIds,
  onToggleSelectAll,
  onRowChange,
  fillLastColumn,
  fillColumnKey,
  fillMinPx,
  selectionDisabled,
  newRow,
  onNewRowChange,
  onCommitNewRow,
  showNewRow,
  newRowIdPrefix,
  disabled,
  getRowStatus,
}: Props<T>) {
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const previousSelectedRowIdxRef = useRef<number | null>(null);
  const [newRowDirty, setNewRowDirty] = useState(false);
  const [optimisticCommittedRows, setOptimisticCommittedRows] = useState<
    Map<string, T>
  >(() => new Map());
  const [optimisticActiveRowId, setOptimisticActiveRowId] = useState<
    string | null
  >(null);
  const newRowDirtyRef = useRef(false);
  const commitNewRowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const effectiveNewRowIdPrefix = newRowIdPrefix ?? DEFAULT_NEW_ROW_ID_PREFIX;
  const makeNewRowId = useCallback(
    () => generateNewRowId(effectiveNewRowIdPrefix),
    [effectiveNewRowIdPrefix]
  );
  const [newRowId, setNewRowId] = useState<string>(() =>
    generateNewRowId(effectiveNewRowIdPrefix)
  );
  const newRowIdRef = useRef(newRowId);
  useEffect(() => {
    newRowIdRef.current = newRowId;
  }, [newRowId]);
  const pendingReopenEditorRef = useRef<{
    rowId: string;
    colKey: string;
  } | null>(null);
  // A short-lived request recorded when the new-row draft is edited the
  // first time. We don't populate `pendingReopenEditorRef` immediately,
  // because an effect that watches `sortedRows` may run before the commit
  // completes and would reopen the draft row instead of the freshly-created
  // blank row. Instead we stash the request here and only set
  // `pendingReopenEditorRef` after the commit (see `commitNewRowDraft`).
  const pendingReopenRequestRef = useRef<{
    rowId: string;
    colKey: string;
  } | null>(null);
  const suppressSelectOnFocusRef = useRef<{
    rowId: string;
    colKey: string;
  } | null>(null);
  const clearSuppressSelectOnFocus = useCallback(() => {
    suppressSelectOnFocusRef.current = null;
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dataGridRef = useRef<DataGridHandle>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined
  );
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(
    () => new Map()
  );
  const [filters, setFilters] = useState<Record<string, ColumnFilterDraft>>({});
  const [filterMenu, setFilterMenu] = useState<ColumnFilterMenu | null>(null);
  const newRowDraftRef = useRef<T | null>(null);
  const optimisticCommittedRowsRef = useRef(optimisticCommittedRows);

  useEffect(() => {
    optimisticCommittedRowsRef.current = optimisticCommittedRows;
  }, [optimisticCommittedRows]);

  const allDisabled = Boolean(disabled);
  const shouldFillLastColumn = fillLastColumn ?? true;

  const shouldShowNewRow = Boolean(showNewRow ?? (newRow && onNewRowChange));

  useEffect(() => {
    setOptimisticCommittedRows((prev) => {
      if (!prev.size) return prev;
      const ids = new Set(rows.map((r) => r.id));
      let changed = false;
      const next = new Map(prev);
      for (const id of prev.keys()) {
        if (optimisticActiveRowId && id === optimisticActiveRowId) continue;
        if (ids.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [rows, optimisticActiveRowId]);

  useLayoutEffect(() => {
    const measureInlineSize = (el: HTMLElement) => {
      const { clientWidth, offsetWidth } = el;
      const { width } = el.getBoundingClientRect();
      return width - offsetWidth + clientWidth;
    };

    const update = () => {
      const el = dataGridRef.current?.element ?? containerRef.current;
      if (!el) return;
      setContainerWidth(measureInlineSize(el));
    };

    const ro = new ResizeObserver(() => update());

    if (containerRef.current) ro.observe(containerRef.current);

    const tryObserveGrid = () => {
      const el = dataGridRef.current?.element;
      if (el) ro.observe(el);
    };

    update();
    tryObserveGrid();

    const raf = requestAnimationFrame(() => {
      tryObserveGrid();
      update();
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const gridRef = useRef({
    columns,
    rows,
    onToggleSelectAll,
    onRowChange,
    newRow,
    onNewRowChange,
    onCommitNewRow,
    getRowStatus,
  });
  gridRef.current = {
    columns,
    rows,
    onToggleSelectAll,
    onRowChange,
    newRow,
    onNewRowChange,
    onCommitNewRow,
    getRowStatus,
  };

  const rowsWithNewRowRef = useRef<T[]>(rows);
  rowsWithNewRowRef.current = rows;

  const colTypeByKey = useMemo(() => {
    const map = new Map<string, DataGridColumn<T>["type"]>();
    columns.forEach((c) => map.set(String(c.key), c.type));
    return map;
  }, [columns]);

  const dataColumnKeys = useMemo(
    () => columns.map((c) => String(c.key)),
    [columns]
  );
  const lastDataColumnKey = dataColumnKeys[dataColumnKeys.length - 1];
  const resolvedFillKey =
    fillColumnKey ?? (shouldFillLastColumn ? lastDataColumnKey : undefined);

  const rowKeyGetter = useCallback((row: T) => row.id, []);

  const optimisticRowIdSet = useMemo(
    () => new Set(Array.from(optimisticCommittedRows.keys())),
    [optimisticCommittedRows]
  );

  const rowsWithNewRow = useMemo(() => {
    let baseRows = rows;
    if (optimisticCommittedRows.size) {
      const ids = new Set(rows.map((r) => r.id));
      const next = rows.map((r) => optimisticCommittedRows.get(r.id) ?? r);
      for (const [id, optimisticRow] of optimisticCommittedRows) {
        if (!ids.has(id)) next.push(optimisticRow);
      }
      baseRows = next;
    }
    if (!shouldShowNewRow) return baseRows;
    const newRowModel = { id: newRowId, ...(newRow as any) } as T;
    return [...baseRows, newRowModel];
  }, [rows, optimisticCommittedRows, newRow, shouldShowNewRow, newRowId]);
  rowsWithNewRowRef.current = rowsWithNewRow as T[];

  const filteredRowsWithNewRow = useMemo(() => {
    const active = Object.entries(filters).filter(
      ([_, f]) => f.text.trim().length > 0 || f.values.length > 0
    );
    if (!active.length) return rowsWithNewRow;

    const data = rowsWithNewRow.filter((r) => r.id !== newRowId);
    const newRowModel = rowsWithNewRow.find((r) => r.id === newRowId);

    const filtered = data.filter((row) => {
      return active.every(([colKey, f]) => {
        const raw = (row as any)[colKey];
        const value = raw === null || raw === undefined ? "" : String(raw);

        const text = f.text.trim().toLowerCase();
        if (text && !value.toLowerCase().includes(text)) return false;

        if (f.values.length > 0 && !f.values.includes(value)) return false;
        return true;
      });
    });

    return newRowModel ? [...filtered, newRowModel] : filtered;
  }, [rowsWithNewRow, filters, newRowId]);

  const sortedRows = useMemo(() => {
    const sort = sortColumns[0];
    if (!sort) return filteredRowsWithNewRow;

    const key = sort.columnKey;
    const dir = sort.direction === "ASC" ? 1 : -1;

    const data = filteredRowsWithNewRow.filter((r) => r.id !== newRowId);
    const newRowModel = filteredRowsWithNewRow.find((r) => r.id === newRowId);

    const sorted = data.slice().sort((a, b) => {
      const av = (a as any)[key];
      const bv = (b as any)[key];
      if (av === bv) return 0;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return newRowModel ? [...sorted, newRowModel] : sorted;
  }, [filteredRowsWithNewRow, sortColumns, newRowId]);

  const getNewRowDraft = useCallback(() => {
    const id = newRowIdRef.current;
    return (
      newRowDraftRef.current ??
      rowsWithNewRowRef.current.find((r: any) => r.id === id)
    );
  }, []);

  const commitNewRowDraft = useCallback(() => {
    if (commitNewRowTimerRef.current) {
      clearTimeout(commitNewRowTimerRef.current);
      commitNewRowTimerRef.current = null;
    }
    const draft = getNewRowDraft();
    if (draft) {
      setOptimisticCommittedRows((prev) => {
        if (prev.has(draft.id)) return prev;
        const next = new Map(prev);
        next.set(draft.id, draft);
        return next;
      });
    }
    const nextId = makeNewRowId();
    newRowIdRef.current = nextId;
    setNewRowId(nextId);
    // If there was a prior request to reopen the editor (the user edited the
    // draft), convert that request into a real pending-reopen entry that
    // points at the freshly-created blank row. We set the real
    // `pendingReopenEditorRef` only after creating `nextId` so the effect
    // which watches `sortedRows` won't reopen the draft row prematurely.
    if (pendingReopenRequestRef.current) {
      pendingReopenEditorRef.current = {
        rowId: nextId,
        colKey: pendingReopenRequestRef.current.colKey,
      };
      pendingReopenRequestRef.current = null;
    }
    gridRef.current.onCommitNewRow?.(draft);
    newRowDirtyRef.current = false;
    setNewRowDirty(false);
    newRowDraftRef.current = null;
  }, [getNewRowDraft, makeNewRowId]);

  const scheduleCommitOnFirstEdit = useCallback(
    (draft: T, colKey?: string) => {
      if (!shouldShowNewRow) return;
      if (newRowDirtyRef.current) return;
      if (colKey && colKey.trim()) {
        pendingReopenRequestRef.current = { rowId: (draft as any).id, colKey };
      }
      newRowDraftRef.current = draft as any;
      newRowDirtyRef.current = true;
      setNewRowDirty(true);
      commitNewRowTimerRef.current = setTimeout(() => {
        commitNewRowTimerRef.current = null;
        commitNewRowDraft();
      }, 0);

      // Special-case single-data-column grids: move selection to the next row
      // so the grid's selection change flows and the pending reopen/commit
      // behavior will open the editor on the next new row.
      try {
        const dataCols = dataColumnKeys.length;
        if (dataCols === 1) {
          const rowIdx = sortedRows.findIndex((r) => r.id === (draft as any).id);
          const nextRowIdx = Math.min(rowIdx + 1, Math.max(0, sortedRows.length - 1));
          const colIdx = rdgColumnsRef.current.findIndex(
            (col) => String(col.key) === (colKey ?? dataColumnKeys[0])
          );
          if (colIdx !== -1 && typeof nextRowIdx === "number") {
            // Move selection to next row (don't enable editor here).
            dataGridRef.current?.selectCell({ rowIdx: nextRowIdx, idx: colIdx }, { enableEditor: false, shouldFocusCell: true });
          }
        }
      } catch (e) {
        // swallow any errors; this is best-effort UX improvement
      }
    },
    [commitNewRowDraft, shouldShowNewRow]
  );

  useEffect(() => {
    const pending = pendingReopenEditorRef.current;
    if (!pending) return;
    const rowIdx = sortedRows.findIndex((r) => r.id === pending.rowId);
    if (rowIdx === -1) return;
    const colIdx = rdgColumnsRef.current.findIndex(
      (col) => String(col.key) === pending.colKey
    );
    if (colIdx === -1) return;
    setOptimisticActiveRowId(pending.rowId);
    suppressSelectOnFocusRef.current = pending;
    dataGridRef.current?.selectCell(
      { rowIdx, idx: colIdx },
      { enableEditor: true, shouldFocusCell: true }
    );
    pendingReopenEditorRef.current = null;
  }, [sortedRows]);

  const headerAutoWidth = useCallback((header: string) => {
    const label = header ?? "";
    const charWidth = 7; // approx for 12.5px Inter
    const cellPadding = 16; // 8px left + 8px right
    const sortIcon = 18;
    const filterIcon = 24;
    const resizeHandle = 10;
    const base =
      label.length * charWidth +
      cellPadding +
      sortIcon +
      filterIcon +
      resizeHandle;
    const min = 90;
    const max = 520;
    return Math.max(min, Math.min(max, base));
  }, []);

  const baseWidthByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of columns) {
      const key = String(c.key);
      const baseWidth = c.width ?? headerAutoWidth(c.header);
      map.set(key, baseWidth);
    }
    return map;
  }, [columns, headerAutoWidth]);

  const computedFillColumnWidth = useMemo(() => {
    if (!containerWidth || dataColumnKeys.length === 0 || !resolvedFillKey)
      return undefined;

    const fixed = 6 + 34; // status + selection
    const other = dataColumnKeys
      .filter((k) => k !== resolvedFillKey)
      .reduce(
        (sum, key) =>
          sum + (columnWidths.get(key)?.width ?? baseWidthByKey.get(key) ?? 0),
        0
      );

    const fillBase = baseWidthByKey.get(resolvedFillKey) ?? 0;
    const fillMin = fillMinPx ?? fillBase;
    const available = containerWidth - fixed - other;
    return Math.max(fillMin, available);
  }, [
    containerWidth,
    dataColumnKeys,
    resolvedFillKey,
    columnWidths,
    baseWidthByKey,
    fillMinPx,
  ]);

  const effectiveColumnWidths = useMemo<ColumnWidths>(() => {
    const keys = new Set(dataColumnKeys);
    const next = new Map<string, ColumnWidth>();

    for (const [key, value] of columnWidths) {
      if (!keys.has(key)) continue;
      if (key === lastDataColumnKey) continue;
      if (resolvedFillKey && key === resolvedFillKey) continue;
      next.set(key, value);
    }

    if (resolvedFillKey && computedFillColumnWidth !== undefined) {
      next.set(resolvedFillKey, {
        type: "resized",
        width: computedFillColumnWidth,
      });
    }

    return next;
  }, [
    columnWidths,
    dataColumnKeys,
    lastDataColumnKey,
    resolvedFillKey,
    computedFillColumnWidth,
  ]);

  useEffect(() => {
    const keys = new Set(dataColumnKeys);
    setColumnWidths((prev) => {
      let changed = false;
      const next = new Map<string, ColumnWidth>();
      for (const [key, value] of prev) {
        if (!keys.has(key)) {
          changed = true;
          continue;
        }
        next.set(key, value);
      }
      return changed ? next : prev;
    });
  }, [dataColumnKeys]);

  const closeFilterMenu = useCallback(() => setFilterMenu(null), []);

  const openFilterMenu = useCallback(
    (colKey: string, title: string, target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      const colDef = gridRef.current.columns.find(
        (c) => String(c.key) === colKey
      );
      const optionLabelByValue = new Map<string, string>();
      colDef?.options?.forEach((o) =>
        optionLabelByValue.set(String(o.value), o.label)
      );

      const values = new Map<string, string>();
      for (const row of gridRef.current.rows as any[]) {
        const raw = row[colKey];
        const value = raw === null || raw === undefined ? "" : String(raw);
        if (!values.has(value))
          values.set(value, optionLabelByValue.get(value) ?? value);
        if (values.size >= 200) break;
      }

      const options = Array.from(values.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label: label || "(empty)" }));

      const draft = filters[colKey] ?? { text: "", values: [] };
      setFilterMenu({
        colId: colKey,
        title,
        position: { x: rect.left, y: rect.bottom + 6 },
        values: options,
        draft,
      });
    },
    [filters]
  );

  const applyFilter = useCallback(
    (draft: ColumnFilterDraft) => {
      if (!filterMenu) return;
      setFilters((prev) => {
        const next = { ...prev };
        const text = (draft.text ?? "").trim();
        const values = draft.values ?? [];
        const hasFilter = text.length > 0 || values.length > 0;
        if (hasFilter) next[filterMenu.colId] = { text, values };
        else delete next[filterMenu.colId];
        return next;
      });
      closeFilterMenu();
    },
    [filterMenu, closeFilterMenu]
  );

  const clearFilter = useCallback(() => {
    if (!filterMenu) return;
    setFilters((prev) => {
      const next = { ...prev };
      delete next[filterMenu.colId];
      return next;
    });
    closeFilterMenu();
  }, [filterMenu, closeFilterMenu]);

  const rdgColumns = useMemo((): readonly Column<T>[] => {
    const statusCol: Column<T> = {
      key: "__status",
      name: "",
      width: 6,
      minWidth: 6,
      maxWidth: 6,
      frozen: true,
      resizable: false,
      sortable: false,
      headerCellClass: "rdg-status-header",
      cellClass: "rdg-status-cell",
      renderCell: ({ row }) => {
        if (row.id === newRowId) return null;
        const status =
          gridRef.current.getRowStatus?.(row) ??
          (optimisticRowIdSet.has(row.id) ? "new" : undefined);
        const color =
          status === "new"
            ? "var(--indicator-new)"
            : status === "edited"
            ? "var(--indicator-edited)"
            : "transparent";
        return (
          <div style={{ width: "100%", height: "100%", background: color }} />
        );
      },
    };

    const selectCol: Column<T> = {
      ...(SelectColumn as unknown as Column<T>),
      frozen: true,
      width: 34,
      minWidth: 34,
      maxWidth: 34,
      headerCellClass: "rdg-select-header",
      cellClass: "rdg-select-cell",
    };

    const cols: Column<T>[] = columns.map((c) => {
      const key = String(c.key);
      const isLastDataCol = key === lastDataColumnKey;
      const baseWidth = c.width ?? headerAutoWidth(c.header);
      const sortable = c.enableSort !== false;
      const editable = !allDisabled;
      const maxWidth = 520;
      const resizeAllowed = !isLastDataCol && key !== resolvedFillKey;
      const filterActive = Boolean(
        filters[key]?.text.trim() || (filters[key]?.values?.length ?? 0) > 0
      );
      const alignClass =
        c.align === "center"
          ? "rdg-align-center"
          : c.align === "right"
          ? "rdg-align-right"
          : undefined;
      const headerAlignClass =
        c.align === "center"
          ? "rdg-header-align-center"
          : c.align === "right"
          ? "rdg-header-align-right"
          : undefined;

      const headerNode = ({ sortDirection }: any) => (
        <div className="rdg-header-cell-inner">
          <span className="rdg-header-cell-label">{c.header}</span>
          {sortDirection ? (
            <span className="rdg-sort-indicator">
              <SortIndicator dir={sortDirection as any} />
            </span>
          ) : null}
          <button
            className={`filter-btn ${filterActive ? "active" : ""}`}
            type="button"
            title="Filter"
            onClick={(e) => {
              e.stopPropagation();
              openFilterMenu(key, c.header, e.currentTarget);
            }}
          >
            <Filter size={14} />
          </button>
        </div>
      );

      if (c.options?.length) {
        const labelByValue = new Map(c.options.map((o) => [o.value, o.label]));
        return {
          key,
          name: c.header,
          width: baseWidth,
          minWidth: baseWidth,
          ...(resizeAllowed ? { maxWidth } : {}),
          resizable: resizeAllowed,
          sortable,
          editable,
          renderHeaderCell: headerNode,
          renderEditCell: (props: any) => (
            <SelectEditCell
              {...props}
              onFirstNewRowEdit={scheduleCommitOnFirstEdit}
              newRowId={newRowId}
              column={{
                ...props.column,
                editorOptions: { options: c.options },
              }}
            />
          ),
          renderCell: ({ row }) => {
            const value = (row as any)[key];
            if (value === null || value === undefined) return "";
            return labelByValue.get(String(value)) ?? String(value);
          },
          ...(alignClass ? { cellClass: alignClass } : {}),
          ...(headerAlignClass ? { headerCellClass: headerAlignClass } : {}),
        };
      }

      if (c.type === "boolean") {
        return {
          key,
          name: c.header,
          width: baseWidth,
          minWidth: baseWidth,
          ...(resizeAllowed ? { maxWidth } : {}),
          resizable: resizeAllowed,
          sortable,
          frozen: false,
          editable: false,
          renderHeaderCell: headerNode,
          renderCell: ({ row }) => {
            const checked = Boolean((row as any)[key]);
            return (
              <input
                className="table-checkbox"
                type="checkbox"
                checked={checked}
                disabled={allDisabled}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (row.id === newRowId) {
                    const nextRow = {
                      ...(row as any),
                      [key]: e.target.checked,
                    };
                    gridRef.current.onNewRowChange?.(
                      c.key as any,
                      e.target.checked
                    );
                    // scheduleCommitOnFirstEdit(nextRow as any);
                  } else {
                    gridRef.current.onRowChange(
                      row.id,
                      c.key,
                      e.target.checked
                    );
                  }
                }}
              />
            );
          },
          ...(alignClass ? { cellClass: alignClass } : {}),
          ...(headerAlignClass ? { headerCellClass: headerAlignClass } : {}),
        };
      }

      if (c.type === "number") {
        return {
          key,
          name: c.header,
          width: baseWidth,
          minWidth: baseWidth,
          ...(resizeAllowed ? { maxWidth } : {}),
          resizable: resizeAllowed,
          sortable,
          editable,
          renderHeaderCell: headerNode,
          renderEditCell: (props: any) => (
            <NumberEditCell
              {...props}
              onFirstNewRowEdit={scheduleCommitOnFirstEdit}
              newRowId={newRowId}
              selectOnFocus={
                !(
                  suppressSelectOnFocusRef.current?.rowId === props.row?.id &&
                  suppressSelectOnFocusRef.current?.colKey ===
                    String(props.column?.key)
                )
              }
              onFocusHandled={
                suppressSelectOnFocusRef.current?.rowId === props.row?.id &&
                suppressSelectOnFocusRef.current?.colKey ===
                  String(props.column?.key)
                  ? clearSuppressSelectOnFocus
                  : undefined
              }
            />
          ),
          renderCell: ({ row }) => {
            const value = (row as any)[key];
            if (value === null || value === undefined) return "";
            return String(value);
          },
          ...(alignClass ? { cellClass: alignClass } : {}),
          ...(headerAlignClass ? { headerCellClass: headerAlignClass } : {}),
        };
      }

      return {
        key,
        name: c.header,
        width: baseWidth,
        minWidth: baseWidth,
        ...(resizeAllowed ? { maxWidth } : {}),
        resizable: resizeAllowed,
        sortable,
        editable,
        renderHeaderCell: headerNode,
        renderEditCell: (props: any) => {
          const k = String(props.column.key);
          const row = props.row ?? {};
          const value = (row as any)[k];
          const safeRow =
            value === null || value === undefined ? { ...row, [k]: "" } : row;
          return (
            <TextEditCell
              {...props}
              row={safeRow}
              onFirstNewRowEdit={scheduleCommitOnFirstEdit}
              newRowId={newRowId}
              selectOnFocus={
                !(
                  suppressSelectOnFocusRef.current?.rowId === props.row?.id &&
                  suppressSelectOnFocusRef.current?.colKey ===
                    String(props.column?.key)
                )
              }
              onFocusHandled={
                suppressSelectOnFocusRef.current?.rowId === props.row?.id &&
                suppressSelectOnFocusRef.current?.colKey ===
                  String(props.column?.key)
                  ? clearSuppressSelectOnFocus
                  : undefined
              }
            />
          );
        },
        renderCell: ({ row }) => {
          const value = (row as any)[key];
          if (value === null || value === undefined) return "";
          return String(value);
        },
        ...(alignClass ? { cellClass: alignClass } : {}),
        ...(headerAlignClass ? { headerCellClass: headerAlignClass } : {}),
      };
    });

    return [statusCol, selectCol, ...cols];
  }, [
    allDisabled,
    columns,
    headerAutoWidth,
    filters,
    openFilterMenu,
    lastDataColumnKey,
    resolvedFillKey,
    newRowId,
    optimisticRowIdSet,
  ]);
  const rdgColumnsRef = useRef(rdgColumns);
  rdgColumnsRef.current = rdgColumns;

  const onRowsChange = useCallback(
    (nextRows: T[], data: RowsChangeData<T>) => {
      const colKey = data.column.key as keyof T;
      const colKeyString = String(data.column.key);
      const optimisticUpdates: Array<{ id: string; row: T }> = [];
      for (const idx of data.indexes) {
        const row = nextRows[idx];
        const value = (row as any)[String(colKey)];
        if (row.id === newRowIdRef.current) {
          gridRef.current.onNewRowChange?.(colKey, value);
          newRowDraftRef.current = row as any;

          // NEW: mark the new row as dirty so onSelectedCellChange will commit it
          if (!newRowDirtyRef.current) {
            newRowDirtyRef.current = true;
            setNewRowDirty(true);
          }
        } else {
          gridRef.current.onRowChange(row.id, colKey, value);
          if (optimisticCommittedRowsRef.current.has(row.id)) {
            optimisticUpdates.push({ id: row.id, row });
          }
        }
      }
      if (optimisticUpdates.length) {
        setOptimisticCommittedRows((prev) => {
          let changed = false;
          const next = new Map(prev);
          for (const update of optimisticUpdates) {
            const existing = next.get(update.id);
            if (existing !== update.row) {
              next.set(update.id, update.row);
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      }
    },
    [scheduleCommitOnFirstEdit]
  );

  const onSelectedRowsChange = useCallback((set: Set<any>) => {
    const ids = Array.from(set)
      .map(String)
      .filter((id) => id !== newRowIdRef.current);
    gridRef.current.onToggleSelectAll(ids);
  }, []);

  const onCellClick = useCallback(
    (args: any, event: any) => {
      if (allDisabled) return;
      const key = String(args.column?.key ?? "");
      if (!key) return;
      if (key === "__status" || key === "select-row") return;
      if (colTypeByKey.get(key) === "boolean") return;
      if (event?.isGridDefaultPrevented?.()) return;
      args.selectCell?.(true);
    },
    [allDisabled, colTypeByKey]
  );

  const onSelectedCellChange = useCallback(
    (args: any) => {
      if (!shouldShowNewRow) return;
      if (
        optimisticActiveRowId &&
        pendingReopenEditorRef.current === null &&
        args?.row?.id !== optimisticActiveRowId
      ) {
        setOptimisticActiveRowId(null);
      }
      const prevRowIdx = previousSelectedRowIdxRef.current;
      previousSelectedRowIdxRef.current = args.rowIdx;
      if (!newRowDirtyRef.current) return;
      const currentNewRowId = newRowIdRef.current;
      const newRowIdx = sortedRows.findIndex((r) => r.id === currentNewRowId);
      if (args?.row?.id !== currentNewRowId) {
        commitNewRowDraft();
      } else if (prevRowIdx === newRowIdx && args.rowIdx !== newRowIdx) {
        commitNewRowDraft();
      }
    },
    [sortedRows, shouldShowNewRow, commitNewRowDraft, optimisticActiveRowId]
  );

  useEffect(() => {
    newRowDirtyRef.current = newRowDirty;
  }, [newRowDirty]);

  useEffect(() => {
    const hasContent =
      newRow &&
      Object.values(newRow).some((v) => {
        if (v === undefined || v === null) return false;
        const str = String(v);
        return str.trim().length > 0;
      });
    if (!hasContent) {
      setNewRowDirty(false);
      newRowDirtyRef.current = false;
      newRowDraftRef.current = null;
    }
  }, [newRow]);

  return (
    <>
      <div
        ref={containerRef}
        className="rdg-container rdg-pane"
        style={{ flex: 1, minHeight: 0 }}
      >
        <DataGrid<T>
          ref={dataGridRef}
          columns={rdgColumns}
          rows={sortedRows}
          rowKeyGetter={rowKeyGetter}
          columnWidths={effectiveColumnWidths}
          onColumnWidthsChange={setColumnWidths}
          selectedRows={selectedIds}
          isRowSelectionDisabled={selectionDisabled ? () => true : undefined}
          onSelectedRowsChange={onSelectedRowsChange}
          sortColumns={sortColumns}
          onSortColumnsChange={setSortColumns}
          onRowsChange={onRowsChange}
          onCellClick={onCellClick}
          enableVirtualization
          headerRowHeight={32}
          rowHeight={28}
          className="rdg-grid rdg-grid--app"
          onSelectedCellChange={onSelectedCellChange}
        />
      </div>

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
