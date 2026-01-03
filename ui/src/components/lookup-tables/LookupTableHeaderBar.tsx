import type { LookupTable } from "../../types/domain";
import { SaveIcon, ListPlus, ListFilter, Trash, X } from "lucide-react";
import { WorkspaceHeader } from "../workspace/WorkspaceHeader";
import { WorkspaceToolbar } from "../workspace/WorkspaceToolbar";

type Props = {
  currentTableId?: string;
  tables: LookupTable[];
  search: string;
  isCreatingNew?: boolean;
  controlsDisabled?: boolean;

  onChangeTable: (id?: string) => void;
  onSearchChange: (value: string) => void;

  onNew: () => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel?: () => void;

  saveDisabled?: boolean;
  deleteDisabled?: boolean;
};

export function LookupTableHeaderBar({
  currentTableId,
  tables,
  search,
  isCreatingNew,
  controlsDisabled,
  onChangeTable,
  onSearchChange,
  onNew,
  onSave,
  onDelete,
  onCancel,
  saveDisabled,
  deleteDisabled,
}: Props) {
  return (
    <>
      <WorkspaceHeader
        title="Lookup Tables"
        subtitle="Global tabular datasets"
        right={
          <>
            <button
              className="icon-btn"
              type="button"
              title={isCreatingNew ? "Cancel new lookup table" : "New lookup table"}
              onClick={isCreatingNew ? onCancel : onNew}
              disabled={controlsDisabled && !isCreatingNew}
            >
              {isCreatingNew ? <X size={16} /> : <ListPlus size={16} />}
            </button>
            <button
              className="icon-btn"
              type="button"
              title="Save changes"
              onClick={onSave}
              disabled={saveDisabled}
            >
              <SaveIcon size={16} />
            </button>
            <button
              className="icon-btn"
              type="button"
              title="Delete current lookup table"
              onClick={onDelete}
              disabled={deleteDisabled || controlsDisabled}
            >
              <Trash size={16} />
            </button>
          </>
        }
      />

      <WorkspaceToolbar
        left={
          <>
            <select
              className="table-input"
              style={{ width: 260 }}
              value={currentTableId ?? ""}
              onChange={(e) => onChangeTable(e.target.value || undefined)}
              disabled={controlsDisabled}
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <input
              className="table-input"
              placeholder="Search tables"
              style={{ width: 260 }}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={controlsDisabled}
            />

            <button
              className="icon-btn"
              type="button"
              title="Filter options (coming soon)"
              onClick={() => void 0}
              disabled
            >
              <ListFilter size={16} />
            </button>
          </>
        }
      />
    </>
  );
}
