import type { DataGridColumn } from "../table/DataTable";
import { RdgGrid } from "../table/RdgGrid";
import type { SelectListProperty } from "../../types/domain";

type Props = {
  disabled: boolean;
  isLoading: boolean;

  columns: DataGridColumn<SelectListProperty>[];
  rows: SelectListProperty[];

  selectedIds: Set<string>;
  onToggleSelectAll: (ids: string[]) => void;

  onRowChange: (id: string, key: keyof SelectListProperty, value: any) => void;

  newRow: Partial<SelectListProperty>;
  onNewRowChange: (key: keyof SelectListProperty, value: any) => void;
  onCommitNewRow: (draft?: SelectListProperty) => void;

  getRowStatus: (row: SelectListProperty) => "new" | "edited" | undefined;
};

export function SelectListPropertiesPane({
  disabled,
  isLoading,
  columns,
  rows,
  selectedIds,
  onToggleSelectAll,
  onRowChange,
  newRow,
  onNewRowChange,
  onCommitNewRow,
  getRowStatus,
}: Props) {
  return (
    <>
      {isLoading && (
        <div className="muted small" style={{ padding: 12 }}>
          Loading properties...
        </div>
      )}
      {!isLoading && rows.length === 0 && (
        <div className="muted small" style={{ padding: 12 }}>
          No properties yet.
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <RdgGrid
          columns={columns}
          rows={rows}
          selectedIds={selectedIds}
          onToggleSelectAll={onToggleSelectAll}
          onRowChange={onRowChange}
          newRow={newRow}
          onNewRowChange={onNewRowChange}
          onCommitNewRow={onCommitNewRow}
          showNewRow={!disabled}
          disabled={disabled}
          getRowStatus={getRowStatus}
          fillColumnKey="key"
          fillMinPx={80}
        />
      </div>
    </>
  );
}
