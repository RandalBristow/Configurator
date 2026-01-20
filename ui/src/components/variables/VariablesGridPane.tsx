import { useCallback, useEffect, useMemo, useRef } from "react";
import type { DataGridColumn } from "../table/DataTable";
import { RdgGrid } from "../table/RdgGrid";
import { useTabToolbar } from "../../layout/TabToolbarContext";
import { VariablesTableToolbar } from "./VariablesTableToolbar";

type ToolbarProps = {
  selectedCount: number;
  rowCount: number;
  disabled?: boolean;
  onReset: () => void;
  onClearSelection: () => void;
  onCopySelected: () => void;
  onDeactivateSelected: () => void;
};

type GridProps<T> = {
  columns: DataGridColumn<T>[];
  rows: T[];
  selectedIds: Set<string>;
  onToggleSelectAll: (ids: string[]) => void;
  onRowChange: (id: string, key: keyof T, value: any) => void;
  newRow: Partial<T>;
  onNewRowChange: (key: keyof T, value: any) => void;
  onCommitNewRow?: (draft?: T) => void;
  disabled?: boolean;
  getRowStatus?: (row: T) => "new" | "edited" | undefined;
};

type Props<T> = {
  toolbar: ToolbarProps;
  grid: GridProps<T>;
  isLoading?: boolean;
  toolbarPlacement?: "menubar" | "inline";
  showToolbar?: boolean;
};

export function VariablesGridPane<T extends { id: string }>({
  toolbar,
  grid,
  isLoading = false,
  toolbarPlacement = "inline",
  showToolbar = true,
}: Props<T>) {
  const { setRightToolbar } = useTabToolbar();

  const toolbarRef = useRef(toolbar);
  toolbarRef.current = toolbar;

  const onReset = useCallback(() => toolbarRef.current.onReset(), []);
  const onClearSelection = useCallback(() => toolbarRef.current.onClearSelection(), []);
  const onCopySelected = useCallback(() => toolbarRef.current.onCopySelected(), []);
  const onDeactivateSelected = useCallback(() => toolbarRef.current.onDeactivateSelected(), []);

  const toolbarNode = useMemo(
    () =>
      showToolbar ? (
        <VariablesTableToolbar
          selectedCount={toolbar.selectedCount}
          rowCount={toolbar.rowCount}
          disabled={toolbar.disabled}
          variant={toolbarPlacement === "menubar" ? "default" : "compact"}
          onReset={onReset}
          onClearSelection={onClearSelection}
          onCopySelected={onCopySelected}
          onDeactivateSelected={onDeactivateSelected}
        />
      ) : null,
    [
      showToolbar,
      toolbar.selectedCount,
      toolbar.rowCount,
      toolbar.disabled,
      toolbarPlacement,
      onReset,
      onClearSelection,
      onCopySelected,
      onDeactivateSelected,
    ],
  );

  useEffect(() => {
    if (!showToolbar || toolbarPlacement !== "menubar") return;
    setRightToolbar(toolbarNode);
  }, [setRightToolbar, toolbarNode, toolbarPlacement, showToolbar]);

  useEffect(() => {
    if (!showToolbar || toolbarPlacement !== "menubar") return;
    return () => setRightToolbar(null);
  }, [setRightToolbar, toolbarPlacement, showToolbar]);

  return (
    <div className="lookup-grid-wrapper">
      {showToolbar && toolbarPlacement === "inline" && toolbarNode}

      {grid.columns.length === 0 ? (
        <div className="grid-loading-placeholder" aria-live="polite">
          <div className="grid-loading-spinner" />
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="grid-loading-overlay" aria-live="polite">
              <div className="grid-loading-spinner" />
            </div>
          )}
          <RdgGrid<T>
            columns={grid.columns}
            rows={grid.rows}
            selectedIds={grid.selectedIds}
            onToggleSelectAll={grid.onToggleSelectAll}
            onRowChange={grid.onRowChange}
            newRow={grid.newRow}
            onNewRowChange={grid.onNewRowChange}
            onCommitNewRow={grid.onCommitNewRow}
            showNewRow={!Boolean(grid.disabled ?? toolbar.disabled)}
            newRowIdPrefix="local-var-"
            disabled={grid.disabled ?? toolbar.disabled}
            getRowStatus={grid.getRowStatus}
          />
        </>
      )}
    </div>
  );
}
