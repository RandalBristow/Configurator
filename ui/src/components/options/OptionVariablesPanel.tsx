import { useState, type ReactNode } from "react";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { VariablesGridPane } from "../variables/VariablesGridPane";
import type { VariablesManager } from "../../features/variables/hooks/useVariablesManager";

type Props = {
  manager: VariablesManager;
  disabled?: boolean;
  headerActions?: ReactNode;
  showToolbar?: boolean;
};

export function OptionVariablesPanel({
  manager,
  disabled = false,
  headerActions,
  showToolbar = true,
}: Props) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

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

  return (
    <div className="option-variables">
      <div className="option-variables__header">
        <div className="option-variables__header-text">
          <div className="option-variables__title">Option Variables</div>
          <div className="option-variables__subtitle">Scoped to this option</div>
        </div>
        {headerActions ? (
          <div className="option-variables__actions">{headerActions}</div>
        ) : null}
      </div>

      {disabled ? (
        <div className="option-variables__empty muted small">
          Select an option to manage its variables.
        </div>
      ) : (
        <div className="option-variables__grid">
          <VariablesGridPane
            toolbarPlacement="inline"
            showToolbar={showToolbar}
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
      )}

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
    </div>
  );
}
