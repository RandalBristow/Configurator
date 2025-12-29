import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useResizableSidePanel } from "../../hooks/useResizableSidePanel";
import { selectListGroupsApi, selectListItemsApi, selectListsApi } from "../../api/entities";
import type { SelectList, SelectListGroupSet, SelectListItem } from "../../types/domain";
import { ConfirmDialog } from "../../components/dialogs/ConfirmDialog";
import { SelectListHeaderBar } from "../../components/select-lists/SelectListHeaderBar";
import {
  DataGrid,
  type DataGridColumn,
} from "../../components/table/DataTable";
import { DataTableToolbar } from "../../components/table/DataTableToolbar";
import { SelectListMetaForm } from "../../components/select-lists/SelectListMetaForm";
import { GroupSetToolbar } from "../../components/select-lists/GroupSetToolbar";

type Props = {
  showInactive: boolean;
  selectListId?: string;
  onSelectList: (id?: string) => void;
};

type DraftMap = Record<string, Partial<SelectListItem>>;

type PendingGroupSet = { id: string; name: string; createdAt: string; updatedAt: string };
type DisplayGroupSet = SelectListGroupSet & { __pending?: boolean };

const EMPTY_ITEM: Partial<SelectListItem> = {
  value: "",
  displayValue: "",
  order: 0,
  isActive: true,
  tooltip: "",
  comments: "",
};

export function SelectListItemsSection({
  showInactive,
  selectListId,
  onSelectList,
}: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [currentListId, setCurrentListId] = useState<string | undefined>(
    selectListId
  );
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");

  const [rows, setRows] = useState<SelectListItem[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [newRow, setNewRow] = useState<Partial<SelectListItem>>(EMPTY_ITEM);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [pendingAdds, setPendingAdds] = useState<SelectListItem[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [lastSelectedListId, setLastSelectedListId] = useState<string | undefined>();
  const [groupSetName, setGroupSetName] = useState("");
  const [openGroupSets, setOpenGroupSets] = useState<Set<string>>(new Set());
  const [editingGroupSetId, setEditingGroupSetId] = useState<string | null>(null);
  const [editingGroupSetName, setEditingGroupSetName] = useState("");
  const [groupNewRows, setGroupNewRows] = useState<Record<string, { name?: string }>>({});
  const [groupDrafts, setGroupDrafts] = useState<Record<string, string>>({});
  const [groupSelections, setGroupSelections] = useState<Record<string, Set<string>>>({});
  const [selectedGroupSetId, setSelectedGroupSetId] = useState<string | undefined>();
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [membershipsByGroup, setMembershipsByGroup] = useState<Record<string, Set<string>>>({});
  const [membershipDirtyRowsByGroup, setMembershipDirtyRowsByGroup] = useState<Record<string, Set<string>>>({});
  const membershipVersionRef = useRef<Record<string, number>>({});
  const [pendingGroupAdds, setPendingGroupAdds] = useState<Record<string, string[]>>({});
  const [pendingGroupDeletes, setPendingGroupDeletes] = useState<Record<string, Set<string>>>({});
  const [pendingGroupSetDeletes, setPendingGroupSetDeletes] = useState<Set<string>>(new Set());
  const [pendingGroupSetAdds, setPendingGroupSetAdds] = useState<PendingGroupSet[]>([]);
  const newRowFirstInputRef = useRef<HTMLInputElement | null>(null);
  const newRowRef = useRef<HTMLTableRowElement | null>(null);
  const groupNewRowFirstInputRefs = useRef<Record<string, MutableRefObject<HTMLInputElement | null>>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

  const {
    panelCollapsed,
    setPanelCollapsed,
    panelSize,
    splitterSize,
    onSplitterMouseDown,
  } = useResizableSidePanel({ storageKeyBase: "selectListItems" });

  const listsQuery = useQuery({
    queryKey: ["select-lists"],
    queryFn: () => selectListsApi.list(),
  });

  const groupSetsQuery = useQuery({
    queryKey: ["select-list-group-sets", currentListId],
    queryFn: () =>
      currentListId ? selectListGroupsApi.listGroupSets(currentListId) : Promise.resolve([]),
    enabled: Boolean(currentListId),
  });

  const itemsQuery = useQuery({
    queryKey: ["select-list-items", currentListId, showInactive],
    queryFn: () => selectListItemsApi.list(currentListId, showInactive),
    enabled: Boolean(currentListId),
  });

  const membershipsQuery = useQuery({
    queryKey: ["select-list-group-memberships", currentListId, selectedGroupSetId, selectedGroupId],
    queryFn: () =>
      currentListId && selectedGroupId
        ? selectListGroupsApi.listMemberships(currentListId, selectedGroupId)
        : Promise.resolve([]),
     enabled: Boolean(currentListId && selectedGroupId),
  });

  useEffect(() => {
    console.debug(
      "[SelectListItemsSection] selectListId",
      selectListId,
      "currentListId",
      currentListId,
      "isCreatingNew",
      isCreatingNew,
    );
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

  const filteredLists = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return listsQuery.data ?? [];
    return (listsQuery.data ?? []).filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.description ?? "").toLowerCase().includes(term)
    );
  }, [listsQuery.data, search]);

  const currentList: SelectList | undefined = useMemo(
    () => (listsQuery.data ?? []).find((l) => l.id === currentListId),
    [listsQuery.data, currentListId]
  );

  useEffect(() => {
    setListName(currentList?.name ?? "");
    setListDescription(currentList?.description ?? "");
  }, [currentList]);

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
    setGroupSetName("");
    setOpenGroupSets(new Set());
    setEditingGroupSetId(null);
    setEditingGroupSetName("");
    setGroupNewRows({});
    setGroupDrafts({});
    setGroupSelections({});
    setSelectedGroupSetId(undefined);
    setSelectedGroupId(undefined);
    setMembershipsByGroup({});
    setMembershipDirtyRowsByGroup({});
    setPendingGroupAdds({});
    setPendingGroupDeletes({});
    setPendingGroupSetDeletes(new Set());
    setPendingGroupSetAdds([]);
    membershipVersionRef.current = {};
  }, [currentListId]);

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

  const handleRowChange = (
    id: string,
    key: keyof SelectListItem,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [key]: value },
    }));
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setConfirmDialog({
      open: true,
      title: `Delete ${ids.length} row(s)?`,
      description: "This cannot be undone.",
      onConfirm: async () => {
        setPendingDeletes((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.add(id));
          return next;
        });
        setSelectedIds(new Set());
        setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
      },
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
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
      { key: "value", header: "*Value", type: "string" },
      { key: "displayValue", header: "*Display Value", type: "string" },
      {
        key: "order",
        header: "*Order",
        type: "number",
        width: 70,
        align: "center",
      },
      {
        key: "isActive",
        header: "Active",
        type: "boolean",
        width: 70,
        align: "center",
        filterLabel: (val) => (val ? "Active" : "Inactive"),
      },
      { key: "tooltip", header: "Tooltip", type: "string" },
      { key: "comments", header: "Comments", type: "string" },
    ],
    []
  );

  type SelectListItemRow = SelectListItem & { __member?: boolean };
  type GroupRow = { id: string; name: string };

  const groupColumns = useMemo<DataGridColumn<GroupRow>[]>(
    () => [{ key: "name", header: "Group", type: "string" }],
    []
  );

  const listMetaDirty =
    (currentList?.name ?? "") !== listName ||
    (currentList?.description ?? "") !== listDescription;
  const hasMembershipChanges = Object.values(membershipDirtyRowsByGroup).some(
    (set) => (set?.size ?? 0) > 0,
  );
  const hasGroupChanges =
    Object.keys(groupDrafts).length > 0 ||
    Object.values(pendingGroupAdds).some((names) => names.length > 0) ||
    Object.values(pendingGroupDeletes).some((set) => set.size > 0) ||
    pendingGroupSetAdds.length > 0 ||
    pendingGroupSetDeletes.size > 0;
  const hasUnsaved =
    Object.keys(drafts).length > 0 ||
    pendingDeletes.size > 0 ||
    Boolean(newRow.value?.trim() || newRow.displayValue?.trim()) ||
    listMetaDirty ||
    pendingAdds.length > 0 ||
    hasMembershipChanges ||
    hasGroupChanges;

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
    setLastSelectedListId(currentListId);
    setCurrentListId(undefined);
    onSelectList(undefined);
    setListName("");
    setListDescription("");
    setRows([]);
    setDrafts({});
    setSelectedIds(new Set());
    setPendingDeletes(new Set());
    setNewRow(EMPTY_ITEM);
    setPendingAdds([]);
  };

  const handleStartNewList = () => {
    if (hasUnsaved) {
      setConfirmDialog({
        open: true,
        title: "Start a new list?",
        description: "Unsaved changes will be lost.",
        onConfirm: resetToNewList,
      });
      return;
    }
    resetToNewList();
  };

  const handleCancelNewList = () => {
    const performCancel = () => {
      setIsCreatingNew(false);
      setPendingAdds([]);
      setPendingDeletes(new Set());
      setDrafts({});
      setNewRow(EMPTY_ITEM);
      const fallbackId =
        lastSelectedListId ??
        (listsQuery.data && listsQuery.data.length ? listsQuery.data[0].id : undefined);
      if (fallbackId) {
        setCurrentListId(fallbackId);
        onSelectList(fallbackId);
      }
    };

    if (hasUnsaved) {
      setConfirmDialog({
        open: true,
        title: "Discard new list?",
        description: "Unsaved changes will be lost.",
        onConfirm: performCancel,
      });
      return;
    }

    performCancel();
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

  const groupsDisabled = isCreatingNew || !currentListId;
  const groupSets = groupSetsQuery.data ?? [];
  const visibleRealGroupSets = groupSets.filter((set) => !pendingGroupSetDeletes.has(set.id));
    const pendingDisplaySets: DisplayGroupSet[] = pendingGroupSetAdds.map((pending) => ({
      id: pending.id,
      selectListId: currentListId ?? "",
      name: pending.name,
      description: "",
      createdAt: pending.createdAt,
      updatedAt: pending.updatedAt,
      groups: [],
      __pending: true,
    }));
  const visibleGroupSets: DisplayGroupSet[] = [...visibleRealGroupSets, ...pendingDisplaySets];
  const visibleGroupSetIdsKey = `${visibleRealGroupSets.map((s) => s.id).join(",")}|${pendingGroupSetAdds
    .map((s) => s.id)
    .join(",")}|${Array.from(pendingGroupSetDeletes).join(",")}`;
  useEffect(() => {
    const existing = new Set(visibleGroupSets.map((set) => set.id));
    setOpenGroupSets((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of Array.from(next)) {
        if (!existing.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [visibleGroupSetIdsKey]);
  const selectedGroupSet = visibleGroupSets.find((set) => set.id === selectedGroupSetId);
  const selectedGroupOptions = selectedGroupSet?.groups ?? [];
  const groupSelectionActive = Boolean(selectedGroupId);
  const membershipIds = selectedGroupId ? membershipsByGroup[selectedGroupId] ?? new Set() : new Set();
  const membershipDirtyRows =
    selectedGroupId ? membershipDirtyRowsByGroup[selectedGroupId] ?? new Set() : new Set();

  const visibleRows = useMemo(() => {
    return [...rows, ...pendingAdds];
  }, [rows, pendingAdds]);

  const tableRows = useMemo<SelectListItemRow[]>(() => {
    return visibleRows
      .filter((row) => !pendingDeletes.has(row.id))
      .map((row) => ({
        ...row,
        __member: groupSelectionActive ? membershipIds.has(row.id) : undefined,
      }));
  }, [visibleRows, pendingDeletes, groupSelectionActive, membershipIds]);

  const getGroupRowStatus = (_setId: string) => (row: GroupRow): "new" | "edited" | undefined => {
    if (row.id.startsWith("pending-")) return "new";
    if (groupDrafts[row.id]) return "edited";
    return undefined;
  };

  const tableColumns = useMemo<DataGridColumn<SelectListItemRow>[]>(() => {
      if (!groupSelectionActive) return columns as DataGridColumn<SelectListItemRow>[];
    const header =
      selectedGroupOptions.find((group) => group.id === selectedGroupId)?.name ?? "Sub";
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
        enableSort: false,
      },
      ...(columns as DataGridColumn<SelectListItemRow>[]),
    ];
    }, [columns, groupSelectionActive, selectedGroupId, selectedGroupOptions]);

  const getRowStatus = (row: SelectListItem): "new" | "edited" | undefined => {
    if (pendingAdds.some((pending) => pending.id === row.id)) return "new";
    if (drafts[row.id]) return "edited";
    if (membershipDirtyRows.has(row.id)) return "edited";
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

      setDrafts({});
      setPendingDeletes(new Set());
      setSelectedIds(new Set());
      const setIdByGroupId: Record<string, string> = {};
      visibleRealGroupSets.forEach((set) => {
        set.groups.forEach((group) => {
          setIdByGroupId[group.id] = set.id;
        });
      });

      for (const [groupId, draft] of Object.entries(groupDrafts)) {
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
      setGroupDrafts({});
      const stagedGroupSetAdds = pendingGroupSetAdds;

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
        Object.entries(pendingGroupAdds).flatMap(([setId, names]) =>
          names
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
      setPendingGroupAdds({});

      await Promise.all(
        Object.entries(pendingGroupDeletes).flatMap(([setId, ids]) =>
          Array.from(ids).map((groupId) =>
            removeGroup.mutateAsync({ selectListId: listId, setId, groupId }),
          ),
        ),
      );
      setPendingGroupDeletes({});

      if (pendingGroupSetDeletes.size) {
        await Promise.all(
          Array.from(pendingGroupSetDeletes).map((setId) =>
            removeGroupSet.mutateAsync({ selectListId: listId, setId }),
          ),
        );
        setPendingGroupSetDeletes(new Set());
      }
      if (stagedGroupSetAdds.length) {
        setPendingGroupSetAdds([]);
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
      const refreshed = await selectListItemsApi.list(listId, showInactive);
      setRows(refreshed);
      setNewRow(EMPTY_ITEM);
      if (selectedGroupId) {
        await qc.invalidateQueries({
          queryKey: [
            "select-list-group-memberships",
            listId,
            selectedGroupSetId,
            selectedGroupId,
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
    if (!selectedGroupSetId) return;
    if (!visibleGroupSets.some((set) => set.id === selectedGroupSetId)) {
      setSelectedGroupSetId(undefined);
      setSelectedGroupId(undefined);
    }
  }, [visibleGroupSets, selectedGroupSetId]);

    useEffect(() => {
      if (!selectedGroupId) return;
      if (!selectedGroupOptions.some((group) => group.id === selectedGroupId)) {
        setSelectedGroupId(undefined);
      }
    }, [selectedGroupId, selectedGroupOptions]);

  useEffect(() => {
    if (!groupSelectionActive) return;
    setSelectedIds(new Set());
  }, [groupSelectionActive]);

  useEffect(() => {
    if (!membershipsQuery.data || !selectedGroupId) return;
    if ((membershipDirtyRowsByGroup[selectedGroupId]?.size ?? 0) > 0) return;
    const incomingVersion = membershipsQuery.dataUpdatedAt;
    const currentVersion = membershipVersionRef.current[selectedGroupId] ?? 0;
    if (incomingVersion <= currentVersion) return;
    const next = new Set(membershipsQuery.data.map((entry) => entry.itemId));
    setMembershipsByGroup((prev) => ({ ...prev, [selectedGroupId]: next }));
    membershipVersionRef.current = {
      ...membershipVersionRef.current,
      [selectedGroupId]: incomingVersion,
    };
  }, [membershipsQuery.data, membershipsQuery.dataUpdatedAt, selectedGroupId, membershipDirtyRowsByGroup]);

  const handleToggleMembership = (itemId: string, nextChecked: boolean) => {
    if (!selectedGroupId) return;
    if (itemId.startsWith("local-")) {
      toast.error("Save the row before adding it to a group.");
      return;
    }
    setMembershipsByGroup((prev) => {
      const next = new Set(prev[selectedGroupId] ?? []);
      if (nextChecked) next.add(itemId);
      else next.delete(itemId);
      return { ...prev, [selectedGroupId]: next };
    });
    setMembershipDirtyRowsByGroup((prev) => {
      const next = { ...prev };
      const dirty = new Set(next[selectedGroupId] ?? []);
      dirty.add(itemId);
      next[selectedGroupId] = dirty;
      return next;
    });
    membershipVersionRef.current = {
      ...membershipVersionRef.current,
      [selectedGroupId]: Date.now(),
    };
  };

  const toggleGroupSetOpen = (setId: string) => {
    setOpenGroupSets((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) next.delete(setId);
      else next.add(setId);
      return next;
    });
  };

  const isGroupSetNameTaken = (name: string, ignoreId?: string | null) => {
    const normalized = name.trim().toLowerCase();
    if (
      pendingGroupSetAdds.some(
        (pending) => pending.id !== ignoreId && pending.name.trim().toLowerCase() === normalized,
      )
    ) {
      return true;
    }
    return groupSets.some(
      (set) => set.id !== ignoreId && set.name.trim().toLowerCase() === normalized,
    );
  };

  const handleAddGroupSet = () => {
    if (groupsDisabled) return;
    const name = groupSetName.trim();
    if (!name) {
      toast.error("Group set name is required");
      return;
    }
    const normalized = name.toLowerCase();
    if (
      isGroupSetNameTaken(name) ||
      pendingGroupSetAdds.some((existing) => existing.name.toLowerCase() === normalized)
    ) {
      toast.error("Group set name must be unique");
      return;
    }
    const tempId = `pending-set-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();
    setPendingGroupSetAdds((prev) => [
      ...prev,
      { id: tempId, name, createdAt: nowIso, updatedAt: nowIso },
    ]);
    setOpenGroupSets((prev) => {
      const next = new Set(prev);
      next.add(tempId);
      return next;
    });
    setSelectedGroupSetId(tempId);
    setSelectedGroupId(undefined);
    setGroupSetName("");
    toast.success("Group set staged for creation");
  };

  const handleStartEditGroupSet = (set: SelectListGroupSet) => {
    setEditingGroupSetId(set.id);
    setEditingGroupSetName(set.name);
  };

  const handleCancelEditGroupSet = () => {
    setEditingGroupSetId(null);
    setEditingGroupSetName("");
  };

  const handleSaveGroupSet = async (setId: string) => {
    if (!currentListId) return;
    const name = editingGroupSetName.trim();
    if (!name) {
      toast.error("Group set name is required");
      return;
    }
    if (isGroupSetNameTaken(name, setId)) {
      toast.error("Group set name must be unique");
      return;
    }
    try {
      await updateGroupSet.mutateAsync({ selectListId: currentListId, setId, name });
      setEditingGroupSetId(null);
      setEditingGroupSetName("");
    } catch (err) {
      toast.error(`Update failed: ${String(err)}`);
    }
  };

  const handleDeleteGroupSet = (set: DisplayGroupSet) => {
    if (!currentListId) return;
    setConfirmDialog({
      open: true,
      title: `Delete "${set.name}"?`,
      description: "This will stage the group set for deletion while you save.",
      onConfirm: () => {
        if (set.__pending) {
          setPendingGroupSetAdds((prev) => prev.filter((pending) => pending.id !== set.id));
          toast.warning("Pending group set removed");
          return;
        }
        setPendingGroupSetDeletes((prev) => {
          const next = new Set(prev);
          next.add(set.id);
          return next;
        });
        setOpenGroupSets((prev) => {
          const next = new Set(prev);
          next.delete(set.id);
          return next;
        });
        setGroupSelections((prev) => {
          const next = { ...prev };
          delete next[set.id];
          return next;
        });
        setPendingGroupAdds((prev) => {
          const next = { ...prev };
          delete next[set.id];
          return next;
        });
        setPendingGroupDeletes((prev) => {
          const next = { ...prev };
          delete next[set.id];
          return next;
        });
        if (selectedGroupSetId === set.id) {
          setSelectedGroupSetId(undefined);
          setSelectedGroupId(undefined);
        }
        toast.warning("Group set staged for deletion");
      },
    });
  };

  const handleCreateGroup = (setId: string, name: string) => {
    if (groupsDisabled) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const set = groupSets.find((s) => s.id === setId);
    const existingNames = new Set<string>();
    set?.groups.forEach((group) => existingNames.add(group.name.trim().toLowerCase()));
    (pendingGroupAdds[setId] ?? []).forEach((pending) =>
      existingNames.add(pending.trim().toLowerCase()),
    );
    if (existingNames.has(trimmed.toLowerCase())) {
      toast.error("Group name must be unique in this set");
      return;
    }
    setPendingGroupAdds((prev) => ({
      ...prev,
      [setId]: [...(prev[setId] ?? []), trimmed],
    }));
  };

  const handleGroupNewRowChange = (setId: string, value: string) => {
    setGroupNewRows((prev) => ({ ...prev, [setId]: { name: value } }));
  };

  const getGroupNewRowFirstInputRef = (
    setId: string,
  ): MutableRefObject<HTMLInputElement | null> => {
    if (!groupNewRowFirstInputRefs.current[setId]) {
      groupNewRowFirstInputRefs.current[setId] = { current: null };
    }
    return groupNewRowFirstInputRefs.current[setId];
  };

  const handleGroupNewRowBlur = (setId: string) => {
    const name = groupNewRows[setId]?.name ?? "";
    if (!name.trim()) return;
    handleCreateGroup(setId, name);
    setGroupNewRows((prev) => ({ ...prev, [setId]: { name: "" } }));
    requestAnimationFrame(() => {
      getGroupNewRowFirstInputRef(setId).current?.focus();
    });
  };

  const handleGroupNameChange = (_setId: string, groupId: string, value: string) => {
    setGroupDrafts((prev) => ({ ...prev, [groupId]: value }));
  };

  const handleToggleGroupSelect = (setId: string, groupId: string) => {
    setGroupSelections((prev) => {
      const next = { ...prev };
      const set = new Set(next[setId] ?? []);
      if (set.has(groupId)) set.delete(groupId);
      else set.add(groupId);
      next[setId] = set;
      return next;
    });
  };

  const handleToggleGroupSelectAll = (setId: string, ids: string[]) => {
    setGroupSelections((prev) => ({ ...prev, [setId]: new Set(ids) }));
  };

  const handleDeleteSelectedGroups = (set: SelectListGroupSet) => {
    if (!currentListId) return;
    const selection = groupSelections[set.id];
    const ids = selection ? Array.from(selection) : [];
    if (!ids.length) return;
    setConfirmDialog({
      open: true,
      title: `Delete ${ids.length} group(s)?`,
      description: "This cannot be undone.",
      onConfirm: async () => {
        setPendingGroupDeletes((prev) => {
          const next = { ...prev };
          const setDeletes = new Set(next[set.id] ?? []);
          ids.forEach((groupId) => setDeletes.add(groupId));
          next[set.id] = setDeletes;
          return next;
        });
        setGroupSelections((prev) => ({ ...prev, [set.id]: new Set() }));
        toast.success(`${ids.length} group(s) staged for deletion`);
      },
    });
  };

  const parseGroupNames = (text: string) => {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/[\t,]/)[0].trim())
      .filter(Boolean);
  };

  const handleImportGroups = async (set: SelectListGroupSet, names: string[]) => {
    if (!currentListId) return;
    const existing = new Set(set.groups.map((g) => g.name.trim().toLowerCase()));
    const uniqueNames = Array.from(
      new Set(names.map((n) => n.trim()).filter(Boolean)),
    ).filter((name) => !existing.has(name.toLowerCase()));
    if (!uniqueNames.length) {
      toast.error("No new groups to import");
      return;
    }
    await Promise.all(
      uniqueNames.map((name) =>
        createGroup.mutateAsync({ selectListId: currentListId, setId: set.id, name }),
      ),
    );
    toast.success(`Imported ${uniqueNames.length} group(s)`);
  };

  const handleImportGroupsFromClipboard = async (set: SelectListGroupSet) => {
    try {
      const text = await navigator.clipboard.readText();
      const names = parseGroupNames(text);
      await handleImportGroups(set, names);
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleImportGroupsFromFile = async (
    set: SelectListGroupSet,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const names = parseGroupNames(text);
      await handleImportGroups(set, names);
    } catch (err) {
      toast.error(String(err));
    } finally {
      e.target.value = "";
    }
  };

  const handleCopySelectedGroups = async (set: SelectListGroupSet) => {
    const selection = groupSelections[set.id];
    const ids = selection ? Array.from(selection) : [];
    if (!ids.length) return;
    const selectedNames = set.groups
      .filter((g) => ids.includes(g.id))
      .map((g) => g.name);
    try {
      await navigator.clipboard.writeText(selectedNames.join("\n"));
      toast.success("Copied selected groups");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="select-list-screen">
      <div
        className="inspector-shell"
        style={{
          gridTemplateColumns: `minmax(0, 1fr) ${splitterSize}px ${panelSize}px`,
          columnGap: 0,
        }}
      >
        <div className="select-list-main" style={{ paddingRight: 0 }}>
          <SelectListHeaderBar
            currentListId={currentListId}
            lists={filteredLists}
            search={search}
            isCreatingNew={isCreatingNew}
            controlsDisabled={isCreatingNew}
            onSearchChange={setSearch}
            onChangeList={(id) => {
              if (!id) {
                resetToNewList();
                return;
              }
              setIsCreatingNew(false);
              setCurrentListId(id);
              onSelectList(id);
            }}
            onNew={handleStartNewList}
            onSave={handleSaveAll}
            onDelete={handleDeleteList}
            onCancel={isCreatingNew ? handleCancelNewList : undefined}
            saveDisabled={!listName.trim()}
            deleteDisabled={!currentListId}
          />

          <div
            className="card full-width full-height"
            style={{ paddingRight: 12 }}
          >

            <SelectListMetaForm
              listName={listName}
              listDescription={listDescription}
              onChangeName={setListName}
              onChangeDescription={setListDescription}
              onFocusSelectAll={handleFocusSelectAll}
            />

            <div className="table-toolbar" style={{ marginBottom: 10 }}>
              <div className="table-toolbar-left" style={{ gap: 12 }}>
                <label className="small" style={{ fontWeight: 600 }}>
                  Group set
                  <select
                    className="table-input"
                    style={{ marginLeft: 0, minWidth: 180 }}
                    value={selectedGroupSetId ?? ""}
                    onChange={(e) => {
                      const nextId = e.target.value || undefined;
                      setSelectedGroupSetId(nextId);
                      setSelectedGroupId(undefined);
                    }}
                    disabled={groupsDisabled}
                  >
                    <option value="">Select group set</option>
                    {groupSets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="small" style={{ fontWeight: 600 }}>
                  Group
                      <select
                        className="table-input"
                        style={{ marginLeft: 0, minWidth: 180 }}
                        value={selectedGroupId ?? ""}
                        onChange={(e) => setSelectedGroupId(e.target.value || undefined)}
                        disabled={groupsDisabled || !selectedGroupSetId}
                      >
                        <option value="">Select group</option>
                        {selectedGroupOptions.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                </label>
              </div>
            </div>
            <DataTableToolbar
              selectedCount={selectedIds.size}
              canReset={Boolean(currentListId)}
              disabled={isCreatingNew}
              onImportClipboard={handleImportClipboard}
              onImportFile={handleImportFile}
              onClearSelection={handleClearSelection}
              onCopySelected={copySelectedRows}
              onDeleteSelected={handleDeleteSelected}
              onReset={handleResetItems}
            />

            <div className="table-pane">
              <DataGrid
                columns={tableColumns}
                rows={tableRows}
                getRowId={(row) => row.id}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={(ids) => setSelectedIds(new Set(ids))}
                onRowChange={(id, key, value) => {
                  if (key === "__member") {
                    handleToggleMembership(id, Boolean(value));
                    return;
                  }
                  handleRowChange(id, key as keyof SelectListItem, value);
                }}
                newRow={newRow as Partial<SelectListItemRow>}
                onNewRowChange={(key, value) => {
                  if (key === "__member") return;
                  setNewRow((prev) => ({ ...prev, [key]: value }));
                }}
                onFocusSelectAll={handleFocusSelectAll}
                newRowRef={newRowRef}
                newRowFirstInputRef={newRowFirstInputRef}
                onNewRowBlur={handleNewRowBlur}
                enableSelection
                enableFilters
                enableSorting
                selectionDisabled={groupSelectionActive}
                disabled={isCreatingNew}
                getRowStatus={(row) => getRowStatus(row)}
              />
            </div>
          </div>
        </div>

        <div
          className={`side-splitter ${panelCollapsed ? "collapsed" : ""}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize side panel"
          onMouseDown={onSplitterMouseDown}
          style={{
            width: splitterSize,
            pointerEvents: panelCollapsed ? "none" : "auto",
            height: "100%",
            alignSelf: "stretch",
            margin: 0,
            zIndex: 60,
            cursor: panelCollapsed ? "default" : "col-resize",
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.02), rgba(0,0,0,0.04))",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!panelCollapsed && (
            <div
              className="splitter-handle"
              onMouseDown={onSplitterMouseDown}
              style={{
                width: 28,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "col-resize",
                userSelect: "none",
                touchAction: "none",
              }}
            >
              {/* simple visual bar */}
              <div
                style={{
                  width: 3,
                  height: 20,
                  background: "rgba(0,0,0,0.22)",
                  borderRadius: 2,
                }}
              />
            </div>
          )}
        </div>

        <div className={`side-pane ${panelCollapsed ? "collapsed" : ""}`}>
          <div className="side-pane-header">
            <button
              className="side-pane-toggle"
              type="button"
              onClick={() => setPanelCollapsed((prev) => !prev)}
              title={panelCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {panelCollapsed ? <ChevronLeft size={28} /> : <ChevronRight size={28} />}
            </button>
          </div>
            <div className="side-pane-content">
              {/* Your existing content goes here */}
              {!panelCollapsed && (
              <>
                <div className="side-pane-tabs">
                  <button className="tab active" type="button">
                    Groups
                  </button>
                  <button className="tab" type="button" disabled>
                    Properties
                  </button>
                </div>
                <div className="side-pane-content">
                  <div className="muted small">
                    Manage group sets and groups for this list.
                  </div>
                  {groupsDisabled && (
                    <div className="muted small" style={{ marginTop: 8 }}>
                      Save the select list to manage group sets.
                    </div>
                  )}
                  <div className="pane-header-actions row" style={{ marginTop: 8, gap: 8 }}>
                    <button
                      className="btn secondary small-btn"
                      type="button"
                      onClick={handleAddGroupSet}
                      disabled={groupsDisabled || createGroupSet.isPending}
                    >
                      Add
                    </button>
                    <input
                      className="table-input"
                      placeholder="New group set name"
                      style={{ flex: 1 }}
                      value={groupSetName}
                      onChange={(e) => setGroupSetName(e.target.value)}
                      disabled={groupsDisabled}
                    />
                  </div>
                  {groupSetsQuery.isLoading && (
                    <div className="muted small" style={{ marginTop: 10 }}>
                      Loading group sets...
                    </div>
                  )}
                  {!groupSetsQuery.isLoading && visibleGroupSets.length === 0 && (
                    <div className="muted small" style={{ marginTop: 10 }}>
                      No group sets yet.
                    </div>
                  )}
                    {visibleGroupSets.map((set) => {
                      const isOpen = openGroupSets.has(set.id);
                      const isEditing = editingGroupSetId === set.id;
                      const existingRows: GroupRow[] = (set.groups ?? []).map((group) => ({
                        id: group.id,
                        name: groupDrafts[group.id] ?? group.name,
                      }));
                      const pendingRows = (pendingGroupAdds[set.id] ?? []).map((name, idx) => ({
                        id: `pending-${set.id}-${idx}`,
                        name,
                      }));
                      const deletes = pendingGroupDeletes[set.id] ?? new Set<string>();
                      const activeRows = existingRows.filter((row) => !deletes.has(row.id));
                      const groupRows: GroupRow[] = [...activeRows, ...pendingRows];
                      const selectedGroups = groupSelections[set.id] ?? new Set<string>();
                      return (
                        <div key={set.id} className="group-set">
                          <div className="group-set-header">
                            <button
                              className="group-set-toggle"
                              type="button"
                              onClick={() => toggleGroupSetOpen(set.id)}
                            >
                              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              {isEditing ? (
                                <input
                                  className="table-input"
                                  value={editingGroupSetName}
                                  onChange={(e) => setEditingGroupSetName(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ width: "100%" }}
                                />
                              ) : (
                                <span className="group-set-title">{set.name}</span>
                              )}
                            </button>
                            <div className="group-set-actions">
                              {isEditing ? (
                                <>
                                  <button
                                    className="icon-plain"
                                    type="button"
                                    title="Save name"
                                    onClick={() => handleSaveGroupSet(set.id)}
                                    disabled={updateGroupSet.isPending}
                                  >
                                    <Check size={18} />
                                  </button>
                                  <button
                                    className="icon-plain"
                                    type="button"
                                    title="Cancel"
                                    onClick={handleCancelEditGroupSet}
                                  >
                                    <X size={18} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="icon-plain"
                                    type="button"
                                    title="Edit group set"
                                    onClick={() => handleStartEditGroupSet(set)}
                                    disabled={groupsDisabled}
                                  >
                                    <Pencil size={18} />
                                  </button>
                                  <button
                                    className="icon-plain"
                                    type="button"
                                    title="Delete group set"
                                    onClick={() => handleDeleteGroupSet(set)}
                                    disabled={groupsDisabled}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {isOpen && (
                            <div className="group-set-body">
                                <GroupSetToolbar
                                  disabled={groupsDisabled}
                                  hasSelection={selectedGroups.size > 0}
                                onImportClipboard={() => handleImportGroupsFromClipboard(set)}
                                onImportFile={(e) => {
                                  handleImportGroupsFromFile(set, e);
                                }}
                                onClearSelection={() => handleToggleGroupSelectAll(set.id, [])}
                                onCopySelected={() => handleCopySelectedGroups(set)}
                                onDeleteSelected={() => handleDeleteSelectedGroups(set)}
                              />
                              <div className="group-set-table">
                                <DataGrid
                                  columns={groupColumns}
                                  rows={groupRows}
                                  getRowId={(row) => row.id}
                                  selectedIds={selectedGroups}
                                  onToggleSelect={(id) => handleToggleGroupSelect(set.id, id)}
                                  onToggleSelectAll={(ids) =>
                                    handleToggleGroupSelectAll(set.id, ids)
                                  }
                                  onRowChange={(id, _key, value) =>
                                    handleGroupNameChange(set.id, id, String(value))
                                  }
                                  newRow={groupNewRows[set.id] ?? {}}
                                    onNewRowChange={(_key, value) =>
                                      handleGroupNewRowChange(set.id, String(value))
                                    }
                                    onNewRowBlur={() => handleGroupNewRowBlur(set.id)}
                                    newRowFirstInputRef={getGroupNewRowFirstInputRef(set.id)}
                                    enableSelection
                                  enableFilters={false}
                                  enableSorting={false}
                                  showNewRow
                                  disabled={groupsDisabled}
                                  getRowStatus={getGroupRowStatus(set.id)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

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

    </div>
  );
}
