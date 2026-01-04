import type { DataGridColumn } from "../table/DataTable";
import type { LookupTableColumn } from "../../types/domain";
import { RdgGrid } from "../table/RdgGrid";

type Props = {
  disabled: boolean;
  isLoading: boolean;

  columns: DataGridColumn<LookupTableColumn>[];
  rows: LookupTableColumn[];

  selectedIds: Set<string>;
  onToggleSelectAll: (ids: string[]) => void;

  onRowChange: (id: string, key: keyof LookupTableColumn, value: any) => void;

  newRow: Partial<LookupTableColumn>;
  onNewRowChange: (key: keyof LookupTableColumn, value: any) => void;
  onCommitNewRow: () => void;

  getRowStatus: (row: LookupTableColumn) => "new" | "edited" | undefined;
};

export function LookupTableColumnsPane({
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
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
        {isLoading && (
          <div className="muted small" style={{ padding: 12 }}>
            Loading columns...
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="muted small" style={{ padding: 12 }}>
            No columns yet.
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <RdgGrid
            columns={columns}
            rows={rows}
            selectedIds={selectedIds}
            onToggleSelectAll={onToggleSelectAll}
            onRowChange={onRowChange}
            fillColumnKey="name"
            fillMinPx={60}
            newRow={newRow}
            onNewRowChange={onNewRowChange}
            onCommitNewRow={onCommitNewRow}
            showNewRow={!disabled}
            disabled={disabled}
            getRowStatus={getRowStatus}
          />
        </div>
      </div>
    </>
  );
}
