import { createElement, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Braces, ListOrdered, Tag } from "lucide-react";
import type { DataGridColumn } from "../../../components/table/DataTable";
import { lookupTablesApi } from "../../../api/entities";
import type { LookupTableColumn, LookupTableDataType } from "../../../types/domain";
import type { ConfirmFn } from "../../lists/hooks/useSelectListPropertiesManager";

type UseLookupTableColumnsManagerArgs = {
  currentTableId?: string;
  confirm: ConfirmFn;
  onTableChangedKey: string;
};

const lookupTableColumnsNameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function useLookupTableColumnsManager({
  currentTableId,
  confirm,
  onTableChangedKey,
}: UseLookupTableColumnsManagerArgs) {
  const [columns, setColumns] = useState<LookupTableColumn[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<LookupTableColumn>>>({});
  const [pendingAdds, setPendingAdds] = useState<LookupTableColumn[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newRow, setNewRow] = useState<Partial<LookupTableColumn>>({
    name: "",
    dataType: "string",
    sortOrder: 0,
  });

  const typeOptions = useMemo<Array<{ value: LookupTableDataType; label: string }>>(
    () => [
      { value: "string", label: "String" },
      { value: "number", label: "Number" },
      { value: "boolean", label: "Boolean" },
      { value: "datetime", label: "Date/Time" },
    ],
    [],
  );

  const gridColumns = useMemo<DataGridColumn<LookupTableColumn>[]>(
    () => [
      { key: "name", header: "*Name", type: "string", headerIcon: createElement(Tag, { size: 14 }) },
      {
        key: "dataType",
        header: "*Data Type",
        type: "string",
        width: 140,
        options: typeOptions as Array<{ value: string; label: string }>,
        headerIcon: createElement(Braces, { size: 14 }),
      },
      {
        key: "sortOrder",
        header: "Order",
        type: "number",
        align: "center",
        headerIcon: createElement(ListOrdered, { size: 14 }),
      },
    ],
    [typeOptions],
  );

  const visibleColumns = useMemo(() => {
    const base = columns
      .filter((c) => !pendingDeletes.has(c.id))
      .slice()
      .sort(
        (a, b) =>
          lookupTableColumnsNameCollator.compare(a.name, b.name) ||
          a.id.localeCompare(b.id),
      );

    const pending = pendingAdds.filter((c) => !pendingDeletes.has(c.id));
    return [...base, ...pending];
  }, [columns, pendingAdds, pendingDeletes]);

  const tableRows = useMemo(() => {
    return visibleColumns.map((c) => ({ ...c, ...(drafts[c.id] ?? {}) }));
  }, [visibleColumns, drafts]);

  const getRowStatus = (row: LookupTableColumn): "new" | "edited" | undefined => {
    if (row.id.startsWith("local-col-")) return "new";
    if (drafts[row.id]) return "edited";
    return undefined;
  };

  const hasChanges =
    Object.keys(drafts).length > 0 ||
    pendingAdds.length > 0 ||
    pendingDeletes.size > 0 ||
    Boolean(newRow.name?.trim());

  const reset = () => {
    setColumns([]);
    setDrafts({});
    setPendingAdds([]);
    setPendingDeletes(new Set());
    setSelectedIds(new Set());
    setNewRow({ name: "", dataType: "string", sortOrder: 0 });
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTableChangedKey]);

  const applyLoaded = (loaded: LookupTableColumn[] | undefined) => {
    if (!loaded) return;
    setColumns(loaded);
    setDrafts({});
    setPendingAdds([]);
    setPendingDeletes(new Set());
    setSelectedIds(new Set());
    setNewRow({ name: "", dataType: "string", sortOrder: 0 });
  };

  const finalizeNewRow = (tableIdOverride?: string, draft?: LookupTableColumn) => {
    const tableId = tableIdOverride ?? currentTableId;
    if (!tableId) return null;
    const name = (draft?.name ?? newRow.name)?.trim();
    if (!name) return null;

    const normalized = name.toLowerCase();
    const existing = new Set(
      [...columns, ...pendingAdds]
        .filter((c) => !pendingDeletes.has(c.id))
        .map((c) => (drafts[c.id]?.name ?? c.name).trim().toLowerCase())
        .filter(Boolean),
    );
    if (existing.has(normalized)) {
      toast.error("Column name must be unique for this table");
      return null;
    }

    const pending: LookupTableColumn = {
      id:
        draft?.id && draft.id.startsWith("local-col-")
          ? draft.id
          : `local-col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      tableId,
      name,
      dataType: (draft?.dataType ?? newRow.dataType ?? "string") as LookupTableDataType,
      sortOrder: typeof draft?.sortOrder === "number" ? draft.sortOrder : Number(draft?.sortOrder ?? newRow.sortOrder) || 0,
    };
    setPendingAdds((prev) => {
      if (prev.some((c) => c.id === pending.id)) return prev;
      return [...prev, pending];
    });
    setNewRow({ name: "", dataType: "string", sortOrder: 0 });
    return pending;
  };

  const handleRowChange = (id: string, key: keyof LookupTableColumn, value: any) => {
    if (pendingAdds.some((c) => c.id === id)) {
      setPendingAdds((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
      return;
    }
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [key]: value } }));
  };

  const commitNewRow = (draft?: LookupTableColumn) => finalizeNewRow(undefined, draft);

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

  const copySelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const byId = new Map<string, LookupTableColumn>();
    tableRows.forEach((c) => byId.set(c.id, c));
    const lines = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((c) => `${c!.name}\t${c!.dataType}\t${c!.sortOrder}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      toast.success(`Copied ${ids.length} column(s)`);
    } catch (err) {
      toast.error(`Copy failed: ${String(err)}`);
    }
  };

  const deleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    confirm({
      title: `Remove ${ids.length} column(s)?`,
      description: "This will be saved when you click Save.",
      onConfirm: () => {
        setPendingAdds((prev) => prev.filter((c) => !ids.includes(c.id)));
        setPendingDeletes((prev) => {
          const next = new Set(prev);
          ids.filter((id) => !id.startsWith("local-col-")).forEach((id) => next.add(id));
          return next;
        });
        setSelectedIds(new Set());
        setColumns((prev) => prev.filter((c) => !ids.includes(c.id)));
      },
    });
  };

  const persist = async (tableId: string) => {
    const finalized = finalizeNewRow(tableId);
    const adds = [...pendingAdds];
    if (finalized) adds.push(finalized);

    if (adds.length) {
      await Promise.all(
        adds.map((c) =>
          lookupTablesApi.createColumn(tableId, {
            name: c.name,
            dataType: c.dataType,
            sortOrder: c.sortOrder,
          }),
        ),
      );
    }

    const draftEntries = Object.entries(drafts);
    for (const [id, payload] of draftEntries) {
      if (id.startsWith("local-col-")) continue;
      if (Object.keys(payload).length === 0) continue;
      const nextPayload: any = { ...payload };
      if (typeof nextPayload.name === "string") nextPayload.name = nextPayload.name.trim();
      await lookupTablesApi.updateColumn(tableId, id, nextPayload);
    }

    const deletes = Array.from(pendingDeletes);
    if (deletes.length) {
      await Promise.all(deletes.map((id) => lookupTablesApi.removeColumn(tableId, id)));
    }

    setDrafts({});
    setPendingAdds([]);
    setPendingDeletes(new Set());
    setSelectedIds(new Set());
    setNewRow({ name: "", dataType: "string", sortOrder: 0 });

    const refreshed = await lookupTablesApi.listColumns(tableId);
    setColumns(refreshed);
    return refreshed;
  };

  return {
    columns,
    applyLoaded,
    gridColumns,
    tableRows,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    copySelected,
    deleteSelected,
    newRow,
    setNewRow,
    handleRowChange,
    getRowStatus,
    hasChanges,
    commitNewRow,
    persist,
  };
}
