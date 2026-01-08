import { Check, ChevronDown, ChevronRight, Copy, Eraser, Pencil, Trash2, X } from "lucide-react";
import { RdgGrid } from "../table/RdgGrid";
import type { DataGridColumn } from "../table/DataTable";
import { ToolbarButton, ToolbarDivider } from "../ui/ToolbarButton";
import type { SelectListGroupSet } from "../../types/domain";

export type DisplayGroupSet = SelectListGroupSet & { __pending?: boolean };
export type GroupRow = { id: string; name: string };

type Props = {
  disabled: boolean;
  groupSetName: string;
  onChangeGroupSetName: (value: string) => void;
  onAddGroupSet: () => void;
  creatingGroupSet: boolean;

  isLoading: boolean;
  visibleGroupSets: DisplayGroupSet[];

  openGroupSets: Set<string>;
  onToggleOpen: (setId: string) => void;

  editingGroupSetId: string | null;
  editingGroupSetName: string;
  onChangeEditingGroupSetName: (value: string) => void;
  onStartEditGroupSet: (set: SelectListGroupSet) => void;
  onCancelEditGroupSet: () => void;
  onSaveGroupSet: (setId: string) => void;
  updatingGroupSet: boolean;
  onDeleteGroupSet: (set: DisplayGroupSet) => void;

  groupColumns: DataGridColumn<GroupRow>[];
  getRowStatus: (setId: string) => (row: GroupRow) => "new" | "edited" | undefined;

  groupRowsBySetId: Record<string, GroupRow[]>;
  groupSelectionsBySetId: Record<string, Set<string>>;
  onToggleGroupSelectAll: (setId: string, ids: string[]) => void;
  onGroupNameChange: (setId: string, groupId: string, value: string) => void;

  groupNewRowsBySetId: Record<string, { name?: string }>;
  onGroupNewRowChange: (setId: string, value: string) => void;
  onGroupCommitNewRow: (setId: string, draft?: GroupRow) => void;
  onClearSelection: (setId: string) => void;
  onCopySelected: (set: SelectListGroupSet) => void;
  onDeleteSelected: (set: SelectListGroupSet) => void;
};

export function SelectListGroupsPane({
  disabled,
  groupSetName,
  onChangeGroupSetName,
  onAddGroupSet,
  creatingGroupSet,
  isLoading,
  visibleGroupSets,
  openGroupSets,
  onToggleOpen,
  editingGroupSetId,
  editingGroupSetName,
  onChangeEditingGroupSetName,
  onStartEditGroupSet,
  onCancelEditGroupSet,
  onSaveGroupSet,
  updatingGroupSet,
  onDeleteGroupSet,
  groupColumns,
  getRowStatus,
  groupRowsBySetId,
  groupSelectionsBySetId,
  onToggleGroupSelectAll,
  onGroupNameChange,
  groupNewRowsBySetId,
  onGroupNewRowChange,
  onGroupCommitNewRow,
  onClearSelection,
  onCopySelected,
  onDeleteSelected,
}: Props) {
  return (
    <>
      {/* <div className="muted small">Manage group sets and groups for this list.</div> */}
      {disabled && (
        <div className="muted small" style={{ marginTop: 8 }}>
          Save the select list to manage group sets.
        </div>
      )}

      <div className="pane-header-actions row">
        <button
          className="btn secondary small-btn"
          type="button"
          onClick={onAddGroupSet}
          disabled={disabled || creatingGroupSet}
        >
          Add
        </button>
        <input
          className="table-input"
          placeholder="New group set name"
          style={{ flex: 1 }}
          value={groupSetName}
          onChange={(e) => onChangeGroupSetName(e.target.value)}
          disabled={disabled}
        />
      </div>

      {isLoading && (
        <div className="muted small" style={{ marginTop: 10 }}>
          Loading group sets...
        </div>
      )}
      {!isLoading && visibleGroupSets.length === 0 && (
        <div className="muted small" style={{ marginTop: 10 }}>
          No group sets yet.
        </div>
      )}

      {visibleGroupSets.map((set) => {
        const isOpen = openGroupSets.has(set.id);
        const isEditing = editingGroupSetId === set.id;
        const groupRows = groupRowsBySetId[set.id] ?? [];
        const selectedGroups = groupSelectionsBySetId[set.id] ?? new Set<string>();

        return (
          <div key={set.id} className="group-set">
            <div className="group-set-header">
              <button
                className="group-set-toggle"
                type="button"
                onClick={() => onToggleOpen(set.id)}
              >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {isEditing ? (
                  <input
                    className="table-input"
                    value={editingGroupSetName}
                    onChange={(e) => onChangeEditingGroupSetName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <span className="group-set-title">{set.name}</span>
                )}
              </button>

              <div className="group-set-actions">
                {isEditing ? (
                  <>
                    <button
                      className="icon-plain"
                      type="button"
                      title="Save name"
                      onClick={() => onSaveGroupSet(set.id)}
                      disabled={updatingGroupSet}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      className="icon-plain"
                      type="button"
                      title="Cancel"
                      onClick={onCancelEditGroupSet}
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="icon-plain"
                      type="button"
                      title="Edit group set"
                      onClick={() => onStartEditGroupSet(set)}
                      disabled={disabled}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className="icon-plain"
                      type="button"
                      title="Delete group set"
                      onClick={() => onDeleteGroupSet(set)}
                      disabled={disabled}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isOpen && (
              <div className="group-set-body">
                <div className="selection-bar selection-bar--compact" style={{ padding: 0, marginBottom: 2, marginTop: -4 }}>
                  <div className="selection-bar__actions">
                    <ToolbarButton
                      title="Clear selection"
                      onClick={() => onClearSelection(set.id)}
                      disabled={disabled || selectedGroups.size === 0}
                      label="Clear"
                      icon={<Eraser size={14} />}
                    />
                    <ToolbarButton
                      title="Copy selected rows"
                      onClick={() => onCopySelected(set)}
                      disabled={disabled || selectedGroups.size === 0}
                      label="Copy"
                      icon={<Copy size={14} />}
                    />
                    <ToolbarDivider />
                    <ToolbarButton
                      title="Delete selected rows"
                      onClick={() => onDeleteSelected(set)}
                      disabled={disabled || selectedGroups.size === 0}
                      label="Delete"
                      icon={<Trash2 size={14} />}
                    />
                  </div>
                </div>
                <div className="group-set-table">
                  <RdgGrid
                    columns={groupColumns}
                    rows={groupRows}
                    selectedIds={selectedGroups}
                    onToggleSelectAll={(ids) => onToggleGroupSelectAll(set.id, ids)}
                    onRowChange={(id, _key, value) => onGroupNameChange(set.id, id, String(value))}
                    newRow={groupNewRowsBySetId[set.id] ?? {}}
                    onNewRowChange={(_key, value) => onGroupNewRowChange(set.id, String(value))}
                    onCommitNewRow={(draft) => onGroupCommitNewRow(set.id, draft as any)}
                    showNewRow
                    newRowIdPrefix={`pending-${set.id}-`}
                    disabled={disabled}
                    getRowStatus={getRowStatus(set.id)}
                    fillColumnKey="name"
                    fillMinPx={80}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
