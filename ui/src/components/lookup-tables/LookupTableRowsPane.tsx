import { useEffect } from "react";
import { DataGrid, type DataGridColumn } from "../table/DataTable";
import { DataTableToolbar } from "../table/DataTableToolbar";
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
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onRowChange: (id: string, key: keyof T, value: any) => void;

  newRow: Partial<T>;
  onNewRowChange: (key: keyof T, value: any) => void;
  newRowRef?: React.RefObject<HTMLTableRowElement | null>;
  newRowFirstInputRef?: React.RefObject<HTMLInputElement | null>;
  onNewRowBlur?: (e: React.FocusEvent<HTMLTableRowElement>) => void;

  disabled?: boolean;
  getRowStatus?: (row: T) => "new" | "edited" | undefined;
};

type Props<T> = {
  toolbar: ToolbarProps;
  grid: GridProps<T>;
};

export function LookupTableRowsPane<T extends { id: string }>({
  toolbar,
  grid,
}: Props<T>) {
  const { setRightToolbar } = useTabToolbar();

  useEffect(() => {
    setRightToolbar(
      <DataTableToolbar
        selectedCount={toolbar.selectedCount}
        rowCount={grid.rows.length}
        canReset={toolbar.canReset}
        disabled={toolbar.disabled}
        onImportClipboard={toolbar.onImportClipboard}
        onImportFile={toolbar.onImportFile}
        onClearSelection={toolbar.onClearSelection}
        onCopySelected={toolbar.onCopySelected}
        onDeleteSelected={toolbar.onDeleteSelected}
        onReset={toolbar.onReset}
      />
    );
  }, [
    setRightToolbar,
    toolbar.selectedCount,
    toolbar.canReset,
    toolbar.disabled,
    toolbar.onImportClipboard,
    toolbar.onImportFile,
    toolbar.onClearSelection,
    toolbar.onCopySelected,
    toolbar.onDeleteSelected,
    toolbar.onReset,
    grid.rows.length,
  ]);

  useEffect(() => {
    return () => setRightToolbar(null);
  }, [setRightToolbar]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div className="table-pane" style={{ flex: 1, minHeight: 0 }}>
        <DataGrid
          columns={grid.columns}
          rows={grid.rows}
          getRowId={(row) => row.id}
          selectedIds={grid.selectedIds}
          onToggleSelect={grid.onToggleSelect}
          onToggleSelectAll={grid.onToggleSelectAll}
          onRowChange={grid.onRowChange}
          newRow={grid.newRow}
          onNewRowChange={grid.onNewRowChange}
          newRowRef={grid.newRowRef}
          newRowFirstInputRef={grid.newRowFirstInputRef}
          onNewRowBlur={grid.onNewRowBlur}
          enableFilters
          enableSorting
          showNewRow
          getRowStatus={grid.getRowStatus}
          disabled={grid.disabled}
        />
      </div>
    </div>
  );
}
