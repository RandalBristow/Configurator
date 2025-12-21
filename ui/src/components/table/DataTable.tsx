import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  FileSpreadsheet,
  FileText,
  Filter,
  Import,
  Pencil,
  Trash2,
  ThumbsDown,
  ThumbsUp,
  Upload,
  X,
} from "lucide-react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  enableSort?: boolean;
  render?: (row: T) => React.ReactNode;
  exportValue?: (row: T) => string | number | boolean | null | undefined;
  input?: (value: any, onChange: (val: any) => void) => React.ReactNode;
  filterLabel?: (value: any, row?: T) => string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  title?: string;
  badge?: React.ReactNode;
  selectedId?: string;
  getRowId: (row: T) => string;
  onSelect?: (id: string) => void;
  onSave: (id: string, changes: Partial<T>) => void;
  onDelete: (id: string) => void;
  getDeleteConfirm?: (
    row: T,
  ) =>
    | { title: string; description?: string }
    | Promise<{ title: string; description?: string }>;
  onCreate: (data: Partial<T>) => void;
  getIsActive?: (row: T) => boolean;
  onToggleActive?: (id: string, next: boolean) => void;
  onImport?: (records: Partial<T>[]) => Promise<void> | void;
  isLoading?: boolean;
  error?: string;
  pageSizeOptions?: number[];
  enableFilters?: boolean;
  newRowDefaults?: Partial<T>;
  validateCreate?: (data: Partial<T>) => string | null;
  validateEdit?: (data: Partial<T>, existing: T) => string | null;
};

export function DataTable<T>({
  columns,
  rows,
  title,
  badge,
  selectedId,
  getRowId,
  onSelect,
  onSave,
  onDelete,
  getDeleteConfirm,
  onCreate,
  getIsActive,
  onToggleActive,
  onImport,
  isLoading,
  error,
  pageSizeOptions = [5, 10, 25, 50],
  enableFilters = true,
  newRowDefaults,
  validateCreate,
  validateEdit,
}: DataTableProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const draftsRef = React.useRef<Record<string, Record<string, any>>>({});
  const newRowDraftRef = React.useRef<Record<string, any>>({ ...(newRowDefaults ?? {}) });
  const [, setDraftsVersion] = useState(0);
  const [, setNewRowVersion] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSizeOptions[1] ?? 10,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [filterMenu, setFilterMenu] = useState<{
    colId: string;
    title: string;
    position: { x: number; y: number };
    values: { value: string; label: string }[];
    draft: { text: string; values: Set<string> };
  } | null>(null);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const requestConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  const requestDeleteConfirm = async (row: T) => {
    const id = getRowId(row);
    try {
      const message = getDeleteConfirm
        ? await Promise.resolve(getDeleteConfirm(row))
        : { title: "Delete record?", description: "This cannot be undone." };
      requestConfirm(message.title, message.description ?? "", () => onDelete(id));
    } catch (err) {
      toast.error(String(err));
    }
  };

  const columnDefs = useMemo<ColumnDef<T>[]>(() => {
    return columns.map((col) => {
      const explicitSize = typeof col.width === "number" ? col.width : undefined;
      const isDescription = col.key === "description";
      const isCompact = col.key === "sortOrder" || col.key === "order" || col.key === "isActive";
      const minSize = explicitSize ?? (isDescription ? 240 : 80);
      const maxSize = explicitSize ?? (isDescription ? undefined : 240);
      return {
        id: String(col.key),
        header: col.header,
        accessorFn: (row) => (row as any)[col.key],
        enableSorting: col.enableSort ?? true,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const val = row.getValue(columnId);
          const asString = val === null || val === undefined ? "" : String(val);
          const target = asString.toLowerCase();
          const text = (filterValue.text ?? "").toLowerCase();
          const values: string[] = Array.isArray(filterValue.values) ? filterValue.values : [];
          if (text && !target.includes(text)) return false;
          if (values.length && !values.some((v) => v.toLowerCase() === target)) return false;
          return true;
        },
        size: explicitSize,
        minSize,
        maxSize,
        meta: {
          align: col.align,
          isFlexGrow: isDescription,
          compact: isCompact,
          explicitSize,
          filterLabel: col.filterLabel,
        },
        cell: ({ row, getValue }) => {
          const id = getRowId(row.original);
          const isEditing = editingId === id;
          const draft = draftsRef.current[id] ?? {};
          const rawValue = isEditing ? draft[col.key as string] ?? getValue() : getValue();
          if (isEditing && col.input) {
            return (
              <div
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              >
                {col.input(rawValue, (val) => {
                  draftsRef.current[id] = {
                    ...(draftsRef.current[id] ?? {}),
                    [col.key as string]: val,
                  };
                  setDraftsVersion((v) => v + 1);
                })}
              </div>
            );
          }
          if (col.render) return col.render(row.original);
          return rawValue ?? "";
      },
      };
    });
  }, [columns, editingId, getRowId]);

  const defaultColumn = useMemo(
    () => ({
      minSize: 60,
      maxSize: 400,
      size: 140,
      enableResizing: true,
    }),
    [],
  );

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    defaultColumn,
    getRowId: (row) => getRowId(row),
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange",
  });

  const closeFilterMenu = () => setFilterMenu(null);

  const openFilterMenu = (colId: string, title: string, eventTarget: HTMLElement) => {
    const col = table.getColumn(colId);
    if (!col) return;
    const current = (col.getFilterValue() as any) ?? {};
    const rect = eventTarget.getBoundingClientRect();
    const popWidth = 260;
    const popHeight = 300;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - popWidth - 8);
    const top = Math.min(Math.max(8, rect.bottom + 4), window.innerHeight - popHeight);
    const columnDef = table.getAllColumns().find((c) => c.id === colId)?.columnDef as any;
    const filterLabel: ((value: any, row?: T) => string) | undefined = columnDef?.meta?.filterLabel;

    const uniques = new Map<string, string>();
    rows.forEach((r) => {
      const raw = (r as any)[colId as keyof T];
      const value = raw === null || raw === undefined ? "" : String(raw);
      if (!value) return;
      const label = filterLabel ? filterLabel(raw, r) : value;
      if (!uniques.has(value)) uniques.set(value, label);
    });
    const allValues = Array.from(uniques.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));

    setFilterMenu({
      colId,
      title,
      position: { x: left, y: top },
      values: allValues,
      draft: {
        text: current.text ?? "",
        values: new Set<string>(current.values ?? []),
      },
    });
  };

  const applyFilter = () => {
    if (!filterMenu) return;
    const col = table.getColumn(filterMenu.colId);
    if (!col) return;
    const text = filterMenu.draft.text.trim();
    const values = Array.from(filterMenu.draft.values);
    const hasFilter = text.length > 0 || values.length > 0;
    col.setFilterValue(hasFilter ? { text, values } : undefined);
    closeFilterMenu();
  };

  const clearFilter = () => {
    if (!filterMenu) return;
    const col = table.getColumn(filterMenu.colId);
    col?.setFilterValue(undefined);
    closeFilterMenu();
  };

  const startEdit = (id: string) => {
    const row = rows.find((r) => getRowId(r) === id);
    if (!row) return;
    const initial: Record<string, any> = {};
    columns.forEach((c) => {
      if (c.input) initial[c.key as string] = (row as any)[c.key];
    });
    draftsRef.current[id] = initial;
    setDraftsVersion((v) => v + 1);
    setEditingId(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = (id: string) => {
    const draft = draftsRef.current[id] ?? {};
    const existing = rows.find((r) => getRowId(r) === id);
    if (existing) {
      const combined = { ...existing, ...draft } as Partial<T>;
      const err = validateEdit
        ? validateEdit(combined, existing)
        : validateCreate
          ? validateCreate(combined)
          : null;
      if (err) {
        toast.error(err);
        return;
      }
    }
    requestConfirm("Save changes?", "This will update the record.", () => {
      onSave(id, draft as Partial<T>);
      setEditingId(null);
    });
  };

  const handleCreate = () => {
    const payload = { ...(newRowDefaults ?? {}), ...newRowDraftRef.current } as Partial<T>;
    if (validateCreate) {
      const errorMessage = validateCreate(payload);
      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }
    }
    const nameLike = (payload as any)?.name ?? (payload as any)?.label ?? "";
    const title = nameLike ? `Add "${nameLike}"?` : "Add new record?";
    requestConfirm(title, "This will create the record.", () => {
      onCreate(payload);
      newRowDraftRef.current = { ...(newRowDefaults ?? {}) };
      setNewRowVersion((v) => v + 1);
    });
  };

  useEffect(() => {
    if (!editingId) return;
    const handleClickOutsideEdit = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const rowEl = target.closest("tr[data-rowid]") as HTMLElement | null;
      const clickedRowId = rowEl?.dataset.rowid;
      // If click is outside the currently edited row, cancel edits.
      if (editingId && clickedRowId !== editingId) {
        cancelEdit();
      }
    };
    document.addEventListener("mousedown", handleClickOutsideEdit);
    return () => document.removeEventListener("mousedown", handleClickOutsideEdit);
  }, [editingId]);

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

  const exportCSV = () => {
    try {
      const data = rows.map((row) => {
        const obj: Record<string, any> = {};
        columns.forEach((c) => {
          const val = c.exportValue ? c.exportValue(row) : (row as any)[c.key as string];
          obj[c.header] = val;
        });
        return obj;
      });
      const sheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(sheet);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (err) {
      toast.error(`CSV export failed: ${String(err)}`);
    }
  };

  const exportXLSX = () => {
    const data = rows.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((c) => {
        const val = c.exportValue ? c.exportValue(row) : (row as any)[c.key as string];
        obj[c.header] = val;
      });
      return obj;
    });
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
    XLSX.writeFile(wb, "export.xlsx");
  };

  const parsePlainTextTable = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return [];
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    let headers = lines[0].split(delimiter).map((h) => h.trim());
    const expectedHeaders = columns.map((c) => c.header.toLowerCase());
    const headerMatches = headers.some((h) => expectedHeaders.includes(h.toLowerCase()));

    const dataLines = headerMatches ? lines.slice(1) : lines;
    if (!headerMatches) {
      headers = columns.map((c) => c.header);
    }

    const errors: string[] = [];
    const data = dataLines.map((line, idx) => {
      const values = line.split(delimiter);
      if (values.length !== headers.length) {
        errors.push(`Row ${idx + 1}: expected ${headers.length} columns, got ${values.length}`);
      }
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        obj[h] = (values[i] ?? "").trim();
      });
      return obj;
    });

    if (errors.length) {
      throw new Error(`Column mismatch: ${errors.join(" | ")}`);
    }

    return data;
  };

  const handleImportClipboard = async () => {
    if (!onImport) {
      toast.error("Import not available for this table");
      return;
    }
    if (!navigator.clipboard?.readText) {
      toast.error("Clipboard API not available");
      return;
    }
      setImporting(true);
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parsePlainTextTable(text);
      if (!parsed.length) throw new Error("No rows detected");
      requestConfirm(
        `Import ${parsed.length} row(s)?`,
        "This will add/update records.",
        async () => {
          await onImport?.(parsed as Partial<T>[]);
        },
      );
    } catch (err) {
      toast.error(`Import failed: ${String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onImport) {
      toast.error("Import not available for this table");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      let records: any[] = [];
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = new TextDecoder().decode(buffer);
        records = parsePlainTextTable(text);
      } else {
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        records = XLSX.utils.sheet_to_json(sheet);
      }
      if (!records.length) throw new Error("No rows detected");
      requestConfirm(
        `Import ${records.length} row(s)?`,
        "This will add/update records.",
        async () => {
          await onImport?.(records as Partial<T>[]);
        },
      );
    } catch (err) {
      toast.error(`Import failed: ${String(err)}`);
    } finally {
      event.target.value = "";
      setImporting(false);
    }
  };

  const copyTableToClipboard = async () => {
    const headers = columns.map((c) => c.header);
    const keys = columns.map((c) => c.key as string);
    const lines = rows.map((row) =>
      keys
        .map((k) => {
          const col = columns.find((c) => c.key === k);
          const val = col?.exportValue ? col.exportValue(row) : (row as any)[k];
          return val === undefined || val === null ? "" : String(val);
        })
        .join("\t"),
    );
    const text = [headers.join("\t"), ...lines].join("\n");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast.success("Table copied to clipboard");
    } catch (err) {
      toast.error(`Copy failed: ${String(err)}`);
    }
  };

  return (
    <div className="table-wrapper">
      {title && (
        <div className="table-title">
          {badge && <span className="table-badge">{badge}</span>}
          <span>{title}</span>
        </div>
      )}
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="toolbar-group">
            <button
              className="btn secondary icon-btn"
              onClick={handleImportClipboard}
              disabled={importing}
              title="Import from clipboard"
            >
              <Import size={16} />
              <Clipboard size={16} />
            </button>
            <label className="btn secondary icon-btn file-btn" title="Import from file">
              <Import size={16} />
              <FileText size={16} />
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleImportFile}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <div className="toolbar-separator" />
          <div className="toolbar-group">
            <button className="btn secondary icon-btn" onClick={copyTableToClipboard} title="Copy to clipboard">
              <Upload size={16} />
              <Clipboard size={16} />
            </button>
            <button className="btn secondary icon-btn" onClick={exportCSV} title="Export CSV">
              <Upload size={16} />
              <FileText size={16} />
            </button>
            <button className="btn secondary icon-btn" onClick={exportXLSX} title="Export Excel">
              <Upload size={16} />
              <FileSpreadsheet size={16} />
            </button>
          </div>
        </div>
        <div className="table-toolbar-right">
          <label className="small">
            Page size:
            <select
              value={pagination.pageSize}
              onChange={(e) =>
                setPagination((prev) => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))
              }
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <table className="data-table" ref={tableRef}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const meta = header.column.columnDef.meta as any;
                const align = meta?.align;
                const compact = meta?.compact;
                const explicitSize = meta?.explicitSize as number | undefined;
                const widthStyle = explicitSize
                  ? {
                      width: `${explicitSize}px`,
                      minWidth: `${explicitSize}px`,
                      maxWidth: `${explicitSize}px`,
                    }
                  : {
                      minWidth: `${header.column.columnDef.minSize ?? 0}px`,
                      maxWidth:
                        typeof header.column.columnDef.maxSize === "number"
                          ? `${header.column.columnDef.maxSize}px`
                          : undefined,
                    };
                const isSorted = header.column.getIsSorted();
                const sortIndicator = isSorted === "asc" ? "\u25B2" : isSorted === "desc" ? "\u25BC" : null;
                return (
                  <th
                    key={header.id}
                    style={{
                      textAlign: align ?? "left",
                      ...widthStyle,
                    }}
                    className={compact ? "compact-cell" : undefined}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="th-inner">
                      <span>{header.isPlaceholder ? null : (header.column.columnDef.header as string)}</span>
                      <span className="th-actions">
                        {enableFilters && (
                          <button
                            className={`filter-btn ${header.column.getIsFiltered() ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openFilterMenu(
                                header.column.id,
                                header.column.columnDef.header as string,
                                e.currentTarget,
                              );
                            }}
                            title="Filter"
                            type="button"
                          >
                            <Filter size={14} />
                          </button>
                        )}
                        {sortIndicator}
                      </span>
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="resizer"
                        />
                      )}
                    </div>
                  </th>
                );
              })}
              <th style={{ width: "150px", whiteSpace: "nowrap" }} className="center">
                Actions
              </th>
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const id = getRowId(row.original);
            const isEditing = editingId === id;
            const currentDraft = {
              ...row.original,
              ...(draftsRef.current[id] ?? {}),
            } as Partial<T>;
            const editError = isEditing
              ? validateEdit
                ? validateEdit(currentDraft, row.original)
                : validateCreate
                  ? validateCreate(currentDraft)
                  : null
              : null;
            return (
              <tr
                key={id}
                data-rowid={id}
                className={selectedId === id ? "is-selected" : undefined}
                onClick={() => onSelect?.(id)}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as any;
                  const align = meta?.align;
                  const compact = meta?.compact;
                  const explicitSize = meta?.explicitSize as number | undefined;
                  const widthStyle = explicitSize
                    ? {
                        width: `${explicitSize}px`,
                        minWidth: `${explicitSize}px`,
                        maxWidth: `${explicitSize}px`,
                      }
                    : {
                        minWidth: `${cell.column.columnDef.minSize ?? 0}px`,
                        maxWidth:
                          typeof cell.column.columnDef.maxSize === "number"
                            ? `${cell.column.columnDef.maxSize}px`
                            : undefined,
                      };
                  return (
                    <td
                      key={`${id}_${cell.column.id}`}
                      className={`${align ?? ""} ${compact ? "compact-cell" : ""}`}
                      style={widthStyle}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
                <td className="actions-cell center">
                  {isEditing ? (
                    <div className="table-actions">
                      <button
                        className="btn secondary icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(id);
                        }}
                        title={editError ? editError : "Save"}
                        disabled={Boolean(editError)}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn secondary icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="table-actions">
                      <button
                        className="btn secondary icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(id);
                        }}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn secondary icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          void requestDeleteConfirm(row.original);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                      {onToggleActive && (
                        <button
                          className="btn secondary icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = !(getIsActive?.(row.original) ?? false);
                            const nameLike =
                              (row.original as any)?.name ??
                              (row.original as any)?.label ??
                              (row.original as any)?.title ??
                              "this record";
                            const msg = next
                              ? `Activate "${nameLike}"?`
                              : `Deactivate "${nameLike}"?`;
                            requestConfirm(msg, "Your change will be saved.", () => onToggleActive(id, next));
                          }}
                          title={(getIsActive?.(row.original) ?? false) ? "Deactivate" : "Activate"}
                        >
                          {(getIsActive?.(row.original) ?? false) ? (
                            <ThumbsDown size={16} />
                          ) : (
                            <ThumbsUp size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {(() => {
            const currentDraft = { ...(newRowDefaults ?? {}), ...newRowDraftRef.current } as Partial<T>;
            const pendingCreateError = validateCreate ? validateCreate(currentDraft) : null;
            return (
              <>
          <tr className="new-row">
            {columns.map((col) => {
              const key = col.key as string;
              const value =
                newRowDraftRef.current[key] ??
                (newRowDefaults ? (newRowDefaults as Record<string, any>)[key] : undefined);
              const align = col.align;
              return (
                <td key={`new-${key}`} className={align}>
                  {col.input ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                    >
                      {col.input(value, (val) => {
                        newRowDraftRef.current = { ...newRowDraftRef.current, [key]: val };
                        setNewRowVersion((v) => v + 1);
                      })}
                    </div>
                  ) : null}
                </td>
              );
    })}
            <td className="actions-cell center">
              <div className="table-actions">
                <button
                  className="btn add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreate();
                  }}
                  disabled={Boolean(pendingCreateError)}
                >
                  Add
                </button>
              </div>
            </td>
          </tr>
              </>
            );
          })()}
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

      <div className="table-pagination">
        <div className="muted small">
          Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="table-actions">
          <button
            className="btn secondary small-btn"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>
          <button
            className="btn secondary small-btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>

      {isLoading && <div className="muted">Loading...</div>}
      {error && <div className="error">{error}</div>}
      {!rows.length && !isLoading && <div className="muted">No records yet.</div>}

      <AlertDialog
        open={Boolean(confirmDialog?.open)}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            {confirmDialog?.description && (
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDialog) return;
                try {
                  await Promise.resolve(confirmDialog.onConfirm());
                } catch (err) {
                  toast.error(String(err));
                } finally {
                  setConfirmDialog(null);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

