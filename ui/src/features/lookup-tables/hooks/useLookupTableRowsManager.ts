import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Calendar, Hash, ToggleRight, Type } from "lucide-react";
import type { DataGridColumn } from "../../../components/table/DataTable";
import { lookupTablesApi } from "../../../api/entities";
import type { LookupTableColumn, LookupTableRow, LookupTableDataType } from "../../../types/domain";
import type { ConfirmFn } from "../../lists/hooks/useSelectListPropertiesManager";

type CellValue = string | number | boolean | null;

type LookupRowView = { id: string } & Record<string, any>;

const lookupTableSortCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const HEADER_ICON_SIZE = 14;

const iconForLookupDataType = (dataType: LookupTableDataType) => {
  switch (dataType) {
    case "number":
      return createElement(Hash, { size: HEADER_ICON_SIZE });
    case "boolean":
      return createElement(ToggleRight, { size: HEADER_ICON_SIZE });
    case "datetime":
      return createElement(Calendar, { size: HEADER_ICON_SIZE });
    default:
      return createElement(Type, { size: HEADER_ICON_SIZE });
  }
};

const viewKeyForColumnId = (columnId: string) => `col:${columnId}`;

const coerceValue = (dataType: LookupTableDataType, raw: any): CellValue => {
  if (raw === undefined) return null;
  if (raw === null) return null;

  if (dataType === "boolean") {
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") return raw !== 0;
    if (typeof raw === "string") {
      const v = raw.trim().toLowerCase();
      if (!v) return null;
      if (["true", "1", "yes", "y"].includes(v)) return true;
      if (["false", "0", "no", "n"].includes(v)) return false;
      return null;
    }
    return null;
  }

  if (dataType === "number") {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const v = raw.trim();
      if (!v) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  if (dataType === "datetime") {
    if (typeof raw === "string") {
      const v = raw;
      return v.length ? v : null;
    }
    return null;
  }

  // string: keep empty string distinct from null
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "boolean") return raw ? "true" : "false";
  return null;
};

const isBlank = (values: Record<string, CellValue>) => {
  const keys = Object.keys(values);
  if (!keys.length) return true;
  return keys.every((k) => values[k] === null || values[k] === undefined);
};

const compareLookupTableCell = (
  dataType: LookupTableDataType,
  av: CellValue,
  bv: CellValue,
): number => {
  if (av === bv) return 0;
  if (av === null || av === undefined) return 1;
  if (bv === null || bv === undefined) return -1;

  if (dataType === "number") {
    const an = typeof av === "number" ? av : Number(String(av));
    const bn = typeof bv === "number" ? bv : Number(String(bv));
    if (!Number.isFinite(an) && !Number.isFinite(bn)) return 0;
    if (!Number.isFinite(an)) return 1;
    if (!Number.isFinite(bn)) return -1;
    return an - bn;
  }

  if (dataType === "boolean") {
    const ab = typeof av === "boolean" ? av : String(av).trim().toLowerCase() === "true";
    const bb = typeof bv === "boolean" ? bv : String(bv).trim().toLowerCase() === "true";
    return Number(ab) - Number(bb);
  }

  return lookupTableSortCollator.compare(String(av), String(bv));
};

type UseLookupTableRowsManagerArgs = {
  currentTableId?: string;
  columns: LookupTableColumn[];
  confirm: ConfirmFn;
  onTableChangedKey: string;
};

const parseDelimitedText = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.length > 0);

  if (!lines.length) return { delimiter: "\t", rows: [] as string[][] };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  const splitCsv = (line: string) => {
    const out: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "\"") {
        if (inQuotes && line[i + 1] === "\"") {
          current += "\"";
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && ch === ",") {
        out.push(current);
        current = "";
        continue;
      }
      current += ch;
    }
    out.push(current);
    return out;
  };

  const splitLine = (line: string) => (delimiter === "\t" ? line.split("\t") : splitCsv(line));
  return { delimiter, rows: lines.map(splitLine) };
};

export function useLookupTableRowsManager({
  currentTableId,
  columns,
  confirm,
  onTableChangedKey,
}: UseLookupTableRowsManagerArgs) {
  const [rows, setRows] = useState<LookupTableRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, CellValue>>>({});
  const [pendingAdds, setPendingAdds] = useState<Array<{ id: string; tableId: string; values: Record<string, CellValue> }>>([]);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newRow, setNewRow] = useState<Record<string, any>>({});

  const newRowFirstInputRef = useRef<HTMLInputElement | null>(null);
  const newRowRef = useRef<HTMLTableRowElement | null>(null);

  const reset = () => {
    setRows([]);
    setDrafts({});
    setPendingAdds([]);
    setPendingDeletes(new Set());
    setSelectedIds(new Set());
    setNewRow({});
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTableChangedKey]);

  const applyLoaded = (loaded: LookupTableRow[] | undefined) => {
    if (!loaded) return;
    setRows(loaded);
    setDrafts({});
    setPendingAdds([]);
    setPendingDeletes(new Set());
    setSelectedIds(new Set());
    setNewRow({});
  };

  const allRowValuesForRowId = (rowId: string): Record<string, CellValue> => {
    const base = rows.find((r) => r.id === rowId);
    const baseValues = (base?.values ?? {}) as Record<string, CellValue>;
    const draft = drafts[rowId] ?? {};
    const merged: Record<string, CellValue> = {};
    columns.forEach((c) => {
      const colId = c.id;
      merged[colId] = draft[colId] !== undefined ? draft[colId] : (baseValues[colId] ?? null);
    });
    return merged;
  };

  const visibleRowModels = useMemo(() => {
    const base = rows.filter((r) => !pendingDeletes.has(r.id));
    const pending = pendingAdds.filter((r) => !pendingDeletes.has(r.id));

    if (!columns.length || base.length <= 1) return [...base, ...pending];

    const columnsByOrder = columns
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const keyCache = new Map<string, CellValue[]>();
    const colIds = columnsByOrder.map((c) => c.id);
    const colTypeById = new Map(columnsByOrder.map((c) => [c.id, c.dataType]));

    const sortKeyForRow = (row: LookupTableRow) => {
      const cached = keyCache.get(row.id);
      if (cached) return cached;
      const raw = (row.values ?? {}) as Record<string, any>;
      const key = colIds.map((colId) => {
        const dataType = colTypeById.get(colId)!;
        return coerceValue(dataType, raw[colId]);
      });
      keyCache.set(row.id, key);
      return key;
    };

    const sortedBase = base.slice().sort((a, b) => {
      const aKey = sortKeyForRow(a);
      const bKey = sortKeyForRow(b);
      for (let i = 0; i < colIds.length; i++) {
        const colId = colIds[i];
        const dataType = colTypeById.get(colId)!;
        const cmp = compareLookupTableCell(dataType, aKey[i], bKey[i]);
        if (cmp !== 0) return cmp;
      }
      return a.id.localeCompare(b.id);
    });

    return [...sortedBase, ...pending];
  }, [rows, pendingAdds, pendingDeletes, columns]);

  const rowViews = useMemo<LookupRowView[]>(() => {
    return visibleRowModels.map((row) => {
      const view: LookupRowView = { id: row.id };
      columns.forEach((c) => {
        const key = viewKeyForColumnId(c.id);
        const baseVal = (row.values ?? {})[c.id] as any;
        const draftVal = drafts[row.id]?.[c.id];
        const raw = draftVal !== undefined ? draftVal : baseVal ?? null;
        view[key] = raw;
      });
      return view;
    });
  }, [visibleRowModels, columns, drafts]);

  const rowColumns = useMemo<DataGridColumn<LookupRowView>[]>(() => {
    return columns.map((c) => {
      const type: DataGridColumn<LookupRowView>["type"] =
        c.dataType === "number"
          ? "number"
          : c.dataType === "boolean"
            ? "boolean"
            : c.dataType === "datetime"
              ? "datetime"
              : "string";
      return {
        key: (viewKeyForColumnId(c.id) as any) as keyof LookupRowView,
        header: c.name,
        type,
        headerIcon: iconForLookupDataType(c.dataType),
      };
    });
  }, [columns]);

  const hasChanges =
    Object.keys(drafts).length > 0 ||
    pendingAdds.length > 0 ||
    pendingDeletes.size > 0 ||
    Object.keys(newRow).some((k) => newRow[k] !== undefined && newRow[k] !== null);

  const getRowStatus = (row: LookupRowView): "new" | "edited" | undefined => {
    if (row.id.startsWith("local-row-")) return "new";
    if (drafts[row.id]) return "edited";
    return undefined;
  };

  const commitNewRow = (tableIdOverride?: string, draft?: LookupRowView) => {
    const tableId = tableIdOverride ?? currentTableId;
    if (!tableId) return null;

    const source = draft ?? (newRow as any);
    const valuesByColId: Record<string, CellValue> = {};
    columns.forEach((c) => {
      const key = viewKeyForColumnId(c.id);
      valuesByColId[c.id] = coerceValue(c.dataType, (source as any)[key]);
    });

    if (isBlank(valuesByColId)) {
      setNewRow({});
      return null;
    }

    const resolvedId =
      draft?.id && draft.id.startsWith("local-row-")
        ? draft.id
        : `local-row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const pending = {
      id: resolvedId,
      tableId,
      values: valuesByColId,
    };
    setPendingAdds((prev) => {
      if (prev.some((r) => r.id === pending.id)) return prev;
      return [...prev, pending];
    });
    setNewRow({});
    requestAnimationFrame(() => {
      newRowFirstInputRef.current?.focus();
    });
    return pending;
  };

  const handleNewRowBlur = (e: React.FocusEvent<HTMLTableRowElement>) => {
    const next = e.relatedTarget as HTMLElement | null;
    if (newRowRef.current && next && newRowRef.current.contains(next)) return;
    commitNewRow();
  };

  const handleRowChange = (id: string, key: keyof LookupRowView, value: any) => {
    const k = String(key);
    if (!k.startsWith("col:")) return;
    const colId = k.slice("col:".length);
    const col = columns.find((c) => c.id === colId);
    if (!col) return;

    // Update pending add
    if (pendingAdds.some((r) => r.id === id)) {
      setPendingAdds((prev) =>
        prev.map((r) => (r.id === id ? { ...r, values: { ...r.values, [colId]: coerceValue(col.dataType, value) } } : r)),
      );
      return;
    }

    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [colId]: coerceValue(col.dataType, value) },
    }));
  };

  const handleNewRowChange = (key: keyof LookupRowView, value: any) => {
    const k = String(key);
    setNewRow((prev) => ({ ...prev, [k]: value }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) =>
    setSelectedIds((prev) => {
      if (prev.size === ids.length && ids.every((id) => prev.has(id))) return prev;
      return new Set(ids);
    });
  const clearSelection = () =>
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      return new Set();
    });

  const deleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    confirm({
      title: `Remove ${ids.length} row(s)?`,
      description: "This will be saved when you click Save.",
      onConfirm: () => {
        setPendingAdds((prev) => prev.filter((r) => !ids.includes(r.id)));
        setPendingDeletes((prev) => {
          const next = new Set(prev);
          ids.filter((id) => !id.startsWith("local-row-")).forEach((id) => next.add(id));
          return next;
        });
        setSelectedIds(new Set());
        setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
      },
    });
  };

  const copySelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const headers = columns.map((c) => c.name);
    const byId = new Map<string, LookupRowView>();
    rowViews.forEach((r) => byId.set(r.id, r));
    const lines = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((r) => columns.map((c) => {
        const v = (r as any)[viewKeyForColumnId(c.id)];
        if (v === null || v === undefined) return "";
        return String(v);
      }).join("\t"));
    const text = [headers.join("\t"), ...lines].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${ids.length} row(s)`);
    } catch (err) {
      toast.error(`Copy failed: ${String(err)}`);
    }
  };

  const persist = async (tableId: string) => {
    commitNewRow(tableId);

    // Create pending rows (drop blanks)
    const adds = pendingAdds.filter((r) => !isBlank(r.values));
    if (adds.length) {
      const BATCH_SIZE = 250;
      let inserted = 0;
      let skippedBlank = 0;
      let skippedDuplicateInRequest = 0;
      let skippedExisting = 0;

      for (let i = 0; i < adds.length; i += BATCH_SIZE) {
        const chunk = adds.slice(i, i + BATCH_SIZE).map((r) => ({ values: r.values }));
        const result = await lookupTablesApi.createRowsBulk(tableId, chunk);
        inserted += result.inserted;
        skippedBlank += result.skippedBlank;
        skippedDuplicateInRequest += result.skippedDuplicateInRequest;
        skippedExisting += result.skippedExisting;
      }

      if (skippedBlank || skippedDuplicateInRequest || skippedExisting) {
        toast.message(
          `Imported rows: ${inserted.toLocaleString()} added, ${(skippedExisting + skippedDuplicateInRequest).toLocaleString()} duplicate(s) skipped, ${skippedBlank.toLocaleString()} blank skipped.`,
        );
      }
    }

    // Update edited rows (if edited row becomes blank, delete it)
    const draftIds = Object.keys(drafts);
    for (const rowId of draftIds) {
      if (pendingDeletes.has(rowId)) continue;
      const nextValues = allRowValuesForRowId(rowId);
      if (isBlank(nextValues)) {
        await lookupTablesApi.removeRow(tableId, rowId);
        continue;
      }
      await lookupTablesApi.updateRow(tableId, rowId, { values: nextValues });
    }

    // Delete rows
    const deletes = Array.from(pendingDeletes);
    if (deletes.length) {
      await Promise.all(deletes.map((id) => lookupTablesApi.removeRow(tableId, id)));
    }

    setDrafts({});
    setPendingAdds([]);
    setPendingDeletes(new Set());
    setSelectedIds(new Set());
    setNewRow({});

    const refreshed = await lookupTablesApi.listRows(tableId);
    setRows(refreshed);
    return refreshed;
  };

  const importDelimitedText = async (text: string) => {
    if (!currentTableId) {
      toast.error("Save the lookup table before importing.");
      return;
    }
    if (!columns.length) {
      toast.error("Define columns before importing");
      return;
    }

    const { rows: matrix } = parseDelimitedText(text);
    if (!matrix.length) {
      toast.error("Clipboard is empty");
      return;
    }

    const columnsByOrder = [...columns].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const normalizedHeaderToId = new Map<string, string>();
    columnsByOrder.forEach((c) => normalizedHeaderToId.set(c.name.trim().toLowerCase(), c.id));

    const firstRow = matrix[0].map((c) => c.trim());
    const headerMatches = firstRow.filter((h) => normalizedHeaderToId.has(h.toLowerCase())).length;
    const hasHeader = headerMatches > 0;

    const stagedAdds: Array<{ id: string; tableId: string; values: Record<string, CellValue> }> = [];

    const pushRow = (valuesByColId: Record<string, CellValue>) => {
      if (isBlank(valuesByColId)) return;
      stagedAdds.push({
        id: `local-row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        tableId: currentTableId,
        values: valuesByColId,
      });
    };

    if (hasHeader) {
      const headers = firstRow.map((h) => h.trim());
      const dataRows = matrix.slice(1);
      dataRows.forEach((cells) => {
        const valuesByColId: Record<string, CellValue> = {};
        columnsByOrder.forEach((c) => (valuesByColId[c.id] = null));
        headers.forEach((h, idx) => {
          const colId = normalizedHeaderToId.get(h.toLowerCase());
          if (!colId) return;
          const col = columnsByOrder.find((c) => c.id === colId);
          if (!col) return;
          valuesByColId[colId] = coerceValue(col.dataType, cells[idx] ?? "");
        });
        pushRow(valuesByColId);
      });
    } else {
      matrix.forEach((cells) => {
        const valuesByColId: Record<string, CellValue> = {};
        columnsByOrder.forEach((c, idx) => {
          valuesByColId[c.id] = coerceValue(c.dataType, cells[idx] ?? undefined);
        });
        pushRow(valuesByColId);
      });
    }

    if (!stagedAdds.length) {
      toast.error("No non-blank rows detected");
      return;
    }

    setPendingAdds((prev) => [...prev, ...stagedAdds]);
    toast.success(`Imported ${stagedAdds.length} row(s)${hasHeader ? "" : " (mapped by column order)"}`);
  };

  return {
    rowColumns,
    rowViews,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    deleteSelected,
    copySelected,
    newRow,
    setNewRow,
    newRowRef,
    newRowFirstInputRef,
    handleNewRowBlur,
    commitNewRow,
    handleRowChange,
    handleNewRowChange,
    hasChanges,
    getRowStatus,
    applyLoaded,
    persist,
    importDelimitedText,
  };
}
