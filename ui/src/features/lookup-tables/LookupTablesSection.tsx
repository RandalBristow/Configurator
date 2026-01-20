import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useResizableSidePanel } from "../../hooks/useResizableSidePanel";
import { lookupTablesApi } from "../../api/entities";
import type { LookupTable, LookupTableColumn } from "../../types/domain";
import { ConfirmDialog } from "../../components/dialogs/ConfirmDialog";
import { LookupTableObjectToolbar } from "../../components/lookup-tables/LookupTableObjectToolbar";
import { LookupTableRowsRdgPane } from "../../components/lookup-tables/LookupTableRowsRdgPane";
import { LookupTableColumnsPane } from "../../components/lookup-tables/LookupTableColumnsPane";
import { LookupTableDetailsPane } from "../../components/lookup-tables/LookupTableDetailsPane";
import { WorkspaceShell } from "../../components/workspace/WorkspaceShell";
import { WorkspaceSideMenubar } from "../../components/workspace/WorkspaceSideMenubar";
import { useTabToolbar } from "../../layout/TabToolbarContext";
import { useLookupTableColumnsManager } from "./hooks/useLookupTableColumnsManager";
import { useLookupTableRowsManager } from "./hooks/useLookupTableRowsManager";
import { ToolbarButton, ToolbarDivider } from "../../components/ui/ToolbarButton";
import { Copy, Eraser, Trash2 } from "lucide-react";

type Props = {
  tableId?: string;
  onSelectTable: (id?: string) => void;
  metaDraft?: { name: string; description: string };
  onMetaDraftChange?: (draft: { name: string; description: string }) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

type LookupRowView = { id: string } & Record<string, any>;
type SidePaneTab = "details" | "columns";

export function LookupTablesSection({
  tableId,
  onSelectTable,
  metaDraft,
  onMetaDraftChange,
  onDirtyChange,
}: Props) {
  const qc = useQueryClient();
  const { setLeftToolbar } = useTabToolbar();
  const [currentTableId, setCurrentTableId] = useState<string | undefined>(tableId);
  const [sidePaneTab, setSidePaneTab] = useState<SidePaneTab>("columns");

  const [internalTableName, setInternalTableName] = useState("");
  const [internalTableDescription, setInternalTableDescription] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

  const confirm = (options: { title: string; description?: string; onConfirm: () => void }) =>
    setConfirmDialog({ open: true, ...options });

  const {
    panelSize,
    splitterSize,
    onSplitterMouseDown,
  } = useResizableSidePanel({ storageKeyBase: "lookupTables", enableCollapse: false });

  const tablesQuery = useQuery({
    queryKey: ["lookup-tables"],
    queryFn: () => lookupTablesApi.list(),
  });

  const columnsQuery = useQuery({
    queryKey: ["lookup-table-columns", currentTableId],
    queryFn: () => (currentTableId ? lookupTablesApi.listColumns(currentTableId) : Promise.resolve([])),
    enabled: Boolean(currentTableId),
    placeholderData: keepPreviousData,
  });

  const rowsQuery = useQuery({
    queryKey: ["lookup-table-rows", currentTableId],
    queryFn: () => (currentTableId ? lookupTablesApi.listRows(currentTableId) : Promise.resolve([])),
    enabled: Boolean(currentTableId),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setCurrentTableId(tableId);
  }, [tableId]);

  // Auto-select first table when available
  useEffect(() => {
    if (!currentTableId && (tablesQuery.data?.length ?? 0) > 0) {
      const first = tablesQuery.data![0].id;
      setCurrentTableId(first);
      onSelectTable(first);
    }
  }, [tablesQuery.data, currentTableId, onSelectTable]);

  const currentTable: LookupTable | undefined = useMemo(
    () => (tablesQuery.data ?? []).find((t) => t.id === currentTableId),
    [tablesQuery.data, currentTableId],
  );

  useEffect(() => {
    if (!currentTable || !onMetaDraftChange || metaDraft) return;
    onMetaDraftChange({
      name: currentTable.name ?? "",
      description: currentTable.description ?? "",
    });
  }, [currentTable, metaDraft, onMetaDraftChange]);

  useEffect(() => {
    if (metaDraft && onMetaDraftChange) return;
    setInternalTableName(currentTable?.name ?? "");
    setInternalTableDescription(currentTable?.description ?? "");
  }, [currentTable, metaDraft, onMetaDraftChange]);

  const tableName = metaDraft?.name ?? internalTableName;
  const tableDescription = metaDraft?.description ?? internalTableDescription;

  const handleTableNameChange = (value: string) => {
    if (onMetaDraftChange) {
      onMetaDraftChange({ name: value, description: tableDescription });
      return;
    }
    setInternalTableName(value);
  };

  const handleTableDescriptionChange = (value: string) => {
    if (onMetaDraftChange) {
      onMetaDraftChange({ name: tableName, description: value });
      return;
    }
    setInternalTableDescription(value);
  };

  useEffect(() => {
    setSidePaneTab("columns");
  }, [currentTableId]);

  const columnsManager = useLookupTableColumnsManager({
    currentTableId,
    confirm,
    onTableChangedKey: currentTableId ?? "none",
  });

  const rowsManager = useLookupTableRowsManager({
    currentTableId,
    columns: (columnsQuery.data ?? []) as LookupTableColumn[],
    confirm,
    onTableChangedKey: currentTableId ?? "none",
  });

  useEffect(() => {
    columnsManager.applyLoaded(columnsQuery.data);
  }, [columnsQuery.data, currentTableId]);

  useEffect(() => {
    rowsManager.applyLoaded(rowsQuery.data);
  }, [rowsQuery.data, currentTableId]);

  const metaDirty =
    (currentTable?.name ?? "") !== tableName ||
    (currentTable?.description ?? "") !== tableDescription;
  const hasUnsaved = metaDirty || columnsManager.hasChanges || rowsManager.hasChanges;

  useEffect(() => {
    onDirtyChange?.(hasUnsaved);
    return () => onDirtyChange?.(false);
  }, [hasUnsaved, onDirtyChange]);

  const handleFocusSelectAll = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  const columnsDisabled = !currentTableId;

  const handleDeleteTable = () => {
    if (!currentTableId) return;
    const name = tableName.trim() || currentTable?.name || "this table";
    confirm({
      title: `Delete \"${name}\" ?`,
      description: "This will remove the lookup table and all rows/columns.",
      onConfirm: async () => {
        try {
          await lookupTablesApi.remove(currentTableId);
          const result = await tablesQuery.refetch();
          const nextId = result.data?.[0]?.id;
          if (nextId) {
            setCurrentTableId(nextId);
            onSelectTable(nextId);
          } else {
            setCurrentTableId(undefined);
            onSelectTable(undefined);
            setInternalTableName("");
            setInternalTableDescription("");
          }
          toast.success("Lookup table deleted");
        } catch (err) {
          toast.error(`Delete failed: ${String(err)}`);
        }
      },
    });
  };

  const handleSaveAll = async () => {
    if (!tableName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      let id = currentTableId;
      if (currentTable) {
        await lookupTablesApi.update(currentTable.id, { name: tableName, description: tableDescription });
      } else {
        const created = await lookupTablesApi.create({ name: tableName, description: tableDescription });
        id = created.id;
        setCurrentTableId(created.id);
        onSelectTable(created.id);
      }

      if (!id) throw new Error("Lookup table id not available");

      if (columnsManager.hasChanges) {
        const refreshed = await columnsManager.persist(id);
        qc.setQueryData(["lookup-table-columns", id], refreshed);
        await rowsQuery.refetch();
      }

      if (rowsManager.hasChanges) {
        const refreshed = await rowsManager.persist(id);
        qc.setQueryData(["lookup-table-rows", id], refreshed);
      }

      await qc.invalidateQueries({ queryKey: ["lookup-tables"] });
      toast.success("Changes saved");
    } catch (err) {
      console.error("Save failed", err);
      toast.error(`Save failed: ${err instanceof Error ? err.message : String(err)}`, { duration: 8000 });
    }
  };

  const handleImportClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        toast.error("Clipboard API not available in this browser/context.");
        return;
      }
      const text = await navigator.clipboard.readText();
      await rowsManager.importDelimitedText(text);
    } catch (err) {
      console.error("Import from clipboard failed", err);
      toast.error(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await rowsManager.importDelimitedText(text);
    } catch (err) {
      toast.error(`Import failed: ${String(err)}`);
    } finally {
      e.target.value = "";
    }
  };

  const leftActionsRef = useRef({
    onSave: handleSaveAll,
    onDelete: handleDeleteTable,
  });

  useEffect(() => {
    leftActionsRef.current = {
      onSave: handleSaveAll,
      onDelete: handleDeleteTable,
    };
  }, [handleSaveAll, handleDeleteTable]);

  const onSave = useCallback(() => leftActionsRef.current.onSave(), []);
  const onDelete = useCallback(() => leftActionsRef.current.onDelete(), []);

  const leftToolbarNode = useMemo(
    () => (
      <LookupTableObjectToolbar
        controlsDisabled={false}
        saveDisabled={!tableName.trim()}
        deleteDisabled={!currentTableId}
        onSave={onSave}
        onDelete={onDelete}
      />
    ),
    [tableName, currentTableId, onSave, onDelete],
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
            <LookupTableRowsRdgPane<LookupRowView>
              toolbar={{
                selectedCount: rowsManager.selectedIds.size,
                canReset: Boolean(currentTableId),
                disabled: !currentTableId,
                onImportClipboard: handleImportClipboard,
                onImportFile: handleImportFile,
                onClearSelection: rowsManager.clearSelection,
                onCopySelected: rowsManager.copySelected,
                onDeleteSelected: rowsManager.deleteSelected,
                onReset: () => void rowsQuery.refetch(),
              }}
              grid={{
                columns: rowsManager.rowColumns,
                rows: rowsManager.rowViews,
                selectedIds: rowsManager.selectedIds,
                onToggleSelectAll: rowsManager.toggleSelectAll,
                onRowChange: rowsManager.handleRowChange,
                newRow: rowsManager.newRow,
                onNewRowChange: rowsManager.handleNewRowChange,
                onCommitNewRow: (draft) => void rowsManager.commitNewRow(undefined, draft),
                disabled: !currentTableId,
                getRowStatus: rowsManager.getRowStatus,
              }}
              isLoading={rowsQuery.isFetching || columnsQuery.isFetching}
            />
          </div>
        </>
      }
      inspector={
        <>
          <WorkspaceSideMenubar
            tabs={[
              { id: "details", label: "Details" },
              { id: "columns", label: "Columns", disabled: columnsDisabled },
            ]}
            activeTab={sidePaneTab}
            onChangeTab={(id) => setSidePaneTab(id as SidePaneTab)}
            toolbar={
              sidePaneTab === "columns" ? (
                <div className="selection-bar selection-bar--compact">
                  <div className="selection-bar__actions">
                    <ToolbarButton
                      title="Clear selection"
                      onClick={columnsManager.clearSelection}
                      disabled={columnsDisabled || columnsManager.selectedIds.size === 0}
                      icon={<Eraser size={14} />}
                      label="Clear"
                    />
                    <ToolbarButton
                      title="Copy selected rows"
                      onClick={columnsManager.copySelected}
                      disabled={columnsDisabled || columnsManager.selectedIds.size === 0}
                      icon={<Copy size={14} />}
                      label="Copy"
                    />
                    <ToolbarDivider />
                    <ToolbarButton
                      title="Delete selected rows"
                      onClick={columnsManager.deleteSelected}
                      disabled={columnsDisabled || columnsManager.selectedIds.size === 0}
                      icon={<Trash2 size={14} />}
                      label="Delete"
                    />
                  </div>
                </div>
              ) : null
            }
          />

          <div className={`side-pane-inner ${sidePaneTab === "columns" ? "side-pane-inner--flush" : ""}`}>
            {sidePaneTab === "details" ? (
              <LookupTableDetailsPane
                tableName={tableName}
                tableDescription={tableDescription}
                onChangeName={handleTableNameChange}
                onChangeDescription={handleTableDescriptionChange}
                onFocusSelectAll={handleFocusSelectAll}
              />
            ) : (
              <LookupTableColumnsPane
                disabled={columnsDisabled}
                isLoading={columnsQuery.isLoading}
                columns={columnsManager.gridColumns}
                rows={columnsManager.tableRows}
                selectedIds={columnsManager.selectedIds}
                onToggleSelectAll={columnsManager.toggleSelectAll}
                onRowChange={columnsManager.handleRowChange}
                newRow={columnsManager.newRow}
                onNewRowChange={(key, value) =>
                  columnsManager.setNewRow((prev) => ({ ...prev, [key]: value }))
                }
                onCommitNewRow={(draft) => void columnsManager.commitNewRow(draft)}
                getRowStatus={columnsManager.getRowStatus}
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
