import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clipboard, Copy, Eraser, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { selectListItemsApi, selectListsApi } from "../../api/entities";
import type { SelectList, SelectListItem } from "../../types/domain";
import { InlineDataGrid, type InlineDataGridColumn } from "../../components/table/InlineDataGrid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

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

const PANEL_WIDTH_KEY = "selectListItems.panelWidth";
const PANEL_COLLAPSED_KEY = "selectListItems.panelCollapsed";
const DEFAULT_PANEL_WIDTH = 320;
const MIN_PANEL_WIDTH = 260;
const MAX_PANEL_WIDTH = 520;
const COLLAPSED_PANEL_WIDTH = 48;

export function SelectListItemsSection({ showInactive, selectListId, onSelectList }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [currentListId, setCurrentListId] = useState<string | undefined>(selectListId);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");

  const [rows, setRows] = useState<SelectListItem[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [newRow, setNewRow] = useState<Partial<SelectListItem>>(EMPTY_ITEM);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const newRowFirstInputRef = useRef<HTMLInputElement | null>(null);
  const newRowRef = useRef<HTMLTableRowElement | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_PANEL_WIDTH;
    const stored = window.localStorage.getItem(PANEL_WIDTH_KEY);
    const parsed = stored ? Number(stored) : DEFAULT_PANEL_WIDTH;
    if (!Number.isFinite(parsed)) return DEFAULT_PANEL_WIDTH;
    return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, parsed));
  });
  const [panelCollapsed, setPanelCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PANEL_COLLAPSED_KEY) === "true";
  });
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

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
  }, [selectListId]);

  // Auto-select first list when available
  useEffect(() => {
    if (!currentListId && (listsQuery.data?.length ?? 0) > 0) {
      setCurrentListId(listsQuery.data![0].id);
      onSelectList(listsQuery.data![0].id);
    }
  }, [listsQuery.data, currentListId, onSelectList]);

  const filteredLists = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return listsQuery.data ?? [];
    return (listsQuery.data ?? []).filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.description ?? "").toLowerCase().includes(term),
    );
  }, [listsQuery.data, search]);

  const currentList: SelectList | undefined = useMemo(
    () => (listsQuery.data ?? []).find((l) => l.id === currentListId),
    [listsQuery.data, currentListId],
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
  }, [itemsQuery.data, currentListId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PANEL_COLLAPSED_KEY, String(panelCollapsed));
  }, [panelCollapsed]);

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

  const handleRowChange = (id: string, key: keyof SelectListItem, value: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [key]: value } }));
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
    const headers = ["Value", "Display Value", "Order", "Active", "Tooltip", "Comments"];
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
        ].join("\t"),
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
    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
    const expected = ["value", "display value", "displayvalue", "order", "active", "tooltip", "comments"];
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
        value: (rec["value"] ?? rec["Value"] ?? rec[""] ?? "").toString().trim(),
        displayValue: (rec["display value"] ?? rec["Display Value"] ?? "").toString().trim(),
        order: Number(rec["order"] ?? rec["Order"] ?? 0) || 0,
        isActive: String(rec["active"] ?? rec["Active"] ?? "true").toLowerCase() !== "false",
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

  const listCount = listsQuery.data?.length ?? 0;
  const selectionLabel = selectedIds.size ? `${selectedIds.size} selected` : "No selection";

  const columns = useMemo<InlineDataGridColumn<SelectListItem>[]>(
    () => [
      { key: "value", header: "*Value", type: "string" },
      { key: "displayValue", header: "*Display Value", type: "string" },
      { key: "order", header: "*Order", type: "number", width: 70, align: "center" },
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
    [],
  );

  const handleNewRowBlur = (e: React.FocusEvent<HTMLTableRowElement>) => {
    const next = e.relatedTarget as HTMLElement | null;
    if (newRowRef.current && next && newRowRef.current.contains(next)) return;
    // no-op for now; save handled by explicit Save action
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
        await updateList.mutateAsync({ id: currentList.id, payload: { name: listName, description: listDescription } });
      } else {
        const created = await createList.mutateAsync({ name: listName, description: listDescription });
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

      // Save new row if filled
      if (newRow.value?.trim() && newRow.displayValue?.trim()) {
        await selectListItemsApi.create({
          ...newRow,
          selectListId: listId,
          order: Number(newRow.order) || 0,
        });
        setNewRow(EMPTY_ITEM);
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

  const handleSplitterMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelCollapsed) return;
    e.preventDefault();
    dragStateRef.current = { startX: e.clientX, startWidth: panelWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStateRef.current) return;
      const delta = event.clientX - dragStateRef.current.startX;
      const next = dragStateRef.current.startWidth - delta;
      const clamped = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, next));
      setPanelWidth(clamped);
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const panelSize = panelCollapsed ? COLLAPSED_PANEL_WIDTH : panelWidth;
  const splitterSize = panelCollapsed ? 0 : 6;

  return (
    <div
      className="inspector-shell"
      style={{
        gridTemplateColumns: `minmax(0, 1fr) ${splitterSize}px ${panelSize}px`,
        columnGap: 0,
      }}
    >
      <div className="card full-width">
        <div className="card-head spaced">
          <div className="table-title">
            <span className="table-badge">{listCount}</span>
            <h2>Select List Items</h2>
          </div>
          <div className="table-actions">
            <button className="btn secondary" type="button" onClick={() => qc.invalidateQueries()}>
              Reset
            </button>
            <button className="btn primary" type="button" onClick={handleSaveAll} disabled={!listName.trim()}>
              Save
            </button>
          </div>
        </div>

        <div className="select-list-toolbar">
          <div className="select-list-picker">
            <label className="muted small">Select List</label>
            <div
              className="picker-row"
              style={{ width: "520px", maxWidth: "100%", display: "flex", gap: 8, marginBottom: 8 }}
            >
              <select
                className="table-input"
                style={{ width: 250 }}
                value={currentListId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || undefined;
                  setCurrentListId(id);
                  onSelectList(id);
                }}
              >
                {filteredLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <input
                className="table-input"
                placeholder="Filter lists"
                style={{ width: 250 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="picker-row" style={{ gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <label className="muted small">Select List Name</label>
                <input
                  className="table-input"
                  placeholder="Name"
                  style={{ marginBottom: 6 }}
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  onFocus={handleFocusSelectAll}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <label className="muted small">Description</label>
                <textarea
                  className="table-input"
                  placeholder="Description"
                  rows={2}
                  style={{ resize: "vertical" }}
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="selection-bar">
          <div className="selection-bar__actions">
            <button className="icon-btn" type="button" title="Import from clipboard" onClick={handleImportClipboard}>
              <Clipboard size={16} />
            </button>
            <label className="icon-btn" title="Import from file">
              <Upload size={16} />
              <input type="file" accept=".csv,text/plain" onChange={handleImportFile} style={{ display: "none" }} />
            </label>
            <div className="selection-bar__divider" />
            <button
              className="icon-btn"
              type="button"
              title="Clear selection"
              onClick={handleClearSelection}
              disabled={!selectedIds.size}
            >
              <Eraser size={16} />
            </button>
            <button
              className="icon-btn"
              type="button"
              title="Copy selected rows"
              onClick={copySelectedRows}
              disabled={!selectedIds.size}
            >
              <Copy size={16} />
            </button>
            <button
              className="icon-btn"
              type="button"
              title="Delete selected rows"
              onClick={handleDeleteSelected}
              disabled={!selectedIds.size}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="selection-bar__spacer" />
        <div className="selection-bar__label">{selectionLabel}</div>
        </div>

        <div className="table-pane">
          <InlineDataGrid
            columns={columns}
            rows={rows.filter((row) => !pendingDeletes.has(row.id))}
            getRowId={(row) => row.id}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={(ids) => setSelectedIds(new Set(ids))}
            onRowChange={handleRowChange}
            newRow={newRow}
            onNewRowChange={(key, value) => setNewRow((prev) => ({ ...prev, [key]: value }))}
            onFocusSelectAll={handleFocusSelectAll}
            newRowRef={newRowRef}
            newRowFirstInputRef={newRowFirstInputRef}
            onNewRowBlur={handleNewRowBlur}
            enableSelection
            enableFilters
            enableSorting
          />
        </div>
      </div>

      <div
        className={`side-splitter ${panelCollapsed ? "collapsed" : ""}`}
        onMouseDown={handleSplitterMouseDown}
        style={{ width: splitterSize, pointerEvents: panelCollapsed ? "none" : "auto" }}
        aria-hidden
      />

      <div className={`side-pane ${panelCollapsed ? "collapsed" : ""}`}>
        <button
          className="side-pane-toggle"
          type="button"
          onClick={() => setPanelCollapsed((prev) => !prev)}
          title={panelCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {panelCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
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
              <div className="muted small">Manage group sets and groups for this list.</div>
              <div className="pane-header-actions row" style={{ marginTop: 8, gap: 8 }}>
                <button className="btn secondary small-btn" type="button">
                  Add
                </button>
                <input className="table-input" placeholder="New group set name" style={{ flex: 1 }} />
              </div>
              <div className="muted small" style={{ marginTop: 10 }}>
                No group sets yet.
              </div>
            </div>
          </>
        )}
      </div>

      {confirmDialog && (
        <AlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              {confirmDialog.description && (
                <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDialog(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  action();
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

