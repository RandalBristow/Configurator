import { useCallback, useEffect, useMemo, useRef } from "react";
import type { DataGridColumn } from "../table/DataTable";
import { DataTableToolbar } from "../table/DataTableToolbar";
import { RdgGrid } from "../table/RdgGrid";
import { useTabToolbar } from "../../layout/TabToolbarContext";

type ToolbarProps = {
  selectedCount: number;
  canReset: boolean;
  disabled?: boolean;

  onImportClipboard: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onClearSelection: () => void;
  onCopySelected: () => void;
  onDeleteSelected: () => void;

  onReset: () => void;
};

type GridProps<T> = {
  columns: DataGridColumn<T>[];
  rows: T[];
  selectedIds: Set<string>;
  onToggleSelectAll: (ids: string[]) => void;
  onRowChange: (id: string, key: keyof T, value: any) => void;

  newRow: Partial<T>;
  onNewRowChange: (key: keyof T, value: any) => void;
  onCommitNewRow?: () => void;

  disabled?: boolean;
  getRowStatus?: (row: T) => "new" | "edited" | undefined;
};

type Props<T> = {
  toolbar: ToolbarProps;
  grid: GridProps<T>;
  isLoading?: boolean;
};

export function LookupTableRowsRdgPane<T extends { id: string }>({
  toolbar,
  grid,
  isLoading = false,
}: Props<T>) {
  const { setRightToolbar } = useTabToolbar();

  const toolbarRef = useRef(toolbar);
  toolbarRef.current = toolbar;

  const onReset = useCallback(() => toolbarRef.current.onReset(), []);
  const onImportClipboard = useCallback(() => toolbarRef.current.onImportClipboard(), []);
  const onImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => toolbarRef.current.onImportFile(e), []);
  const onClearSelection = useCallback(() => toolbarRef.current.onClearSelection(), []);
  const onCopySelected = useCallback(() => toolbarRef.current.onCopySelected(), []);
  const onDeleteSelected = useCallback(() => toolbarRef.current.onDeleteSelected(), []);

  const toolbarNode = useMemo(
    () => (
      <DataTableToolbar
        selectedCount={toolbar.selectedCount}
        rowCount={grid.rows.length}
        canReset={toolbar.canReset}
        disabled={toolbar.disabled}
        onImportClipboard={onImportClipboard}
        onImportFile={onImportFile}
        onClearSelection={onClearSelection}
        onCopySelected={onCopySelected}
        onDeleteSelected={onDeleteSelected}
        onReset={onReset}
      />
    ),
    [
      toolbar.selectedCount,
      toolbar.canReset,
      toolbar.disabled,
      grid.rows.length,
      onImportClipboard,
      onImportFile,
      onClearSelection,
      onCopySelected,
      onDeleteSelected,
      onReset,
    ],
  );

  useEffect(() => {
    setRightToolbar(toolbarNode);
  }, [setRightToolbar, toolbarNode]);

  useEffect(() => {
    return () => setRightToolbar(null);
  }, [setRightToolbar]);

  return (
    <>
      <div className="lookup-grid-wrapper">
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
              disabled={grid.disabled ?? toolbar.disabled}
              getRowStatus={grid.getRowStatus}
            />
          </>
        )}
      </div>
    </>
  );
}
