import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { DataGridColumn } from "../../../components/table/DataTable";
import { selectListPropertiesApi } from "../../../api/entities";
import type { SelectListProperty, SelectListPropertyType } from "../../../types/domain";

const DEFAULT_SELECT_LIST_PROPERTIES: Array<{ key: string; dataType: SelectListPropertyType }> = [
  { key: "Value", dataType: "string" },
  { key: "Display Value", dataType: "string" },
  { key: "Order", dataType: "number" },
  { key: "Active", dataType: "boolean" },
  { key: "Tooltip", dataType: "string" },
  { key: "Comments", dataType: "string" },
];

export type ConfirmFn = (options: {
  title: string;
  description?: string;
  onConfirm: () => void;
}) => void;

type UseSelectListPropertiesManagerArgs = {
  currentListId?: string;
  confirm: ConfirmFn;
  onListChangedKey: string;
};

export function useSelectListPropertiesManager({
  currentListId,
  confirm,
  onListChangedKey,
}: UseSelectListPropertiesManagerArgs) {
  const [properties, setProperties] = useState<SelectListProperty[]>([]);
  const [propertyDrafts, setPropertyDrafts] = useState<Record<string, Partial<SelectListProperty>>>({});
  const [propertyPendingAdds, setPropertyPendingAdds] = useState<SelectListProperty[]>([]);
  const [propertyPendingDeletes, setPropertyPendingDeletes] = useState<Set<string>>(new Set());
  const [propertySelectedIds, setPropertySelectedIds] = useState<Set<string>>(new Set());
  const [propertyNewRow, setPropertyNewRow] = useState<Partial<SelectListProperty>>({
    key: "",
    dataType: "string",
  });

  const propertyNewRowFirstInputRef = useRef<HTMLInputElement | null>(null);
  const propertyNewRowRef = useRef<HTMLTableRowElement | null>(null);

  const isDefaultPropertyKey = (key: string) =>
    DEFAULT_SELECT_LIST_PROPERTIES.some(
      (p) => p.key.trim().toLowerCase() === (key ?? "").trim().toLowerCase(),
    );

  const finalizeNewPropertyRow = (selectListIdOverride?: string) => {
    const listId = selectListIdOverride ?? currentListId;
    if (!listId) return null;
    const key = propertyNewRow.key?.trim();
    if (!key) return null;
    const dataType = (propertyNewRow.dataType ?? "string") as SelectListPropertyType;

    const existingKeys = new Set(
      [...properties, ...propertyPendingAdds]
        .filter((p) => !propertyPendingDeletes.has(p.id))
        .map((p) => (propertyDrafts[p.id]?.key ?? p.key).trim().toLowerCase())
        .filter(Boolean),
    );
    DEFAULT_SELECT_LIST_PROPERTIES.forEach((p) => existingKeys.add(p.key.trim().toLowerCase()));
    if (existingKeys.has(key.toLowerCase())) {
      toast.error("Property name must be unique for this list");
      return null;
    }

    const pendingRow: SelectListProperty = {
      id: `local-prop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      selectListId: listId,
      key,
      dataType,
    };
    setPropertyPendingAdds((prev) => [...prev, pendingRow]);
    setPropertyNewRow({ key: "", dataType: "string" });
    requestAnimationFrame(() => {
      propertyNewRowFirstInputRef.current?.focus();
    });
    return pendingRow;
  };

  const handlePropertyRowChange = (id: string, key: keyof SelectListProperty, value: any) => {
    if (id.startsWith("default-prop-")) return;
    if (propertyPendingAdds.some((p) => p.id === id)) {
      setPropertyPendingAdds((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
      return;
    }
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
    setPropertyDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [key]: value },
    }));
  };

  const togglePropertySelect = (id: string) => {
    if (id.startsWith("default-prop-")) return;
    setPropertySelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePropertySelectAll = (ids: string[]) => {
    setPropertySelectedIds(new Set(ids.filter((id) => !id.startsWith("default-prop-"))));
  };

  const clearPropertySelection = () => setPropertySelectedIds(new Set());

  const handlePropertyNewRowBlur = (e: React.FocusEvent<HTMLTableRowElement>) => {
    const next = e.relatedTarget as HTMLElement | null;
    if (propertyNewRowRef.current && next && propertyNewRowRef.current.contains(next)) return;
    finalizeNewPropertyRow();
  };

  const deleteSelectedProperties = () => {
    const ids = Array.from(propertySelectedIds).filter((id) => !id.startsWith("default-prop-"));
    if (!ids.length) return;

    confirm({
      title: `Remove ${ids.length} propert${ids.length === 1 ? "y" : "ies"}?`,
      description: "This will be saved when you click Save.",
      onConfirm: () => {
        setPropertyPendingAdds((prevAdds) => prevAdds.filter((p) => !ids.includes(p.id)));
        setPropertyPendingDeletes((prev) => {
          const next = new Set(prev);
          ids.filter((id) => !id.startsWith("local-prop-")).forEach((id) => next.add(id));
          return next;
        });
        setPropertySelectedIds(new Set());
        setProperties((prev) => prev.filter((p) => !ids.includes(p.id)));
      },
    });
  };

  const copySelectedProperties = async () => {
    const ids = Array.from(propertySelectedIds).filter((id) => !id.startsWith("default-prop-"));
    if (!ids.length) return;
    const byId = new Map<string, SelectListProperty>();
    propertyTableRows.forEach((p) => byId.set(p.id, p));
    const lines = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p) => `${p!.key}\t${p!.dataType}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      toast.success(`Copied ${ids.length} propert${ids.length === 1 ? "y" : "ies"}`);
    } catch (err) {
      toast.error(`Copy failed: ${String(err)}`);
    }
  };

  const propertyTypeOptions = useMemo<Array<{ value: SelectListPropertyType; label: string }>>(
    () => [
      { value: "string", label: "String" },
      { value: "number", label: "Number" },
      { value: "boolean", label: "Boolean" },
      { value: "datetime", label: "Date/Time" },
    ],
    [],
  );

  const propertyColumns = useMemo<DataGridColumn<SelectListProperty>[]>(
    () => [
      { key: "key", header: "*Name", type: "string" },
      {
        key: "dataType",
        header: "*Data Type",
        type: "string",
        width: 140,
        options: propertyTypeOptions as Array<{ value: string; label: string }>,
      },
    ],
    [propertyTypeOptions],
  );

  const visibleProperties = useMemo(() => {
    return [...properties, ...propertyPendingAdds].filter((p) => !propertyPendingDeletes.has(p.id));
  }, [properties, propertyPendingAdds, propertyPendingDeletes]);

  const defaultPropertyRows = useMemo<SelectListProperty[]>(() => {
    const listId = currentListId ?? "default";
    return DEFAULT_SELECT_LIST_PROPERTIES.map((p) => ({
      id: `default-prop-${p.key.toLowerCase().replace(/\s+/g, "-")}`,
      selectListId: listId,
      key: p.key,
      dataType: p.dataType,
    }));
  }, [currentListId]);

  const propertyTableRows = useMemo(() => {
    const dynamic = visibleProperties.map((p) => ({ ...p, ...(propertyDrafts[p.id] ?? {}) }));
    return [...defaultPropertyRows, ...dynamic];
  }, [defaultPropertyRows, visibleProperties, propertyDrafts]);

  const getPropertyRowStatus = (row: SelectListProperty): "new" | "edited" | undefined => {
    if (row.id.startsWith("local-prop-")) return "new";
    if (propertyDrafts[row.id]) return "edited";
    return undefined;
  };

  const customPropertyDefs = useMemo(() => {
    return visibleProperties
      .map((p) => ({ ...p, ...(propertyDrafts[p.id] ?? {}) }))
      .filter((p) => !isDefaultPropertyKey(p.key))
      .filter((p) => p.key?.trim());
  }, [visibleProperties, propertyDrafts]);

  const propertyTypeByKey = useMemo(() => {
    const map = new Map<string, SelectListPropertyType>();
    customPropertyDefs.forEach((p) => map.set(p.key, p.dataType as SelectListPropertyType));
    return map;
  }, [customPropertyDefs]);

  const hasPropertyChanges =
    Object.keys(propertyDrafts).length > 0 ||
    propertyPendingAdds.length > 0 ||
    propertyPendingDeletes.size > 0 ||
    Boolean(propertyNewRow.key?.trim());

  const reset = () => {
    setProperties([]);
    setPropertyDrafts({});
    setPropertyPendingAdds([]);
    setPropertyPendingDeletes(new Set());
    setPropertySelectedIds(new Set());
    setPropertyNewRow({ key: "", dataType: "string" });
  };

  // Clear state on list change
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onListChangedKey]);

  // Caller should feed in latest query results (we keep this hook API-only)
  const applyLoaded = (loaded: SelectListProperty[] | undefined) => {
    if (!loaded) return;
    setProperties(loaded);
    setPropertyDrafts({});
    setPropertyPendingAdds([]);
    setPropertyPendingDeletes(new Set());
    setPropertySelectedIds(new Set());
    setPropertyNewRow({ key: "", dataType: "string" });
  };

  const persist = async (listId: string) => {
    const finalized = finalizeNewPropertyRow(listId);
    const addsToSave = [...propertyPendingAdds];
    if (finalized) addsToSave.push(finalized);
    if (addsToSave.length) {
      await Promise.all(addsToSave.map((p) => selectListPropertiesApi.create(listId, { key: p.key, dataType: p.dataType })));
    }

    const draftEntries = Object.entries(propertyDrafts);
    for (const [id, payload] of draftEntries) {
      if (id.startsWith("local-prop-")) continue;
      if (Object.keys(payload).length === 0) continue;
      const nextPayload: any = { ...payload };
      if (typeof nextPayload.key === "string") nextPayload.key = nextPayload.key.trim();
      await selectListPropertiesApi.update(listId, id, nextPayload);
    }

    const deletes = Array.from(propertyPendingDeletes);
    if (deletes.length) {
      await Promise.all(deletes.map((id) => selectListPropertiesApi.remove(listId, id)));
    }

    setPropertyDrafts({});
    setPropertyPendingAdds([]);
    setPropertyPendingDeletes(new Set());
    setPropertySelectedIds(new Set());
    setPropertyNewRow({ key: "", dataType: "string" });

    const refreshed = await selectListPropertiesApi.list(listId);
    setProperties(refreshed);
    return refreshed;
  };

  return {
    DEFAULT_SELECT_LIST_PROPERTIES,
    properties,
    setProperties,
    applyLoaded,
    propertyDrafts,
    propertyPendingAdds,
    propertyPendingDeletes,
    propertySelectedIds,
    propertyNewRow,
    setPropertyNewRow,
    propertyNewRowFirstInputRef,
    propertyNewRowRef,
    propertyColumns,
    propertyTableRows,
    customPropertyDefs,
    propertyTypeByKey,
    hasPropertyChanges,
    getPropertyRowStatus,
    handlePropertyRowChange,
    togglePropertySelect,
    togglePropertySelectAll,
    clearPropertySelection,
    copySelectedProperties,
    deleteSelectedProperties,
    handlePropertyNewRowBlur,
    finalizeNewPropertyRow,
    persist,
  };
}
