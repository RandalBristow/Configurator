import { createElement, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Braces,
  CircleDot,
  ListOrdered,
  MessageSquareText,
  Tag,
  ToggleRight,
} from "lucide-react";
import type { DataGridColumn } from "../../../components/table/DataTable";
import { variablesApi } from "../../../api/entities";
import type { Variable, VariableDataType } from "../../../types/domain";

export type VariableRow = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  dataType: VariableDataType;
  defaultValue: string;
};

const DEFAULT_NEW_ROW: Partial<VariableRow> = {
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
  dataType: "string",
  defaultValue: "",
};

const toDisplayValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes"].includes(text)) return true;
  if (["false", "0", "no"].includes(text)) return false;
  throw new Error("Default value must be true or false.");
};

const parseNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) throw new Error("Default value must be a number.");
  return parsed;
};

const parseDatetime = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  const text = String(value ?? "").trim();
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) throw new Error("Default value must be a valid date/time.");
  return new Date(parsed).toISOString();
};

const parseArrayValues = <T>(
  raw: unknown,
  mapFn: (value: unknown) => T,
  errorLabel: string,
) => {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  const text = String(raw ?? "").trim();
  let items: unknown[] = [];
  if (text.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Default value must be a JSON array of ${errorLabel}.`);
    }
    if (!Array.isArray(parsed)) {
      throw new Error(`Default value must be a JSON array of ${errorLabel}.`);
    }
    items = parsed;
  } else {
    items = text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return items.map(mapFn);
};

const parseCollection = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Collection default must be valid JSON.");
  }
  if (parsed === null || typeof parsed !== "object") {
    throw new Error("Collection default must be valid JSON.");
  }
  return parsed;
};

const parseDefaultValue = (dataType: VariableDataType, raw: unknown) => {
  if (raw === null || raw === undefined) return null;
  const text = String(raw ?? "").trim();
  if (!text) return null;
  switch (dataType) {
    case "string":
      return text;
    case "number":
      return parseNumber(raw);
    case "boolean":
      return parseBoolean(raw);
    case "datetime":
      return parseDatetime(raw);
    case "stringArray":
      return parseArrayValues(raw, (v) => String(v ?? ""), "strings");
    case "numberArray":
      return parseArrayValues(raw, parseNumber, "numbers");
    case "booleanArray":
      return parseArrayValues(raw, parseBoolean, "booleans");
    case "datetimeArray":
      return parseArrayValues(raw, parseDatetime, "date/time values");
    case "collection":
      return parseCollection(raw);
    default:
      return text;
  }
};

const normalizeRow = (row: Partial<VariableRow>, id: string): VariableRow => ({
  id,
  name: row.name?.trim() ?? "",
  description: row.description ?? "",
  sortOrder: Number(row.sortOrder) || 0,
  isActive: row.isActive ?? true,
  dataType: (row.dataType ?? "string") as VariableDataType,
  defaultValue: row.defaultValue ?? "",
});

const hasRowContent = (row: Partial<VariableRow>) =>
  Object.entries(row).some(([key, value]) => {
    if (key === "sortOrder" || key === "isActive") return false;
    if (key === "dataType") {
      const text = String(value ?? "").trim();
      return text.length > 0 && text !== DEFAULT_NEW_ROW.dataType;
    }
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });

const buildNameMap = (rows: VariableRow[]) => {
  const map = new Map<string, string>();
  rows.forEach((row) => {
    const name = row.name?.trim();
    if (!name) return;
    map.set(name.toLowerCase(), row.id);
  });
  return map;
};

export function useVariablesManager({
  optionId,
  enabled = true,
  toastOnSave = true,
  toastOnError = true,
  onScopeChangedKey,
}: {
  optionId?: string;
  enabled?: boolean;
  toastOnSave?: boolean;
  toastOnError?: boolean;
  onScopeChangedKey: string;
}) {
  const qc = useQueryClient();
  const scopeKey = optionId ?? "global";
  const [rows, setRows] = useState<VariableRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<VariableRow>>>({});
  const [pendingAdds, setPendingAdds] = useState<VariableRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newRow, setNewRow] = useState<Partial<VariableRow>>(DEFAULT_NEW_ROW);
  const [isSaving, setIsSaving] = useState(false);

  const variablesQuery = useQuery({
    queryKey: ["variables", scopeKey],
    queryFn: () => variablesApi.list(optionId, true),
    enabled,
    placeholderData: keepPreviousData,
  });

  const resetState = () => {
    setRows([]);
    setDrafts({});
    setPendingAdds([]);
    setSelectedIds(new Set());
    setNewRow(DEFAULT_NEW_ROW);
  };

  useEffect(() => {
    resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScopeChangedKey]);

  useEffect(() => {
    if (!variablesQuery.data) return;
    const mapped = variablesQuery.data.map((variable) =>
      normalizeRow(
        {
          name: variable.name ?? "",
          description: variable.description ?? "",
          sortOrder: variable.sortOrder ?? 0,
          isActive: variable.isActive ?? true,
          dataType: variable.dataType,
          defaultValue: toDisplayValue(variable.defaultValue),
        },
        variable.id,
      ),
    );
    setRows(mapped);
    setDrafts({});
    setPendingAdds([]);
    setSelectedIds(new Set());
    setNewRow(DEFAULT_NEW_ROW);
  }, [variablesQuery.data]);

  const tableRows = useMemo(() => {
    const baseRows = [...rows, ...pendingAdds].map((row) => ({
      ...row,
      ...(drafts[row.id] ?? {}),
    }));
    return baseRows;
  }, [rows, pendingAdds, drafts]);

  const typeOptions = useMemo<Array<{ value: VariableDataType; label: string }>>(
    () => [
      { value: "string", label: "String" },
      { value: "number", label: "Number" },
      { value: "boolean", label: "Boolean" },
      { value: "datetime", label: "Date/Time" },
      { value: "stringArray", label: "String Array" },
      { value: "numberArray", label: "Number Array" },
      { value: "booleanArray", label: "Boolean Array" },
      { value: "datetimeArray", label: "Date/Time Array" },
      { value: "collection", label: "Collection" },
    ],
    [],
  );

  const columns = useMemo<DataGridColumn<VariableRow>[]>(
    () => [
      { key: "name", header: "*Name", type: "string", headerIcon: createElement(Tag, { size: 14 }) },
      {
        key: "description",
        header: "Description",
        type: "string",
        headerIcon: createElement(MessageSquareText, { size: 14 }),
      },
      {
        key: "sortOrder",
        header: "Order",
        type: "number",
        align: "center",
        headerIcon: createElement(ListOrdered, { size: 14 }),
      },
      {
        key: "isActive",
        header: "Active",
        type: "boolean",
        align: "center",
        filterLabel: (val) => (val ? "Active" : "Inactive"),
        headerIcon: createElement(ToggleRight, { size: 14 }),
      },
      {
        key: "dataType",
        header: "*Data Type",
        type: "string",
        width: 160,
        options: typeOptions as Array<{ value: string; label: string }>,
        headerIcon: createElement(Braces, { size: 14 }),
      },
      {
        key: "defaultValue",
        header: "Default Value",
        type: "string",
        headerIcon: createElement(CircleDot, { size: 14 }),
      },
    ],
    [typeOptions],
  );

  const handleRowChange = (id: string, key: keyof VariableRow, value: any) => {
    if (id.startsWith("local-var-")) {
      setPendingAdds((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [key]: value },
    }));
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const commitNewRow = (draft?: VariableRow) => {
    const nextDraft = draft ?? normalizeRow(newRow, `local-var-${Date.now().toString(36)}`);
    if (!nextDraft.name?.trim()) return;

    const normalized = normalizeRow(nextDraft, nextDraft.id ?? `local-var-${Date.now().toString(36)}`);
    const allNames = buildNameMap(tableRows);
    if (allNames.has(normalized.name.toLowerCase())) {
      toast.error("Variable name must be unique in this list.");
      return;
    }

    setPendingAdds((prev) => [...prev, normalized]);
    setNewRow(DEFAULT_NEW_ROW);
  };

  const getRowStatus = (row: VariableRow): "new" | "edited" | undefined => {
    if (row.id.startsWith("local-var-")) return "new";
    if (drafts[row.id]) return "edited";
    return undefined;
  };

  const copySelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const byId = new Map(tableRows.map((row) => [row.id, row]));
    const headers = ["Name", "Description", "Order", "Active", "Data Type", "Default Value"];
    const lines = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((row) =>
        [
          row?.name ?? "",
          row?.description ?? "",
          row?.sortOrder ?? 0,
          row?.isActive ? "Active" : "Inactive",
          row?.dataType ?? "",
          row?.defaultValue ?? "",
        ].join("\t"),
      );
    const text = [headers.join("\t"), ...lines].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${ids.length} variable${ids.length === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(`Copy failed: ${String(err)}`);
    }
  };

  const deactivateSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setPendingAdds((prev) => prev.filter((row) => !ids.includes(row.id)));
    setRows((prev) =>
      prev.map((row) => (ids.includes(row.id) ? { ...row, isActive: false } : row)),
    );
    setDrafts((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        if (!id.startsWith("local-var-")) {
          next[id] = { ...(next[id] ?? {}), isActive: false };
        }
      });
      return next;
    });
    setSelectedIds(new Set());
  };

  const refresh = async () => {
    await variablesQuery.refetch();
  };

  const hasChanges =
    Object.keys(drafts).length > 0 || pendingAdds.length > 0 || hasRowContent(newRow);

  const persist = async () => {
    if (isSaving) return;
    if (!enabled) return;
    setIsSaving(true);
    try {
      if (hasRowContent(newRow)) {
        if (!newRow.name?.trim()) {
          toast.error("Name is required for new variables.");
          return;
        }
        commitNewRow(normalizeRow(newRow, `local-var-${Date.now().toString(36)}`));
      }

      const finalRows = [...rows, ...pendingAdds].map((row) => ({
        ...row,
        ...(drafts[row.id] ?? {}),
      }));
      const nameMap = buildNameMap(finalRows);
      if (nameMap.size !== finalRows.filter((row) => row.name.trim()).length) {
        throw new Error("Variable names must be unique.");
      }

      for (const pending of pendingAdds) {
        const payload: Partial<Variable> = {
          optionId: optionId ?? null,
          name: pending.name.trim(),
          description: pending.description.trim() ? pending.description.trim() : null,
          sortOrder: Number(pending.sortOrder) || 0,
          isActive: pending.isActive ?? true,
          dataType: pending.dataType,
          defaultValue: parseDefaultValue(pending.dataType, pending.defaultValue),
        };
        await variablesApi.create(payload);
      }

      const draftEntries = Object.entries(drafts);
      for (const [id, changes] of draftEntries) {
        if (id.startsWith("local-var-")) continue;
        if (Object.keys(changes).length === 0) continue;
        const baseRow = rows.find((row) => row.id === id);
        const dataType = (changes.dataType ?? baseRow?.dataType ?? "string") as VariableDataType;
        const payload: Partial<Variable> = {};
        if (changes.name !== undefined) payload.name = changes.name.trim();
        if (changes.description !== undefined) {
          payload.description = changes.description.trim() ? changes.description.trim() : null;
        }
        if (changes.sortOrder !== undefined) payload.sortOrder = Number(changes.sortOrder) || 0;
        if (changes.isActive !== undefined) payload.isActive = changes.isActive;
        if (changes.dataType !== undefined) payload.dataType = changes.dataType;
        if (changes.defaultValue !== undefined) {
          payload.defaultValue = parseDefaultValue(dataType, changes.defaultValue);
        }
        if (payload.name === "") throw new Error("Variable name is required.");
        await variablesApi.update(id, payload);
      }

      await qc.invalidateQueries({ queryKey: ["variables", scopeKey] });
      if (toastOnSave) {
        toast.success("Variables saved");
      }
    } catch (err) {
      if (toastOnError) {
        toast.error(`Save failed: ${err instanceof Error ? err.message : String(err)}`, {
          duration: 8000,
        });
      }
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    columns,
    tableRows,
    selectedIds,
    setSelectedIds,
    toggleSelectAll,
    clearSelection,
    handleRowChange,
    newRow,
    setNewRow,
    commitNewRow,
    getRowStatus,
    copySelected,
    deactivateSelected,
    refresh,
    hasChanges,
    isSaving,
    isLoading: variablesQuery.isLoading,
    isFetching: variablesQuery.isFetching,
    persist,
  };
}

export type VariablesManager = ReturnType<typeof useVariablesManager>;
