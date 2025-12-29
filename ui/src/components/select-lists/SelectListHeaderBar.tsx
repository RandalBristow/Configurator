import type { SelectList } from "../../types/domain";
import { SaveIcon, ListPlus, ListFilter, Trash, X } from "lucide-react";

type Props = {
  currentListId?: string;
  lists: SelectList[];
  search: string;
  isCreatingNew?: boolean;
  controlsDisabled?: boolean;

  onChangeList: (id?: string) => void;
  onSearchChange: (value: string) => void;

  onNew: () => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel?: () => void;

  saveDisabled?: boolean;
  deleteDisabled?: boolean;
};

export function SelectListHeaderBar({
  currentListId,
  lists,
  search,
  isCreatingNew,
  controlsDisabled,
  onChangeList,
  onSearchChange,
  onNew,
  onSave,
  onDelete,
  onCancel,
  saveDisabled,
  deleteDisabled,
}: Props) {
  return (
    <div className="select-list-header-bar">
      <div className="select-list-header-tab">SELECT LISTS</div>
      <div className="select-list-header-row">
        <button
          className="icon-btn"
          style={{ marginRight: 20 }}
          type="button"
          title={isCreatingNew ? "Cancel new select list" : "Add new select list"}
          onClick={isCreatingNew ? onCancel : onNew}
          disabled={controlsDisabled && !isCreatingNew}
        >
          {isCreatingNew ? <X size={16} /> : <ListPlus size={16} />}
        </button>
        <div className="data-form-header-tab-divider" />
        <div>
          <button
            className="icon-btn"
            style={{ marginRight: 3 }}
            type="button"
            title="Save changes"
            onClick={onSave}
            disabled={saveDisabled}
          >
            <SaveIcon size={16} />
          </button>
          <button
            className="icon-btn"
            style={{ marginRight: 3 }}
            type="button"
            title="Delete currrent select list"
            onClick={onDelete}
            disabled={deleteDisabled || controlsDisabled}
          >
            <Trash size={16} />
          </button>
          {isCreatingNew && onCancel && null}
        </div>
        <div>
          <div style={{ display: "flex" }}>
            <div className="select-list-field" style={{ marginRight: 3 }}>
              <select
                className="table-input"
                style={{ width: 250 }}
                value={currentListId ?? ""}
                onChange={(e) => onChangeList(e.target.value || undefined)}
                disabled={controlsDisabled}
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              className="table-input"
              placeholder="Filter lists"
              style={{ width: 250 , marginRight: 5 }}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={controlsDisabled}
            />
            {/* TODO: Use popover for filter options and remove the above input */}
            <button
              className="icon-btn"
              style={{ marginRight: 0 }}
              type="button"
              title="Filter select lists"
              onClick={onNew}
              disabled={controlsDisabled}
            >
              <ListFilter size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
