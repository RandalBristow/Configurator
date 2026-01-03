import type React from "react";

type Props = {
  listName: string;
  listDescription: string;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onFocusSelectAll: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export function SelectListDetailsPane({
  listName,
  listDescription,
  onChangeName,
  onChangeDescription,
  onFocusSelectAll,
}: Props) {
  return (
    <>
      <div className="muted small">Edit the select list name and description.</div>

      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="muted small">Select List Name</label>
          <input
            className="table-input"
            placeholder="Name"
            value={listName}
            onChange={(e) => onChangeName(e.target.value)}
            onFocus={onFocusSelectAll}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="muted small">Description</label>
          <textarea
            className="table-input"
            placeholder="Description"
            rows={3}
            style={{ resize: "vertical" }}
            value={listDescription}
            onChange={(e) => onChangeDescription(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

