import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { useResizableSidePanel } from "../../hooks/useResizableSidePanel";
import { selectListGroupsApi, selectListItemsApi, selectListItemPropertiesApi, selectListPropertiesApi, selectListsApi } from "../../api/entities";
import type { SelectList, SelectListItem, SelectListItemProperty, SelectListPropertyType } from "../../types/domain";
import { ConfirmDialog } from "../../components/dialogs/ConfirmDialog";
import { useTabToolbar } from "../../layout/TabToolbarContext";
import { SelectListObjectToolbar } from "../../components/select-lists/SelectListObjectToolbar";
import { SelectListDetailsPane } from "../../components/select-lists/SelectListDetailsPane";
import { SelectListItemsTablePane } from "../../components/select-lists/SelectListItemsTablePane";
import { type DataGridColumn } from "../../components/table/DataTable";
import { SelectListGroupsPane, type GroupRow } from "../../components/select-lists/SelectListGroupsPane";
import { SelectListPropertiesPane } from "../../components/select-lists/SelectListPropertiesPane";
import { WorkspaceShell } from "../../components/workspace/WorkspaceShell";
import { WorkspaceSideMenubar } from "../../components/workspace/WorkspaceSideMenubar";
import { useSelectListPropertiesManager } from "./hooks/useSelectListPropertiesManager";
import { useSelectListGroupsManager } from "./hooks/useSelectListGroupsManager";
import { ToolbarButton, ToolbarDivider } from "../../components/ui/ToolbarButton";
import {
  Calendar,
  Copy,
  Eraser,
  Hash,
  Info,
  KeyRound,
  ListOrdered,
  MessageSquareText,
  ToggleRight,
  Trash2,
  Type,
  Users,
} from "lucide-react";

type Props = {
  selectListId?: string;
  onSelectList: (id?: string) => void;
  metaDraft?: { name: string; description: string };
  onMetaDraftChange?: (draft: { name: string; description: string }) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

type DraftMap = Record<string, Partial<SelectListItem>>;
type SidePaneTab = "details" | "groups" | "properties";

const EMPTY_ITEM: Partial<SelectListItem> = {
  value: "",
  displayValue: "",
  order: 0,
  isActive: true,
  tooltip: "",
  comments: "",
};

const HEADER_ICON_SIZE = 14;

const iconForPropertyType = (dataType: SelectListPropertyType) => {
  switch (dataType) {
    case "number":
      return <Hash size={HEADER_ICON_SIZE} />;
    case "boolean":
      return <ToggleRight size={HEADER_ICON_SIZE} />;
    case "datetime":
      return <Calendar size={HEADER_ICON_SIZE} />;
    default:
      return <Type size={HEADER_ICON_SIZE} />;
  }
};

export function SelectListItemsSection({
  selectListId,
  onSelectList,
  metaDraft,
  onMetaDraftChange,
  onDirtyChange,
}: Props) {
  const qc = useQueryClient();
  const { setLeftToolbar } = useTabToolbar();
  const [currentListId, setCurrentListId] = useState<string | undefined>(
    selectListId
  );
  const [internalListName, setInternalListName] = useState("");
  const [internalListDescription, setInternalListDescription] = useState("");

  const [rows, setRows] = useState<SelectListItem[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [newRow, setNewRow] = useState<Partial<SelectListItem>>(EMPTY_ITEM);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [pendingAdds, setPendingAdds] = useState<SelectListItem[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [membershipsByGroup, setMembershipsByGroup] = useState<Record<string, Set<string>>>({});
  const [membershipDirtyRowsByGroup, setMembershipDirtyRowsByGroup] = useState<Record<string, Set<string>>>({});
  const membershipVersionRef = useRef<Record<string, number>>({});
  const [itemPropertyDrafts, setItemPropertyDrafts] = useState<Record<string, Record<string, any>>>({});
  const [sidePaneTab, setSidePaneTab] = useState<SidePaneTab>("groups");
  const newRowFirstInputRef = useRef<HTMLInputElement | null>(null);
  const newRowRef = useRef<HTMLTableRowElement | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

  const confirm = ({ title, description, onConfirm }: { title: string; description?: string; onConfirm: () => void }) =>
    setConfirmDialog({ open: true, title, description, onConfirm });

  const propertiesManager = useSelectListPropertiesManager({
    currentListId,
    onListChangedKey: currentListId ?? "none",
    confirm,
  });

  const {
    panelSize,
    splitterSize,
    onSplitterMouseDown,
  } = useResizableSidePanel({ storageKeyBase: "selectListItems", enableCollapse: false });

  const listsQuery = useQuery({
    queryKey: ["select-lists"],
    queryFn: () => selectListsApi.list(),
  });

  const groupSetsQuery = useQuery({
    queryKey: ["select-list-group-sets", currentListId],
    queryFn: () =>
      currentListId ? selectListGroupsApi.listGroupSets(currentListId) : Promise.resolve([]),
    enabled: Boolean(currentListId),
    placeholderData: keepPreviousData,
  });

  const propertiesQuery = useQuery({
    queryKey: ["select-list-properties", currentListId],
    queryFn: () =>
      currentListId ? selectListPropertiesApi.list(currentListId) : Promise.resolve([]),
    enabled: Boolean(currentListId),
    placeholderData: keepPreviousData,
  });

  const itemsQuery = useQuery({
    queryKey: ["select-list-items", currentListId],
    queryFn: () => selectListItemsApi.list(currentListId, true),
    enabled: Boolean(currentListId),
    placeholderData: keepPreviousData,
  });

  const itemPropertiesQuery = useQuery({
    queryKey: ["select-list-item-properties", currentListId],
    queryFn: () =>
      currentListId ? selectListItemPropertiesApi.list(currentListId) : Promise.resolve([]),
    enabled: Boolean(currentListId),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setCurrentListId(selectListId);
    if (selectListId) {
      setIsCreatingNew(false);
    }
  }, [selectListId]);

  // Auto-select first list when available
  useEffect(() => {
    if (
      !currentListId &&
      !isCreatingNew &&
      (listsQuery.data?.length ?? 0) > 0
    ) {
      setCurrentListId(listsQuery.data![0].id);
      onSelectList(listsQuery.data![0].id);
    }
  }, [listsQuery.data, currentListId, isCreatingNew, onSelectList]);

  const currentList: SelectList | undefined = useMemo(
    () => (listsQuery.data ?? []).find((l) => l.id === currentListId),
    [listsQuery.data, currentListId]
  );

  useEffect(() => {
    if (!currentList || !onMetaDraftChange || metaDraft) return;
    onMetaDraftChange({
      name: currentList.name ?? "",
      description: currentList.description ?? "",
    });
  }, [currentList, metaDraft, onMetaDraftChange]);

  useEffect(() => {
    if (metaDraft && onMetaDraftChange) return;
    setInternalListName(currentList?.name ?? "");
    setInternalListDescription(currentList?.description ?? "");
  }, [currentList, metaDraft, onMetaDraftChange]);

  const listName = metaDraft?.name ?? internalListName;
  const listDescription = metaDraft?.description ?? internalListDescription;

  const handleListNameChange = (value: string) => {
    if (onMetaDraftChange) {
      onMetaDraftChange({ name: value, description: listDescription });
      return;
    }
    setInternalListName(value);
  };

  const handleListDescriptionChange = (value: string) => {
    if (onMetaDraftChange) {
      onMetaDraftChange({ name: listName, description: value });
      return;
    }
    setInternalListDescription(value);
  };

  useEffect(() => {
    if (itemsQuery.data) {
      setRows(itemsQuery.data);
      setDrafts({});
      setSelectedIds(new Set());
      setPendingDeletes(new Set());
      setNewRow(EMPTY_ITEM);
    }
    setPendingAdds([]);
  }, [itemsQuery.data, currentListId]);

  useEffect(() => {
    setPendingAdds([]);
    setNewRow(EMPTY_ITEM);
    setMembershipsByGroup({});
    setMembershipDirtyRowsByGroup({});
    setItemPropertyDrafts({});
    setSidePaneTab("groups");
    membershipVersionRef.current = {};
  }, [currentListId]);

  useEffect(() => {
    if (isCreatingNew) setSidePaneTab("details");
  }, [isCreatingNew]);

  useEffect(() => {
    propertiesManager.applyLoaded(propertiesQuery.data);
  }, [propertiesQuery.data, currentListId]);

  const createList = useMutation({
    mutationFn: (data: Partial<SelectList>) => selectListsApi.create(data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["select-lists"] });
    },
  });

  const updateList = useMutation({
    mutationFn: (data: { id: string; payload: Partial<SelectList> }) =>
      selectListsApi.update(data.id, data.payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["select-lists"] });
    },
  });

  const createGroupSet = useMutation({
    mutationFn: (data: { selectListId: string; name: string }) =>
      selectListGroupsApi.createGroupSet(data.selectListId, {
        name: data.name,
      }),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: ["select-list-group-sets", variables.selectListId],
      });
    },
  });

  const updateGroupSet = useMutation({
    mutationFn: (data: {
      selectListId: string;
      setId: string;
      name?: string;
    boundSelectListId?: string | null;
  }) =>
    selectListGroupsApi.updateGroupSet(data.selectListId, data.setId, {
      name: data.name,
      boundSelectListId: data.boundSelectListId,
    }),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: ["select-list-group-sets", variables.selectListId],
      });
    },
  });

  const removeGroupSet = useMutation({
    mutationFn: (data: { selectListId: string; setId: string }) =>
      selectListGroupsApi.removeGroupSet(data.selectListId, data.setId),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: ["select-list-group-sets", variables.selectListId],
      });
    },
  });

  const createGroup = useMutation({
    mutationFn: (data: { selectListId: string; setId: string; name: string }) =>
      selectListGroupsApi.createGroup(data.selectListId, data.setId, { name: data.name }),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: ["select-list-group-sets", variables.selectListId],
      });
    },
  });

  const updateGroup = useMutation({
    mutationFn: (data: { selectListId: string; setId: string; groupId: string; name: string }) =>
      selectListGroupsApi.updateGroup(data.selectListId, data.setId, data.groupId, { name: data.name }),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: ["select-list-group-sets", variables.selectListId],
      });
    },
  });

  const removeGroup = useMutation({
    mutationFn: (data: { selectListId: string; setId: string; groupId: string }) =>
      selectListGroupsApi.removeGroup(data.selectListId, data.setId, data.groupId),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: ["select-list-group-sets", variables.selectListId],
      });
    },
  });

  const setMemberships = useMutation({
    mutationFn: (data: { selectListId: string; groupId: string; itemIds: string[] }) =>
      selectListGroupsApi.setMemberships(data.selectListId, data.groupId, data.itemIds),
    onError: (err) => {
      console.error("Failed to save memberships", err);
      toast.error("Memberships could not be saved. Check console.");
    },
  });

  const groupsDisabled = isCreatingNew || !currentListId;
  const groupSets = groupSetsQuery.data ?? [];

  const groupsManager = useSelectListGroupsManager({
    currentListId,
    groupsDisabled,
    groupSets,
    onListChangedKey: currentListId ?? "none",
    confirm,
    updateGroupSetName: ({ selectListId, setId, name }) =>
      updateGroupSet.mutateAsync({ selectListId, setId, name }),
    createGroupNow: ({ selectListId, setId, name }) =>
      createGroup.mutateAsync({ selectListId, setId, name }),
  });

  const membershipsQuery = useQuery({
    queryKey: [
      "select-list-group-memberships",
      currentListId,
      groupsManager.selectedGroupSetId,
      groupsManager.selectedGroupId,
    ],
    queryFn: () =>
      currentListId && groupsManager.selectedGroupId
        ? selectListGroupsApi.listMemberships(currentListId, groupsManager.selectedGroupId)
        : Promise.resolve([]),
    enabled: Boolean(currentListId && groupsManager.selectedGroupId),
    placeholderData: keepPreviousData,
  });

  const handleRowChange = (
    id: string,
    key: keyof SelectListItem,
    value: any
  ) => {
    if (id.startsWith("local-")) {
      setPendingAdds((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
      return;
    }

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [key]: value },
    }));
  };

  const handleItemPropertyChange = (itemId: string, propKey: string, value: any) => {
    if (itemId.startsWith("local-")) {
      toast.error("Save the row before editing extra properties.");
      return;
    }
    setItemPropertyDrafts((prev) => {
      const nextForItem = { ...(prev[itemId] ?? {}) };
      nextForItem[propKey] = value;
      return { ...prev, [itemId]: nextForItem };
    });
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const localIds = ids.filter((id) => id.startsWith("local-"));
    const existingIds = ids.filter((id) => !id.startsWith("local-"));
    setConfirmDialog({
      open: true,
      title: `Delete ${ids.length} row(s)?`,
      description: "This cannot be undone.",
      onConfirm: async () => {
        if (existingIds.length) {
          setPendingDeletes((prev) => {
            const next = new Set(prev);
            existingIds.forEach((id) => next.add(id));
            return next;
          });
          setRows((prev) => prev.filter((r) => !existingIds.includes(r.id)));
        }
        if (localIds.length) {
          setPendingAdds((prev) => prev.filter((r) => !localIds.includes(r.id)));
        }
        setSelectedIds(new Set());
      },
    });
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const copySelectedRows = async () => {
    if (!selectedIds.size) return;
    const headers = [
      "Value",
      "Display Value",
      "Order",
      "Active",
      "Tooltip",
      "Comments",
    ];
    const lines = rows
      .filter((r) => selectedIds.has(r.id) && !pendingDeletes.has(r.id))
      .map((r) =>
        [
          r.value,
          r.displayValue,
          r.order,
          r.isActive ? "Active" : "Inactive",
          r.tooltip ?? "",
          r.comments ?? "",
        ].join("\t")
      );
    const text = [headers.join("\t"), ...lines].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied selected rows");
    } catch {
      toast.error("Copy failed");
    }
  };

  const parsePlainTextTable = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return [];
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0]
      .split(delimiter)
      .map((h) => h.trim().toLowerCase());
    const expected = [
      "value",
      "display value",
      "displayvalue",
      "order",
      "active",
      "tooltip",
      "comments",
    ];
    const headerMatches = headers.some((h) => expected.includes(h));
    const dataLines = headerMatches ? lines.slice(1) : lines;
    const normalizedHeaders = headerMatches
      ? headers
      : ["value", "display value", "order", "active", "tooltip", "comments"];
    return dataLines.map((line) => {
      const values = line.split(delimiter);
      const obj: any = {};
      normalizedHeaders.forEach((h, idx) => {
        obj[h] = values[idx] ?? "";
      });
      return obj;
    });
  };

  const importRecords = async (records: any[]) => {
    if (!currentListId) {
      toast.error("Select a list first.");
      return;
    }
    for (const rec of records) {
      const payload: Partial<SelectListItem> = {
        selectListId: currentListId,
        value: (rec["value"] ?? rec["Value"] ?? rec[""] ?? "")
          .toString()
          .trim(),
        displayValue: (rec["display value"] ?? rec["Display Value"] ?? "")
          .toString()
          .trim(),
        order: Number(rec["order"] ?? rec["Order"] ?? 0) || 0,
        isActive:
          String(rec["active"] ?? rec["Active"] ?? "true").toLowerCase() !==
          "false",
        tooltip: rec["tooltip"] ?? rec["Tooltip"] ?? undefined,
        comments: rec["comments"] ?? rec["Comments"] ?? undefined,
      };
      if (!payload.value || !payload.displayValue) continue;
      await selectListItemsApi.create(payload);
    }
    qc.invalidateQueries({ queryKey: ["select-list-items"] });
    toast.success(`Imported ${records.length} row(s)`);
  };

  const handleImportClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parsePlainTextTable(text);
      if (!parsed.length) {
        toast.error("No rows detected");
        return;
      }
      if (!window.confirm(`Import ${parsed.length} row(s)?`)) return;
      await importRecords(parsed);
    } catch (err) {
      console.error("Save failed", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Save failed: ${message}`, { duration: 8000 });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parsePlainTextTable(text);
      if (!parsed.length) {
        toast.error("No rows detected");
        return;
      }
      if (!window.confirm(`Import ${parsed.length} row(s)?`)) return;
      await importRecords(parsed);
    } catch (err) {
      toast.error(String(err));
    } finally {
      e.target.value = "";
    }
  };

  const handleFocusSelectAll = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const columns = useMemo<DataGridColumn<SelectListItem>[]>(
    () => [
      { key: "value", header: "*Value", type: "string", headerIcon: <KeyRound size={HEADER_ICON_SIZE} /> },
      {
        key: "displayValue",
        header: "*Display Value",
        type: "string",
        headerIcon: <Type size={HEADER_ICON_SIZE} />,
      },
      {
        key: "order",
        header: "*Order",
        type: "number",
        align: "center",
        headerIcon: <ListOrdered size={HEADER_ICON_SIZE} />,
      },
      {
        key: "isActive",
        header: "Active",
        type: "boolean",
        align: "center",
        filterLabel: (val) => (val ? "Active" : "Inactive"),
        headerIcon: <ToggleRight size={HEADER_ICON_SIZE} />,
      },
      { key: "tooltip", header: "Tooltip", type: "string", headerIcon: <Info size={HEADER_ICON_SIZE} /> },
      {
        key: "comments",
        header: "Comments",
        type: "string",
        headerIcon: <MessageSquareText size={HEADER_ICON_SIZE} />,
      },
    ],
    []
  );

  type SelectListItemRow = SelectListItem & { __member?: boolean };

  const groupColumns = useMemo<DataGridColumn<GroupRow>[]>(
    () => [{ key: "name", header: "Group", type: "string", headerIcon: <Users size={HEADER_ICON_SIZE} /> }],
    []
  );

  const listMetaDirty =
    (currentList?.name ?? "") !== listName ||
    (currentList?.description ?? "") !== listDescription;
  const hasMembershipChanges = Object.values(membershipDirtyRowsByGroup).some(
    (set) => (set?.size ?? 0) > 0,
  );
  const hasItemPropertyChanges = Object.values(itemPropertyDrafts).some(
    (changes) => Object.keys(changes ?? {}).length > 0,
  );
  const hasPropertyChanges = propertiesManager.hasPropertyChanges;
  const hasGroupChanges =
    Object.keys(groupsManager.groupDrafts).length > 0 ||
    Object.values(groupsManager.pendingGroupAdds).some((names) => names.length > 0) ||
    Object.values(groupsManager.pendingGroupDeletes).some((set) => set.size > 0) ||
    groupsManager.pendingGroupSetAdds.length > 0 ||
    groupsManager.pendingGroupSetDeletes.size > 0;
  const hasUnsaved =
    Object.keys(drafts).length > 0 ||
    pendingDeletes.size > 0 ||
    Boolean(newRow.value?.trim() || newRow.displayValue?.trim()) ||
    listMetaDirty ||
    pendingAdds.length > 0 ||
    hasMembershipChanges ||
    hasItemPropertyChanges ||
    hasPropertyChanges ||
    hasGroupChanges;

  useEffect(() => {
    onDirtyChange?.(hasUnsaved);
    return () => onDirtyChange?.(false);
  }, [hasUnsaved, onDirtyChange]);

  const finalizeNewRow = (opts?: { showError?: boolean }) => {
    const trimmedValue = newRow.value?.trim();
    const trimmedDisplayValue = newRow.displayValue?.trim();
    if (!trimmedValue || !trimmedDisplayValue || !currentListId) {
      if (!currentListId && opts?.showError) {
        toast.error("Select a list first.");
      }
      return null;
    }
    const pendingRow: SelectListItem = {
      id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      selectListId: currentListId,
      value: trimmedValue,
      displayValue: trimmedDisplayValue,
      order: Number(newRow.order) || 0,
      isActive: newRow.isActive ?? true,
      tooltip: newRow.tooltip,
      comments: newRow.comments,
    };
    setPendingAdds((prev) => [...prev, pendingRow]);
    setNewRow(EMPTY_ITEM);
    requestAnimationFrame(() => {
      newRowFirstInputRef.current?.focus();
    });
    return pendingRow;
  };

  const handleNewRowBlur = (e: React.FocusEvent<HTMLTableRowElement>) => {
    const next = e.relatedTarget as HTMLElement | null;
    if (newRowRef.current && next && newRowRef.current.contains(next)) return;
    finalizeNewRow({ showError: true });
  };

  const resetToNewList = () => {
    setIsCreatingNew(true);
    setCurrentListId(undefined);
    onSelectList(undefined);
    setInternalListName("");
    setInternalListDescription("");
    setRows([]);
    setDrafts({});
    setItemPropertyDrafts({});
    setSelectedIds(new Set());
    setPendingDeletes(new Set());
    setNewRow(EMPTY_ITEM);
    setPendingAdds([]);
  };

  const handleDeleteList = () => {
    if (!currentListId) return;
    const name = listName.trim() || currentList?.name || "this list";
    setConfirmDialog({
      open: true,
      title: `Delete "${name}" ?`,
      description: "This will remove the select list and its items.",
      onConfirm: async () => {
        try {
          await selectListsApi.remove(currentListId);
          const result = await listsQuery.refetch();
          const nextId = result.data?.[0]?.id;
          if (nextId) {
            setCurrentListId(nextId);
            onSelectList(nextId);
            setIsCreatingNew(false);
          } else {
            resetToNewList();
          }
          toast.success("Select list deleted");
        } catch (err) {
          toast.error(`Delete failed: ${String(err)}`);
        }
      },
    });
  };

  const handleResetItems = () => {
    if (!currentListId) return;
    void itemsQuery.refetch();
  };

  const selectedGroupOptions = groupsManager.selectedGroupOptions;
  const groupSelectionActive = groupsManager.groupSelectionActive;
  const membershipIds = groupsManager.selectedGroupId
    ? membershipsByGroup[groupsManager.selectedGroupId] ?? new Set()
    : new Set();
  const membershipDirtyRows = groupsManager.selectedGroupId
    ? membershipDirtyRowsByGroup[groupsManager.selectedGroupId] ?? new Set()
    : new Set();

  const customPropertyDefs = propertiesManager.customPropertyDefs;
  const propertyTypeByKey = propertiesManager.propertyTypeByKey;

  const itemPropertiesByItemId = useMemo(() => {
    const map: Record<string, Record<string, SelectListItemProperty>> = {};
    (itemPropertiesQuery.data ?? []).forEach((p) => {
      map[p.itemId] ??= {};
      map[p.itemId][p.key] = p;
    });
    return map;
  }, [itemPropertiesQuery.data]);

  const itemPropertyDirtyRows = useMemo(() => {
    const dirty = new Set<string>();
    Object.entries(itemPropertyDrafts).forEach(([itemId, changes]) => {
      if (Object.keys(changes ?? {}).length) dirty.add(itemId);
    });
    return dirty;
  }, [itemPropertyDrafts]);

  const visibleRows = useMemo(() => {
    return [...rows, ...pendingAdds];
  }, [rows, pendingAdds]);

  const tableRows = useMemo<SelectListItemRow[]>(() => {
    return visibleRows
      .filter((row) => !pendingDeletes.has(row.id))
      .map((row) => {
        const next: any = {
          ...row,
          __member: groupSelectionActive ? membershipIds.has(row.id) : undefined,
        };

        const existingProps = itemPropertiesByItemId[row.id] ?? {};
        const draftsForItem = itemPropertyDrafts[row.id] ?? {};

        customPropertyDefs.forEach((def) => {
          const columnKey = `prop:${def.key}`;
          const draftVal = draftsForItem[def.key];
          const storedVal = existingProps[def.key]?.value;
          const value = draftVal !== undefined ? draftVal : storedVal ?? "";

          if (def.dataType === "boolean") {
            next[columnKey] = value === true || value === "true" || value === "1";
          } else {
            next[columnKey] = value ?? "";
          }
        });

        return next as SelectListItemRow;
      });
  }, [
    visibleRows,
    pendingDeletes,
    groupSelectionActive,
    membershipIds,
    itemPropertiesByItemId,
    itemPropertyDrafts,
    customPropertyDefs,
  ]);

  const extraPropertyColumns = useMemo<DataGridColumn<SelectListItemRow>[]>(() => {
    return customPropertyDefs.map((p) => {
      const type: DataGridColumn<SelectListItemRow>["type"] =
        p.dataType === "boolean"
          ? "boolean"
          : p.dataType === "datetime"
            ? "datetime"
            : "string";
      return {
        key: (`prop:${p.key}` as any) as keyof SelectListItemRow,
        header: p.key,
        type,
        headerIcon: iconForPropertyType(p.dataType),
      };
    });
  }, [customPropertyDefs]);

  const tableColumns = useMemo<DataGridColumn<SelectListItemRow>[]>(() => {
    const base = [...(columns as DataGridColumn<SelectListItemRow>[]), ...extraPropertyColumns];
    if (!groupSelectionActive) return base;
    const header =
      selectedGroupOptions.find((group) => group.id === groupsManager.selectedGroupId)?.name ?? "Sub";
    const filterButtonWidth = 34;
    const padding = 16;
    const headerWidth = Math.min(
      200,
      Math.max(60, header.length * 8 + filterButtonWidth + padding),
    );
    return [
      {
        key: "__member",
        header,
        type: "boolean",
        width: headerWidth,
        align: "center",
        headerIcon: <Users size={HEADER_ICON_SIZE} />,
      },
      ...base,
    ];
  }, [columns, extraPropertyColumns, groupSelectionActive, selectedGroupOptions, groupsManager.selectedGroupId]);

  const getRowStatus = (row: SelectListItem): "new" | "edited" | undefined => {
    if (pendingAdds.some((pending) => pending.id === row.id)) return "new";
    if (drafts[row.id]) return "edited";
    if (membershipDirtyRows.has(row.id)) return "edited";
    if (itemPropertyDirtyRows.has(row.id)) return "edited";
    return undefined;
  };

  const handleSaveAll = async () => {
    if (!listName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      let listId = currentListId;
      // Save list metadata (create first if needed to ensure we have an id)
      if (currentList) {
        await updateList.mutateAsync({
          id: currentList.id,
          payload: { name: listName, description: listDescription },
        });
      } else {
        const created = await createList.mutateAsync({
          name: listName,
          description: listDescription,
        });
        const newId = (created as any)?.id;
        if (newId) {
          listId = newId;
          setCurrentListId(newId);
          onSelectList(newId);
        } else {
          throw new Error("Could not create select list");
        }
      }
      if (!listId) throw new Error("Select list id not available");
      setIsCreatingNew(false);

      // Save select-list property definitions (staged)
      if (propertiesManager.hasPropertyChanges) {
        const refreshedProperties = await propertiesManager.persist(listId);
        qc.setQueryData(["select-list-properties", listId], refreshedProperties);
        if (currentListId === listId) {
          await qc.invalidateQueries({ queryKey: ["select-list-item-properties", listId] });
          await itemPropertiesQuery.refetch();
        }
      }

      const finalized = finalizeNewRow({ showError: false });
      const addsToSave = [...pendingAdds];
      if (finalized) addsToSave.push(finalized);
      if (addsToSave.length) {
        await Promise.all(
          addsToSave.map((row) =>
            selectListItemsApi.create({
              ...row,
              selectListId: listId,
              order: Number(row.order) || 0,
            }),
          ),
        );
        setPendingAdds([]);
      }

      // Save edited rows
      const draftEntries = Object.entries(drafts);
      for (const [id, payload] of draftEntries) {
        if (Object.keys(payload).length === 0) continue;
        await selectListItemsApi.update(id, payload);
      }

      // Delete rows
      const deletes = Array.from(pendingDeletes);
      if (deletes.length) {
        await Promise.all(deletes.map((id) => selectListItemsApi.remove(id)));
      }

      // Save extra property values for items
      const itemPropUpdates: Array<{
        itemId: string;
        key: string;
        dataType: SelectListPropertyType;
        value: string | null;
      }> = [];
      for (const [itemId, changes] of Object.entries(itemPropertyDrafts)) {
        if (!changes || pendingDeletes.has(itemId)) continue;
        if (itemId.startsWith("local-")) continue;
        for (const [key, raw] of Object.entries(changes)) {
          const dataType = propertyTypeByKey.get(key);
          if (!dataType) continue;

          let value: string | null;
          if (dataType === "boolean") {
            value = raw ? "true" : "false";
          } else {
            const asString = raw === undefined || raw === null ? "" : String(raw);
            value = asString.trim() ? asString : null;
          }

          itemPropUpdates.push({ itemId, key, dataType, value });
        }
      }
      if (itemPropUpdates.length) {
        await selectListItemPropertiesApi.bulkSet(listId, itemPropUpdates);
        await qc.invalidateQueries({ queryKey: ["select-list-item-properties", listId] });
        await itemPropertiesQuery.refetch();
      }
      setItemPropertyDrafts({});

      setDrafts({});
      setPendingDeletes(new Set());
      setSelectedIds(new Set());
      const setIdByGroupId: Record<string, string> = {};
      groupsManager.visibleRealGroupSets.forEach((set) => {
        set.groups.forEach((group) => {
          setIdByGroupId[group.id] = set.id;
        });
      });

      for (const [groupId, draft] of Object.entries(groupsManager.groupDrafts)) {
        const trimmed = draft.trim();
        if (!trimmed) continue;
        const setId = setIdByGroupId[groupId];
        if (!setId) continue;
        await updateGroup.mutateAsync({
          selectListId: listId,
          setId,
          groupId,
          name: trimmed,
        });
      }
      groupsManager.setGroupDrafts({});
      const stagedGroupSetAdds = groupsManager.pendingGroupSetAdds;

      const tempSetIdMap = new Map<string, string>();
      if (stagedGroupSetAdds.length) {
        for (const pending of stagedGroupSetAdds) {
          const trimmed = pending.name.trim();
          if (!trimmed) continue;
          const created = await createGroupSet.mutateAsync({
            selectListId: listId,
            name: trimmed,
          });
          tempSetIdMap.set(pending.id, created.id);
        }
      }

      await Promise.all(
        Object.entries(groupsManager.pendingGroupAdds).flatMap(([setId, pending]) =>
          pending
            .map((p) => p.name)
            .filter((name) => name.trim())
            .map((name) => {
              const targetSetId = tempSetIdMap.get(setId) ?? setId;
              return createGroup.mutateAsync({
                selectListId: listId,
                setId: targetSetId,
                name: name.trim(),
              });
            }),
        ),
      );
      groupsManager.setPendingGroupAdds({});

      await Promise.all(
        Object.entries(groupsManager.pendingGroupDeletes).flatMap(([setId, ids]) =>
          Array.from(ids).map((groupId) =>
            removeGroup.mutateAsync({ selectListId: listId, setId, groupId }),
          ),
        ),
      );
      groupsManager.setPendingGroupDeletes({});

      if (groupsManager.pendingGroupSetDeletes.size) {
        await Promise.all(
          Array.from(groupsManager.pendingGroupSetDeletes).map((setId) =>
            removeGroupSet.mutateAsync({ selectListId: listId, setId }),
          ),
        );
        groupsManager.setPendingGroupSetDeletes(new Set());
      }
      if (stagedGroupSetAdds.length) {
        groupsManager.setPendingGroupSetAdds([]);
      }

      const dirtyGroupIds = Object.keys(membershipDirtyRowsByGroup).filter(
        (groupId) => (membershipDirtyRowsByGroup[groupId]?.size ?? 0) > 0,
      );
      if (dirtyGroupIds.length) {
        const isUuid = (val: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
        for (const groupId of dirtyGroupIds) {
          const items = membershipsByGroup[groupId];
          if (!items) continue;
          const itemIds = Array.from(items).filter(isUuid);
          if (itemIds.length !== items.size) {
            console.warn("Skipping non-uuid itemIds in memberships", {
              original: Array.from(items),
              filtered: itemIds,
            });
          }
          await setMemberships.mutateAsync({
            selectListId: listId,
            groupId,
            itemIds,
          });
        }
        setMembershipDirtyRowsByGroup({});
      }

      // Refresh items so UI matches backend state
      const refreshed = await selectListItemsApi.list(listId, true);
      setRows(refreshed);
      setNewRow(EMPTY_ITEM);
      if (groupsManager.selectedGroupId) {
        await qc.invalidateQueries({
          queryKey: [
            "select-list-group-memberships",
            listId,
            groupsManager.selectedGroupSetId,
            groupsManager.selectedGroupId,
          ],
        });
        await membershipsQuery.refetch();
      }
      toast.success("Changes saved");
    } catch (err) {
      console.error("Save failed", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Save failed: ${message}`, { duration: 8000 });
    }
  };

  useEffect(() => {
    if (!groupSelectionActive) return;
    setSelectedIds(new Set());
  }, [groupSelectionActive]);

  useEffect(() => {
    const groupId = groupsManager.selectedGroupId;
    if (!membershipsQuery.data || !groupId) return;
    if ((membershipDirtyRowsByGroup[groupId]?.size ?? 0) > 0) return;
    const incomingVersion = membershipsQuery.dataUpdatedAt;
    const currentVersion = membershipVersionRef.current[groupId] ?? 0;
    if (incomingVersion <= currentVersion) return;
    const next = new Set(membershipsQuery.data.map((entry) => entry.itemId));
    setMembershipsByGroup((prev) => ({ ...prev, [groupId]: next }));
    membershipVersionRef.current = {
      ...membershipVersionRef.current,
      [groupId]: incomingVersion,
    };
  }, [
    membershipsQuery.data,
    membershipsQuery.dataUpdatedAt,
    groupsManager.selectedGroupId,
    membershipDirtyRowsByGroup,
  ]);

  const handleToggleMembership = (itemId: string, nextChecked: boolean) => {
    const groupId = groupsManager.selectedGroupId;
    if (!groupId) return;
    if (itemId.startsWith("local-")) {
      toast.error("Save the row before adding it to a group.");
      return;
    }
    setMembershipsByGroup((prev) => {
      const next = new Set(prev[groupId] ?? []);
      if (nextChecked) next.add(itemId);
      else next.delete(itemId);
      return { ...prev, [groupId]: next };
    });
    setMembershipDirtyRowsByGroup((prev) => {
      const next = { ...prev };
      const dirty = new Set(next[groupId] ?? []);
      dirty.add(itemId);
      next[groupId] = dirty;
      return next;
    });
    membershipVersionRef.current = {
      ...membershipVersionRef.current,
      [groupId]: Date.now(),
    };
  };

  const leftActionsRef = useRef({
    onSave: handleSaveAll,
    onDelete: handleDeleteList,
  });

  leftActionsRef.current = {
    onSave: handleSaveAll,
    onDelete: handleDeleteList,
  };

  const onSave = useCallback(() => leftActionsRef.current.onSave(), []);
  const onDelete = useCallback(() => leftActionsRef.current.onDelete(), []);

  const leftToolbarNode = useMemo(
    () => (
      <SelectListObjectToolbar
        controlsDisabled={isCreatingNew}
        saveDisabled={!listName.trim()}
        deleteDisabled={!currentListId}
        onSave={onSave}
        onDelete={onDelete}
      />
    ),
    [isCreatingNew, listName, currentListId, onSave, onDelete],
  );

  useEffect(() => {
    setLeftToolbar(leftToolbarNode);
    return () => setLeftToolbar(null);
  }, [setLeftToolbar, leftToolbarNode]);

  return (
    <WorkspaceShell
      panelSize={panelSize}
      splitterSize={splitterSize}
      onSplitterMouseDown={onSplitterMouseDown}
      main={
        <>
          <div className="center-pane center-pane--flush">
            <SelectListItemsTablePane<SelectListItemRow>
              groupsDisabled={groupsDisabled}
              groupSets={groupSets}
              selectedGroupSetId={groupsManager.selectedGroupSetId}
              onChangeGroupSetId={groupsManager.onChangeSelectedGroupSetId}
              selectedGroupId={groupsManager.selectedGroupId}
              onChangeGroupId={groupsManager.setSelectedGroupId}
              selectedGroupOptions={selectedGroupOptions}
              toolbar={{
                selectedCount: selectedIds.size,
                canReset: Boolean(currentListId),
                disabled: isCreatingNew,
                onImportClipboard: handleImportClipboard,
                onImportFile: handleImportFile,
                onClearSelection: handleClearSelection,
                onCopySelected: copySelectedRows,
                onDeleteSelected: handleDeleteSelected,
                onReset: handleResetItems,
              }}
              grid={{
                columns: tableColumns,
                rows: tableRows,
                selectedIds,
                onToggleSelectAll: (ids) => setSelectedIds(new Set(ids)),
                onRowChange: (id, key, value) => {
                  if (key === "__member") {
                    handleToggleMembership(id, Boolean(value));
                    return;
                  }
                  const k = String(key);
                  if (k.startsWith("prop:")) {
                    const propKey = k.slice("prop:".length);
                    handleItemPropertyChange(id, propKey, value);
                    return;
                  }
                  handleRowChange(id, key as keyof SelectListItem, value);
                },
                newRow: newRow as Partial<SelectListItemRow>,
                onNewRowChange: (key, value) => {
                  if (key === "__member") return;
                  if (String(key).startsWith("prop:")) return;
                  setNewRow((prev) => ({ ...prev, [key]: value }));
                },
                onCommitNewRow: (draft) => {
                  if (!currentListId) {
                    toast.error("Select a list first.");
                    return;
                  }
                  if (!draft) return;
                  const pendingRow: SelectListItem = {
                    id: draft.id,
                    selectListId: currentListId,
                    value: String(draft.value ?? ""),
                    displayValue: String(draft.displayValue ?? ""),
                    order: typeof draft.order === "number" ? draft.order : Number(draft.order) || 0,
                    isActive: draft.isActive ?? true,
                    tooltip: draft.tooltip ?? "",
                    comments: draft.comments ?? "",
                  };
                  setPendingAdds((prev) => {
                    if (prev.some((r) => r.id === pendingRow.id)) return prev;
                    return [...prev, pendingRow];
                  });
                  setNewRow(EMPTY_ITEM);
                },
                newRowRef,
                newRowFirstInputRef,
                onNewRowBlur: handleNewRowBlur,
                selectionDisabled: groupSelectionActive,
                disabled: isCreatingNew,
                getRowStatus: (row) => getRowStatus(row),
              }}
              isLoading={itemsQuery.isFetching || propertiesQuery.isFetching || itemPropertiesQuery.isFetching}
            />
          </div>
        </>
      }
      inspector={
        <>
          <WorkspaceSideMenubar
            tabs={[
              { id: "details", label: "Details" },
              { id: "groups", label: "Groups", disabled: groupsDisabled },
              { id: "properties", label: "Properties", disabled: groupsDisabled },
            ]}
            activeTab={sidePaneTab}
            onChangeTab={(id) => setSidePaneTab(id as SidePaneTab)}
            toolbar={
              sidePaneTab === "properties" ? (
                <div className="selection-bar selection-bar--compact">
                  <div className="selection-bar__actions">
                    <ToolbarButton
                      title="Clear selection"
                      onClick={propertiesManager.clearPropertySelection}
                      disabled={groupsDisabled || propertiesManager.propertySelectedIds.size === 0}
                      icon={<Eraser size={14} />}
                      label="Clear"
                    />
                    <ToolbarButton
                      title="Copy selected rows"
                      onClick={propertiesManager.copySelectedProperties}
                      disabled={groupsDisabled || propertiesManager.propertySelectedIds.size === 0}
                      icon={<Copy size={14} />}
                      label="Copy"
                    />
                    <ToolbarDivider />
                    <ToolbarButton
                      title="Delete selected rows"
                      onClick={propertiesManager.deleteSelectedProperties}
                      disabled={groupsDisabled || propertiesManager.propertySelectedIds.size === 0}
                      icon={<Trash2 size={14} />}
                      label="Delete"
                    />
                  </div>
                </div>
              ) : undefined
            }
          />

          <div className="side-pane-inner side-pane-inner--flush">
            {sidePaneTab === "details" ? (
              <SelectListDetailsPane
                listName={listName}
                listDescription={listDescription}
                onChangeName={handleListNameChange}
                onChangeDescription={handleListDescriptionChange}
                onFocusSelectAll={handleFocusSelectAll}
              />
            ) : sidePaneTab === "groups" ? (
              <SelectListGroupsPane
                disabled={groupsDisabled}
                groupSetName={groupsManager.groupSetName}
                onChangeGroupSetName={groupsManager.setGroupSetName}
                onAddGroupSet={groupsManager.handleAddGroupSet}
                creatingGroupSet={createGroupSet.isPending}
                isLoading={groupSetsQuery.isLoading}
                visibleGroupSets={groupsManager.visibleGroupSets}
                openGroupSets={groupsManager.openGroupSets}
                onToggleOpen={groupsManager.toggleGroupSetOpen}
                editingGroupSetId={groupsManager.editingGroupSetId}
                editingGroupSetName={groupsManager.editingGroupSetName}
                onChangeEditingGroupSetName={groupsManager.setEditingGroupSetName}
                onStartEditGroupSet={groupsManager.handleStartEditGroupSet}
                onCancelEditGroupSet={groupsManager.handleCancelEditGroupSet}
                onSaveGroupSet={groupsManager.handleSaveGroupSet}
                updatingGroupSet={updateGroupSet.isPending}
                onDeleteGroupSet={groupsManager.handleDeleteGroupSet}
                groupColumns={groupColumns}
                getRowStatus={groupsManager.getGroupRowStatus}
                groupRowsBySetId={groupsManager.groupRowsBySetId}
                groupSelectionsBySetId={groupsManager.groupSelections}
                onToggleGroupSelectAll={groupsManager.handleToggleGroupSelectAll}
                onGroupNameChange={groupsManager.handleGroupNameChange}
                groupNewRowsBySetId={groupsManager.groupNewRows}
                onGroupNewRowChange={groupsManager.handleGroupNewRowChange}
                onGroupCommitNewRow={(setId, draft) => groupsManager.handleGroupNewRowBlur(setId, draft)}
                onClearSelection={(setId) => groupsManager.handleToggleGroupSelectAll(setId, [])}
                onCopySelected={groupsManager.handleCopySelectedGroups}
                onDeleteSelected={groupsManager.handleDeleteSelectedGroups}
              />
            ) : (
              <SelectListPropertiesPane
                disabled={groupsDisabled}
                isLoading={propertiesQuery.isLoading}
                columns={propertiesManager.propertyColumns}
                rows={propertiesManager.propertyTableRows}
                selectedIds={propertiesManager.propertySelectedIds}
                onToggleSelectAll={propertiesManager.togglePropertySelectAll}
                onRowChange={propertiesManager.handlePropertyRowChange}
                newRow={propertiesManager.propertyNewRow}
                onNewRowChange={(key, value) =>
                  propertiesManager.setPropertyNewRow((prev) => ({ ...prev, [key]: value }))
                }
                onCommitNewRow={() => propertiesManager.finalizeNewPropertyRow()}
                getRowStatus={propertiesManager.getPropertyRowStatus}
              />
            )}
          </div>
        </>
      }
    >
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null);
          }}
          onConfirm={() => {
            const action = confirmDialog.onConfirm;
            setConfirmDialog(null);
            action();
          }}
        />
      )}
    </WorkspaceShell>
  );
}
