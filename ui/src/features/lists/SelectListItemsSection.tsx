import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useResizableSidePanel } from "../../hooks/useResizableSidePanel";
import { selectListItemsApi, selectListsApi } from "../../api/entities";
import type { SelectList, SelectListItem } from "../../types/domain";
import { ConfirmDialog } from "../../components/dialogs/ConfirmDialog";
import { SelectListHeaderBar } from "../../components/select-lists/SelectListHeaderBar";
import {
  DataGrid,
  type DataGridColumn,
} from "../../components/table/DataTable";
import { DataTableToolbar } from "../../components/table/DataTableToolbar";
import { SelectListMetaForm } from "../../components/select-lists/SelectListMetaForm";

type Props = {
  showInactive: boolean;
  selectListId?: string;
  onSelectList: (id?: string) => void;
};

type DraftMap = Record<string, Partial<SelectListItem>>;

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
  const newRowFirstInputRef = useRef<HTMLInputElement | null>(null);
  const newRowRef = useRef<HTMLTableRowElement | null>(null);
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

  const itemsQuery = useQuery({
    queryKey: ["select-list-items", currentListId, showInactive],
    queryFn: () => selectListItemsApi.list(currentListId, showInactive),
    enabled: Boolean(currentListId),
  });

  useEffect(() => {
    setCurrentListId(selectListId);
    setIsCreatingNew(false);
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
      toast.error(String(err));
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

  const listMetaDirty =
    (currentList?.name ?? "") !== listName ||
    (currentList?.description ?? "") !== listDescription;
  const hasUnsaved =
    Object.keys(drafts).length > 0 ||
    pendingDeletes.size > 0 ||
    Boolean(newRow.value?.trim() || newRow.displayValue?.trim()) ||
    listMetaDirty ||
    pendingAdds.length > 0;

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

  const visibleRows = useMemo(() => {
    return [...rows, ...pendingAdds];
  }, [rows, pendingAdds]);

  const getRowStatus = (row: SelectListItem): "new" | "edited" | undefined => {
    if (pendingAdds.some((pending) => pending.id === row.id)) return "new";
    if (drafts[row.id]) return "edited";
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
      // Refresh items so UI matches backend state
      const refreshed = await selectListItemsApi.list(listId, showInactive);
      setRows(refreshed);
      setNewRow(EMPTY_ITEM);
      toast.success("Changes saved");
    } catch (err) {
      toast.error(String(err));
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

            <DataTableToolbar
              selectedCount={selectedIds.size}
              canReset={Boolean(currentListId)}
              onImportClipboard={handleImportClipboard}
              onImportFile={handleImportFile}
              onClearSelection={handleClearSelection}
              onCopySelected={copySelectedRows}
              onDeleteSelected={handleDeleteSelected}
              onReset={handleResetItems}
            />

            <div className="table-pane">
              <DataGrid
                columns={columns}
                rows={visibleRows.filter((row) => !pendingDeletes.has(row.id))}
                getRowId={(row) => row.id}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={(ids) => setSelectedIds(new Set(ids))}
                onRowChange={handleRowChange}
                newRow={newRow}
                onNewRowChange={(key, value) =>
                  setNewRow((prev) => ({ ...prev, [key]: value }))
                }
                onFocusSelectAll={handleFocusSelectAll}
                newRowRef={newRowRef}
                newRowFirstInputRef={newRowFirstInputRef}
                onNewRowBlur={handleNewRowBlur}
                enableSelection
                enableFilters
                enableSorting
                getRowStatus={getRowStatus}
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
                  <div
                    className="pane-header-actions row"
                    style={{ marginTop: 8, gap: 8 }}
                  >
                    <button className="btn secondary small-btn" type="button">
                      Add
                    </button>
                    <input
                      className="table-input"
                      placeholder="New group set name"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="muted small" style={{ marginTop: 10 }}>
                    No group sets yet.
                  </div>
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
