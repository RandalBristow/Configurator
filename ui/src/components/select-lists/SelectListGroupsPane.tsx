import type React from "react";
import { Check, ChevronDown, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import { DataGrid, type DataGridColumn } from "../table/DataTable";
import { GroupSetToolbar } from "./GroupSetToolbar";
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
  onToggleGroupSelect: (setId: string, groupId: string) => void;
  onToggleGroupSelectAll: (setId: string, ids: string[]) => void;

  onGroupNameChange: (setId: string, groupId: string, value: string) => void;

  groupNewRowsBySetId: Record<string, { name?: string }>;
  onGroupNewRowChange: (setId: string, value: string) => void;
  onGroupNewRowBlur: (setId: string) => void;
  getGroupNewRowFirstInputRef: (setId: string) => React.MutableRefObject<HTMLInputElement | null>;

  onImportClipboard: (set: SelectListGroupSet) => void;
  onImportFile: (set: SelectListGroupSet, e: React.ChangeEvent<HTMLInputElement>) => void;
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
  onToggleGroupSelect,
  onToggleGroupSelectAll,
  onGroupNameChange,
  groupNewRowsBySetId,
  onGroupNewRowChange,
  onGroupNewRowBlur,
  getGroupNewRowFirstInputRef,
  onImportClipboard,
  onImportFile,
  onClearSelection,
  onCopySelected,
  onDeleteSelected,
}: Props) {
  return (
    <>
      <div className="muted small">Manage group sets and groups for this list.</div>
      {disabled && (
        <div className="muted small" style={{ marginTop: 8 }}>
          Save the select list to manage group sets.
        </div>
      )}

      <div className="pane-header-actions row" style={{ marginTop: 8, gap: 8 }}>
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
                <GroupSetToolbar
                  disabled={disabled}
                  hasSelection={selectedGroups.size > 0}
                  onImportClipboard={() => onImportClipboard(set)}
                  onImportFile={(e) => onImportFile(set, e)}
                  onClearSelection={() => onClearSelection(set.id)}
                  onCopySelected={() => onCopySelected(set)}
                  onDeleteSelected={() => onDeleteSelected(set)}
                />
                <div className="group-set-table">
                  <DataGrid
                    columns={groupColumns}
                    rows={groupRows}
                    getRowId={(row) => row.id}
                    selectedIds={selectedGroups}
                    onToggleSelect={(id) => onToggleGroupSelect(set.id, id)}
                    onToggleSelectAll={(ids) => onToggleGroupSelectAll(set.id, ids)}
                    onRowChange={(id, _key, value) => onGroupNameChange(set.id, id, String(value))}
                    newRow={groupNewRowsBySetId[set.id] ?? {}}
                    onNewRowChange={(_key, value) => onGroupNewRowChange(set.id, String(value))}
                    onNewRowBlur={() => onGroupNewRowBlur(set.id)}
                    newRowFirstInputRef={getGroupNewRowFirstInputRef(set.id)}
                    enableSelection
                    enableFilters={false}
                    enableSorting={false}
                    showNewRow
                    disabled={disabled}
                    getRowStatus={getRowStatus(set.id)}
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

