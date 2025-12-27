import type React from "react";

type Props = {
  listName: string;
  listDescription: string;

  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;

  onFocusSelectAll: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export function SelectListMetaForm({
  listName,
  listDescription,
  onChangeName,
  onChangeDescription,
  onFocusSelectAll,
}: Props) {
  return (
    <div className="select-list-toolbar" style={{paddingBottom: 12}}>
      <div className="select-list-picker">
        <div className="picker-row" style={{ gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <label className="muted small">Select List Name</label>
            <input
              className="table-input"
              placeholder="Name"
              style={{ marginBottom: 6 }}
              value={listName}
              onChange={(e) => onChangeName(e.target.value)}
              onFocus={onFocusSelectAll}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <label className="muted small">Description</label>
            <textarea
              className="table-input"
              placeholder="Description"
              rows={2}
              style={{ resize: "vertical" }}
              value={listDescription}
              onChange={(e) => onChangeDescription(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
