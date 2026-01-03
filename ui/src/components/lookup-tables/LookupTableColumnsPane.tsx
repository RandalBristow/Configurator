import type React from "react";
import { DataGrid, type DataGridColumn } from "../table/DataTable";
import { GroupSetToolbar } from "../select-lists/GroupSetToolbar";
import type { LookupTableColumn } from "../../types/domain";

type Props = {
  disabled: boolean;
  isLoading: boolean;

  columns: DataGridColumn<LookupTableColumn>[];
  rows: LookupTableColumn[];

  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;

  onRowChange: (id: string, key: keyof LookupTableColumn, value: any) => void;

  newRow: Partial<LookupTableColumn>;
  onNewRowChange: (key: keyof LookupTableColumn, value: any) => void;
  newRowRef: React.RefObject<HTMLTableRowElement | null>;
  newRowFirstInputRef: React.RefObject<HTMLInputElement | null>;
  onNewRowBlur: (e: React.FocusEvent<HTMLTableRowElement>) => void;

  onClearSelection: () => void;
  onCopySelected: () => void;
  onDeleteSelected: () => void;

  getRowStatus: (row: LookupTableColumn) => "new" | "edited" | undefined;
};

export function LookupTableColumnsPane({
  disabled,
  isLoading,
  columns,
  rows,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowChange,
  newRow,
  onNewRowChange,
  newRowRef,
  newRowFirstInputRef,
  onNewRowBlur,
  onClearSelection,
  onCopySelected,
  onDeleteSelected,
  getRowStatus,
}: Props) {
  return (
    <>
      <div className="muted small">Define the columns for this table.</div>
      {disabled && (
        <div className="muted small" style={{ marginTop: 8 }}>
          Save the lookup table to manage columns.
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <GroupSetToolbar
          disabled={disabled}
          hasSelection={selectedIds.size > 0}
          onClearSelection={onClearSelection}
          onCopySelected={onCopySelected}
          onDeleteSelected={onDeleteSelected}
        />
      </div>

      {isLoading && (
        <div className="muted small" style={{ marginTop: 10 }}>
          Loading columns...
        </div>
      )}
      {!isLoading && rows.length === 0 && (
        <div className="muted small" style={{ marginTop: 10 }}>
          No columns yet.
        </div>
      )}

      <div className="table-pane" style={{ marginTop: 8 }}>
        <DataGrid
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={onToggleSelectAll}
          onRowChange={onRowChange}
          newRow={newRow}
          onNewRowChange={onNewRowChange}
          newRowRef={newRowRef}
          newRowFirstInputRef={newRowFirstInputRef}
          onNewRowBlur={onNewRowBlur}
          enableFilters
          enableSorting={false}
          showNewRow={!disabled}
          getRowStatus={getRowStatus}
          disabled={disabled}
        />
      </div>
    </>
  );
}
