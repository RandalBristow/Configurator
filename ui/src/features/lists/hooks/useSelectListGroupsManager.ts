import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { toast } from "sonner";
import type { DisplayGroupSet, GroupRow } from "../../../components/select-lists/SelectListGroupsPane";
import type { SelectListGroupSet } from "../../../types/domain";
import type { ConfirmFn } from "./useSelectListPropertiesManager";

type PendingGroupSet = { id: string; name: string; createdAt: string; updatedAt: string };
type PendingGroupAdd = { id: string; name: string };

type UseSelectListGroupsManagerArgs = {
  currentListId?: string;
  groupsDisabled: boolean;
  groupSets: SelectListGroupSet[];
  onListChangedKey: string;
  confirm: ConfirmFn;
  updateGroupSetName: (args: { selectListId: string; setId: string; name: string }) => Promise<unknown>;
  createGroupNow: (args: { selectListId: string; setId: string; name: string }) => Promise<unknown>;
};

export function useSelectListGroupsManager({
  currentListId,
  groupsDisabled,
  groupSets,
  onListChangedKey,
  confirm,
  updateGroupSetName,
  createGroupNow,
}: UseSelectListGroupsManagerArgs) {
  const [groupSetName, setGroupSetName] = useState("");
  const [openGroupSets, setOpenGroupSets] = useState<Set<string>>(new Set());
  const [editingGroupSetId, setEditingGroupSetId] = useState<string | null>(null);
  const [editingGroupSetName, setEditingGroupSetName] = useState("");
  const [groupNewRows, setGroupNewRows] = useState<Record<string, { name?: string }>>({});
  const [groupDrafts, setGroupDrafts] = useState<Record<string, string>>({});
  const [groupSelections, setGroupSelections] = useState<Record<string, Set<string>>>({});
  const [selectedGroupSetId, setSelectedGroupSetId] = useState<string | undefined>();
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [pendingGroupAdds, setPendingGroupAdds] = useState<Record<string, PendingGroupAdd[]>>({});
  const [pendingGroupDeletes, setPendingGroupDeletes] = useState<Record<string, Set<string>>>({});
  const [pendingGroupSetDeletes, setPendingGroupSetDeletes] = useState<Set<string>>(new Set());
  const [pendingGroupSetAdds, setPendingGroupSetAdds] = useState<PendingGroupSet[]>([]);

  const groupNewRowFirstInputRefs = useRef<Record<string, MutableRefObject<HTMLInputElement | null>>>({});

  const reset = () => {
    setGroupSetName("");
    setOpenGroupSets(new Set());
    setEditingGroupSetId(null);
    setEditingGroupSetName("");
    setGroupNewRows({});
    setGroupDrafts({});
    setGroupSelections({});
    setSelectedGroupSetId(undefined);
    setSelectedGroupId(undefined);
    setPendingGroupAdds({});
    setPendingGroupDeletes({});
    setPendingGroupSetDeletes(new Set());
    setPendingGroupSetAdds([]);
    groupNewRowFirstInputRefs.current = {};
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onListChangedKey]);

  const visibleRealGroupSets = useMemo(
    () => groupSets.filter((set) => !pendingGroupSetDeletes.has(set.id)),
    [groupSets, pendingGroupSetDeletes],
  );

  const pendingDisplaySets: DisplayGroupSet[] = useMemo(
    () =>
      pendingGroupSetAdds.map((pending) => ({
        id: pending.id,
        selectListId: currentListId ?? "",
        name: pending.name,
        description: "",
        createdAt: pending.createdAt,
        updatedAt: pending.updatedAt,
        groups: [],
        __pending: true,
      })),
    [pendingGroupSetAdds, currentListId],
  );

  const visibleGroupSets: DisplayGroupSet[] = useMemo(
    () => [...visibleRealGroupSets, ...pendingDisplaySets],
    [visibleRealGroupSets, pendingDisplaySets],
  );

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
  }, [visibleGroupSetIdsKey, visibleGroupSets]);

  const selectedGroupSet = useMemo(
    () => visibleGroupSets.find((set) => set.id === selectedGroupSetId),
    [visibleGroupSets, selectedGroupSetId],
  );

  const selectedGroupOptions = selectedGroupSet?.groups ?? [];
  const groupSelectionActive = Boolean(selectedGroupId);

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
    return groupSets.some((set) => set.id !== ignoreId && set.name.trim().toLowerCase() === normalized);
  };

  const handleAddGroupSet = () => {
    if (groupsDisabled) return;
    const name = groupSetName.trim();
    if (!name) {
      toast.error("Group set name is required");
      return;
    }
    if (isGroupSetNameTaken(name)) {
      toast.error("Group set name must be unique");
      return;
    }
    const tempId = `pending-set-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();
    setPendingGroupSetAdds((prev) => [...prev, { id: tempId, name, createdAt: nowIso, updatedAt: nowIso }]);
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
      await updateGroupSetName({ selectListId: currentListId, setId, name });
      setEditingGroupSetId(null);
      setEditingGroupSetName("");
    } catch (err) {
      toast.error(`Update failed: ${String(err)}`);
    }
  };

  const handleDeleteGroupSet = (set: DisplayGroupSet) => {
    if (!currentListId) return;
    confirm({
      title: `Delete \"${set.name}\"?`,
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

  const handleCreateGroup = (setId: string, pending: PendingGroupAdd) => {
    if (groupsDisabled) return;
    const trimmed = pending.name.trim();
    if (!trimmed) return;

    const set = groupSets.find((s) => s.id === setId);
    const existingNames = new Set<string>();
    set?.groups.forEach((group) =>
      existingNames.add((groupDrafts[group.id] ?? group.name).trim().toLowerCase()),
    );
    (pendingGroupAdds[setId] ?? []).forEach((existingPending) =>
      existingNames.add(existingPending.name.trim().toLowerCase()),
    );

    if (existingNames.has(trimmed.toLowerCase())) {
      toast.error("Group name must be unique in this set");
      return;
    }
    setPendingGroupAdds((prev) => ({ ...prev, [setId]: [...(prev[setId] ?? []), { ...pending, name: trimmed }] }));
  };

  const handleGroupNewRowChange = (setId: string, value: string) => {
    setGroupNewRows((prev) => ({ ...prev, [setId]: { name: value } }));
  };

  const getGroupNewRowFirstInputRef = (setId: string): MutableRefObject<HTMLInputElement | null> => {
    if (!groupNewRowFirstInputRefs.current[setId]) {
      groupNewRowFirstInputRefs.current[setId] = { current: null };
    }
    return groupNewRowFirstInputRefs.current[setId];
  };

  const handleGroupNewRowBlur = (setId: string, draft?: GroupRow) => {
    const name = draft?.name ?? groupNewRows[setId]?.name ?? "";
    if (!name.trim()) return;
    const id =
      draft?.id ??
      `pending-${setId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    handleCreateGroup(setId, { id, name });
    setGroupNewRows((prev) => ({ ...prev, [setId]: { name: "" } }));
  };

  const handleGroupNameChange = (setId: string, groupId: string, value: string) => {
    const prefix = `pending-${setId}-`;
    if (groupId.startsWith(prefix)) {
      setPendingGroupAdds((prev) => {
        const existing = prev[setId] ?? [];
        const idx = existing.findIndex((p) => p.id === groupId);
        if (idx === -1) return prev;
        const nextForSet = existing.slice();
        nextForSet[idx] = { ...nextForSet[idx], name: value };
        return { ...prev, [setId]: nextForSet };
      });
      return;
    }

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
    confirm({
      title: `Delete ${ids.length} group(s)?`,
      description: "This cannot be undone.",
      onConfirm: async () => {
        const prefix = `pending-${set.id}-`;
        const pendingIds = ids.filter((id) => id.startsWith(prefix));

        if (pendingIds.length) {
          setPendingGroupAdds((prev) => {
            const existing = prev[set.id] ?? [];
            if (!existing.length) return prev;
            const nextForSet = existing.filter((p) => !pendingIds.includes(p.id));
            return { ...prev, [set.id]: nextForSet };
          });
        }

        const realIds = ids.filter((id) => !id.startsWith(prefix));
        setPendingGroupDeletes((prev) => {
          const next = { ...prev };
          const setDeletes = new Set(next[set.id] ?? []);
          realIds.forEach((groupId) => setDeletes.add(groupId));
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
    const uniqueNames = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean))).filter(
      (name) => !existing.has(name.toLowerCase()),
    );
    if (!uniqueNames.length) {
      toast.error("No new groups to import");
      return;
    }
    await Promise.all(
      uniqueNames.map((name) => createGroupNow({ selectListId: currentListId, setId: set.id, name })),
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

  const handleImportGroupsFromFile = async (set: SelectListGroupSet, e: React.ChangeEvent<HTMLInputElement>) => {
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
    const selectedNames = set.groups.filter((g) => ids.includes(g.id)).map((g) => g.name);
    try {
      await navigator.clipboard.writeText(selectedNames.join("\n"));
      toast.success("Copied selected groups");
    } catch {
      toast.error("Copy failed");
    }
  };

  const getGroupRowStatus = (_setId: string) => (row: GroupRow): "new" | "edited" | undefined => {
    if (row.id.startsWith("pending-")) return "new";
    if (groupDrafts[row.id]) return "edited";
    return undefined;
  };

  const groupRowsBySetId = useMemo<Record<string, GroupRow[]>>(() => {
    const map: Record<string, GroupRow[]> = {};
    for (const set of visibleGroupSets) {
      const existingRows: GroupRow[] = (set.groups ?? []).map((group) => ({
        id: group.id,
        name: groupDrafts[group.id] ?? group.name,
      }));
      const pendingRows = (pendingGroupAdds[set.id] ?? []).map((pending) => ({
        id: pending.id,
        name: pending.name,
      }));
      const deletes = pendingGroupDeletes[set.id] ?? new Set<string>();
      const activeRows = existingRows.filter((row) => !deletes.has(row.id));
      map[set.id] = [...activeRows, ...pendingRows];
    }
    return map;
  }, [visibleGroupSets, groupDrafts, pendingGroupAdds, pendingGroupDeletes]);

  const onChangeSelectedGroupSetId = (id: string | undefined) => {
    setSelectedGroupSetId(id);
    setSelectedGroupId(undefined);
  };

  return {
    groupSetName,
    setGroupSetName,
    openGroupSets,
    toggleGroupSetOpen,
    editingGroupSetId,
    editingGroupSetName,
    setEditingGroupSetName,
    selectedGroupSetId,
    selectedGroupId,
    onChangeSelectedGroupSetId,
    setSelectedGroupId,
    groupSelectionActive,
    selectedGroupOptions,
    groupNewRows,
    handleGroupNewRowChange,
    handleGroupNewRowBlur,
    getGroupNewRowFirstInputRef,
    groupDrafts,
    setGroupDrafts,
    handleGroupNameChange,
    groupSelections,
    handleToggleGroupSelect,
    handleToggleGroupSelectAll,
    pendingGroupAdds,
    pendingGroupDeletes,
    pendingGroupSetDeletes,
    pendingGroupSetAdds,
    visibleRealGroupSets,
    visibleGroupSets,
    getGroupRowStatus,
    groupRowsBySetId,
    handleAddGroupSet,
    handleStartEditGroupSet,
    handleCancelEditGroupSet,
    handleSaveGroupSet,
    handleDeleteGroupSet,
    handleImportGroupsFromClipboard,
    handleImportGroupsFromFile,
    handleCopySelectedGroups,
    handleDeleteSelectedGroups,
    setPendingGroupAdds,
    setPendingGroupDeletes,
    setPendingGroupSetDeletes,
    setPendingGroupSetAdds,
    setGroupSelections,
    setOpenGroupSets,
  };
}
