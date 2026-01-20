import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTabToolbar } from "../../layout/TabToolbarContext";
import { useResizableSidePanel } from "../../hooks/useResizableSidePanel";
import { WorkspaceShell } from "../../components/workspace/WorkspaceShell";
import { VariablesGridPane } from "../../components/variables/VariablesGridPane";
import { VariablesObjectToolbar } from "../../components/variables/VariablesObjectToolbar";
import { ConfirmDialog } from "../../components/dialogs/ConfirmDialog";
import { useVariablesManager } from "./hooks/useVariablesManager";

type Props = {
  onDirtyChange?: (dirty: boolean) => void;
};

export function VariablesSection({ onDirtyChange }: Props) {
  const { setLeftToolbar } = useTabToolbar();
  const {
    panelSize,
    splitterSize,
    onSplitterMouseDown,
  } = useResizableSidePanel({ storageKeyBase: "variables", enableCollapse: false });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

  const manager = useVariablesManager({
    onScopeChangedKey: "global",
    enabled: true,
  });

  useEffect(() => {
    onDirtyChange?.(manager.hasChanges);
    return () => onDirtyChange?.(false);
  }, [manager.hasChanges, onDirtyChange]);

  const handleSave = async () => {
    if (!manager.hasChanges) return;
    try {
      await manager.persist();
    } catch {
      // Errors are surfaced by the manager toast; avoid unhandled rejections.
    }
  };

  const handleDeactivateSelected = () => {
    const selectedCount = manager.selectedIds.size;
    if (!selectedCount) return;
    setConfirmDialog({
      open: true,
      title: `Deactivate ${selectedCount} variable${selectedCount === 1 ? "" : "s"}?`,
      description: "You can reactivate variables later by toggling Active.",
      onConfirm: () => manager.deactivateSelected(),
    });
  };

  const leftActionsRef = useRef({
    onSave: handleSave,
  });

  useEffect(() => {
    leftActionsRef.current = { onSave: handleSave };
  }, [handleSave]);

  const onSave = useCallback(() => leftActionsRef.current.onSave(), []);

  const leftToolbarNode = useMemo(
    () => <VariablesObjectToolbar saveDisabled={!manager.hasChanges || manager.isSaving} onSave={onSave} />,
    [manager.hasChanges, manager.isSaving, onSave],
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
        <div className="center-pane center-pane--flush">
          <VariablesGridPane
            toolbarPlacement="menubar"
            toolbar={{
              selectedCount: manager.selectedIds.size,
              rowCount: manager.tableRows.length,
              disabled: manager.isSaving,
              onReset: manager.refresh,
              onClearSelection: manager.clearSelection,
              onCopySelected: manager.copySelected,
              onDeactivateSelected: handleDeactivateSelected,
            }}
            grid={{
              columns: manager.columns,
              rows: manager.tableRows,
              selectedIds: manager.selectedIds,
              onToggleSelectAll: manager.toggleSelectAll,
              onRowChange: manager.handleRowChange,
              newRow: manager.newRow,
              onNewRowChange: (key, value) =>
                manager.setNewRow((prev) => ({ ...prev, [key]: value })),
              onCommitNewRow: manager.commitNewRow,
              disabled: manager.isSaving,
              getRowStatus: manager.getRowStatus,
            }}
            isLoading={manager.isFetching}
          />
        </div>
      }
    >
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Deactivate"
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
