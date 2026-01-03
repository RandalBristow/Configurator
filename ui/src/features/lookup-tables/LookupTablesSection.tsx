import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useResizableSidePanel } from "../../hooks/useResizableSidePanel";
import { lookupTablesApi } from "../../api/entities";
import type { LookupTable, LookupTableColumn } from "../../types/domain";
import { ConfirmDialog } from "../../components/dialogs/ConfirmDialog";
import { LookupTableObjectToolbar } from "../../components/lookup-tables/LookupTableObjectToolbar";
import { LookupTableRowsPane } from "../../components/lookup-tables/LookupTableRowsPane";
import { LookupTableColumnsPane } from "../../components/lookup-tables/LookupTableColumnsPane";
import { LookupTableDetailsPane } from "../../components/lookup-tables/LookupTableDetailsPane";
import { WorkspaceShell } from "../../components/workspace/WorkspaceShell";
import { WorkspaceTabs } from "../../components/workspace/WorkspaceTabs";
import { useTabToolbar } from "../../layout/TabToolbarContext";
import { useLookupTableColumnsManager } from "./hooks/useLookupTableColumnsManager";
import { useLookupTableRowsManager } from "./hooks/useLookupTableRowsManager";

type Props = {
  tableId?: string;
  onSelectTable: (id?: string) => void;
};

type LookupRowView = { id: string } & Record<string, any>;
type SidePaneTab = "details" | "columns";

export function LookupTablesSection({ tableId, onSelectTable }: Props) {
  const qc = useQueryClient();
  const { setLeftToolbar } = useTabToolbar();
  const [currentTableId, setCurrentTableId] = useState<string | undefined>(tableId);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [lastSelectedTableId, setLastSelectedTableId] = useState<string | undefined>();
  const [sidePaneTab, setSidePaneTab] = useState<SidePaneTab>("columns");

  const [tableName, setTableName] = useState("");
  const [tableDescription, setTableDescription] = useState("");

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
  });

  const rowsQuery = useQuery({
    queryKey: ["lookup-table-rows", currentTableId],
    queryFn: () => (currentTableId ? lookupTablesApi.listRows(currentTableId) : Promise.resolve([])),
    enabled: Boolean(currentTableId),
  });

  useEffect(() => {
    setCurrentTableId(tableId);
    if (tableId) setIsCreatingNew(false);
  }, [tableId]);

  // Auto-select first table when available
  useEffect(() => {
    if (!currentTableId && !isCreatingNew && (tablesQuery.data?.length ?? 0) > 0) {
      const first = tablesQuery.data![0].id;
      setCurrentTableId(first);
      onSelectTable(first);
    }
  }, [tablesQuery.data, currentTableId, isCreatingNew, onSelectTable]);

  const currentTable: LookupTable | undefined = useMemo(
    () => (tablesQuery.data ?? []).find((t) => t.id === currentTableId),
    [tablesQuery.data, currentTableId],
  );

  useEffect(() => {
    setTableName(currentTable?.name ?? "");
    setTableDescription(currentTable?.description ?? "");
  }, [currentTable]);

  useEffect(() => {
    setSidePaneTab("columns");
  }, [currentTableId]);

  useEffect(() => {
    if (isCreatingNew) setSidePaneTab("details");
  }, [isCreatingNew]);

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
    (currentTable?.name ?? "") !== tableName || (currentTable?.description ?? "") !== tableDescription;

  const hasUnsaved = metaDirty || columnsManager.hasChanges || rowsManager.hasChanges;

  const resetToNewTable = () => {
    setIsCreatingNew(true);
    setLastSelectedTableId(currentTableId);
    setCurrentTableId(undefined);
    onSelectTable(undefined);
    setTableName("");
    setTableDescription("");
  };

  const handleStartNew = () => {
    if (hasUnsaved) {
      confirm({
        title: "Start a new lookup table?",
        description: "Unsaved changes will be lost.",
        onConfirm: resetToNewTable,
      });
      return;
    }
    resetToNewTable();
  };

  const handleCancelNew = () => {
    const performCancel = () => {
      setIsCreatingNew(false);
      const fallbackId = lastSelectedTableId ?? (tablesQuery.data?.[0]?.id ?? undefined);
      if (fallbackId) {
        setCurrentTableId(fallbackId);
        onSelectTable(fallbackId);
      }
    };

    if (hasUnsaved) {
      confirm({
        title: "Discard new lookup table?",
        description: "Unsaved changes will be lost.",
        onConfirm: performCancel,
      });
      return;
    }
    performCancel();
  };

  const handleFocusSelectAll = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  const columnsDisabled = isCreatingNew || !currentTableId;

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
            setIsCreatingNew(false);
          } else {
            resetToNewTable();
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
      setIsCreatingNew(false);

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

  useEffect(() => {
    setLeftToolbar(
      <LookupTableObjectToolbar
        isCreatingNew={isCreatingNew}
        controlsDisabled={isCreatingNew}
        saveDisabled={!tableName.trim()}
        deleteDisabled={!currentTableId}
        onNew={handleStartNew}
        onCancel={handleCancelNew}
        onSave={handleSaveAll}
        onDelete={handleDeleteTable}
      />
    );

    return () => setLeftToolbar(null);
  }, [
    setLeftToolbar,
    isCreatingNew,
    tableName,
    currentTableId,
    handleStartNew,
    handleCancelNew,
    handleSaveAll,
    handleDeleteTable,
  ]);

  return (
    <WorkspaceShell
      panelSize={panelSize}
      splitterSize={splitterSize}
      onSplitterMouseDown={onSplitterMouseDown}
      main={
        <>
          <div className="center-pane">
            <LookupTableRowsPane<LookupRowView>
              toolbar={{
                selectedCount: rowsManager.selectedIds.size,
                canReset: Boolean(currentTableId),
                disabled: isCreatingNew || !currentTableId,
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
                onToggleSelect: rowsManager.toggleSelect,
                onToggleSelectAll: rowsManager.toggleSelectAll,
                onRowChange: rowsManager.handleRowChange,
                newRow: rowsManager.newRow,
                onNewRowChange: rowsManager.handleNewRowChange,
                newRowRef: rowsManager.newRowRef,
                newRowFirstInputRef: rowsManager.newRowFirstInputRef,
                onNewRowBlur: rowsManager.handleNewRowBlur,
                disabled: isCreatingNew || !currentTableId,
                getRowStatus: rowsManager.getRowStatus,
              }}
            />
          </div>
        </>
      }
      inspector={
        <>
          <WorkspaceTabs
            items={[
              { id: "details", label: "Details" },
              { id: "columns", label: "Columns", disabled: columnsDisabled },
            ]}
            variant="menubar"
            activeId={sidePaneTab}
            onChange={(id) => setSidePaneTab(id as SidePaneTab)}
          />

          <div className="side-pane-inner">
            {sidePaneTab === "details" ? (
              <LookupTableDetailsPane
                tableName={tableName}
                tableDescription={tableDescription}
                onChangeName={setTableName}
                onChangeDescription={setTableDescription}
                onFocusSelectAll={handleFocusSelectAll}
              />
            ) : (
              <LookupTableColumnsPane
                disabled={columnsDisabled}
                isLoading={columnsQuery.isLoading}
                columns={columnsManager.gridColumns}
                rows={columnsManager.tableRows}
                selectedIds={columnsManager.selectedIds}
                onToggleSelect={columnsManager.toggleSelect}
                onToggleSelectAll={columnsManager.toggleSelectAll}
                onRowChange={columnsManager.handleRowChange}
                newRow={columnsManager.newRow}
                onNewRowChange={(key, value) =>
                  columnsManager.setNewRow((prev) => ({ ...prev, [key]: value }))
                }
                newRowRef={columnsManager.newRowRef}
                newRowFirstInputRef={columnsManager.newRowFirstInputRef}
                onNewRowBlur={columnsManager.handleNewRowBlur}
                onClearSelection={columnsManager.clearSelection}
                onCopySelected={columnsManager.copySelected}
                onDeleteSelected={columnsManager.deleteSelected}
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
