import type React from "react";
import { useEffect } from "react";
import type { DataGridColumn } from "../table/DataTable";
import { DataGrid } from "../table/DataTable";
import { DataTableToolbar } from "../table/DataTableToolbar";
import type { SelectListGroup, SelectListGroupSet, SelectListItem } from "../../types/domain";
import { useTabToolbar } from "../../layout/TabToolbarContext";

type Props<T extends { id: string }> = {
  onFocusSelectAll: (e: React.FocusEvent<HTMLInputElement>) => void;

  groupsDisabled: boolean;
  groupSets: SelectListGroupSet[];
  selectedGroupSetId?: string;
  onChangeGroupSetId: (id?: string) => void;
  selectedGroupId?: string;
  onChangeGroupId: (id?: string) => void;
  selectedGroupOptions: SelectListGroup[];

  toolbar: {
    selectedCount: number;
    canReset: boolean;
    disabled: boolean;
    onImportClipboard: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearSelection: () => void;
    onCopySelected: () => void;
    onDeleteSelected: () => void;
    onReset: () => void;
  };

  grid: {
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
    selectionDisabled?: boolean;
    disabled?: boolean;
    getRowStatus?: (row: SelectListItem) => "new" | "edited" | undefined;
  };
};

export function SelectListItemsTablePane<T extends SelectListItem>({
  onFocusSelectAll,
  groupsDisabled,
  groupSets,
  selectedGroupSetId,
  onChangeGroupSetId,
  selectedGroupId,
  onChangeGroupId,
  selectedGroupOptions,
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
    <>
      <div className="table-toolbar" style={{ marginBottom: 10 }}>
        <div className="table-toolbar-left" style={{ gap: 12 }}>
          <label className="small" style={{ fontWeight: 600 }}>
            Group set
            <select
              className="table-input"
              style={{ marginLeft: 0, minWidth: 180 }}
              value={selectedGroupSetId ?? ""}
              onChange={(e) => onChangeGroupSetId(e.target.value || undefined)}
              disabled={groupsDisabled}
            >
              <option value="">Select group set</option>
              {groupSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
          </label>
          <label className="small" style={{ fontWeight: 600 }}>
            Group
            <select
              className="table-input"
              style={{ marginLeft: 0, minWidth: 180 }}
              value={selectedGroupId ?? ""}
              onChange={(e) => onChangeGroupId(e.target.value || undefined)}
              disabled={groupsDisabled || !selectedGroupSetId}
            >
              <option value="">Select group</option>
              {selectedGroupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="table-pane">
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
          onFocusSelectAll={onFocusSelectAll}
          newRowRef={grid.newRowRef}
          newRowFirstInputRef={grid.newRowFirstInputRef}
          onNewRowBlur={grid.onNewRowBlur}
          enableSelection
          enableFilters
          enableSorting
          selectionDisabled={grid.selectionDisabled}
          disabled={grid.disabled}
          getRowStatus={grid.getRowStatus as any}
        />
      </div>
    </>
  );
}
