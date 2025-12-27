import type { SelectList } from "../../types/domain";
import { SaveIcon, ListPlus, ListFilter, Trash } from "lucide-react";

type Props = {
  currentListId?: string;
  lists: SelectList[];
  search: string;

  onChangeList: (id?: string) => void;
  onSearchChange: (value: string) => void;

  onNew: () => void;
  onSave: () => void;
  onDelete: () => void;

  saveDisabled?: boolean;
  deleteDisabled?: boolean;
};

export function SelectListHeaderBar({
  currentListId,
  lists,
  search,
  onChangeList,
  onSearchChange,
  onNew,
  onSave,
  onDelete,
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
          title="Add new select list"
          onClick={onNew}
        >
          <ListPlus size={16} />
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
            disabled={deleteDisabled}
          >
            <Trash size={16} />
          </button>

        </div>
        <div>
          <div style={{ display: "flex" }}>
            <div className="select-list-field" style={{ marginRight: 3 }}>
              <select
                className="table-input"
                style={{ width: 250 }}
                value={currentListId ?? ""}
                onChange={(e) => onChangeList(e.target.value || undefined)}
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
            />
            {/* TODO: Use popover for filter options and remove the above input */}
            <button
              className="icon-btn"
              style={{ marginRight: 0 }}
              type="button"
              title="Filter select lists"
              onClick={onNew}
            >
              <ListFilter size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
