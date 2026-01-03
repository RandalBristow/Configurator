import type React from "react";

type Props = {
  tableName: string;
  tableDescription: string;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onFocusSelectAll: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export function LookupTableDetailsPane({
  tableName,
  tableDescription,
  onChangeName,
  onChangeDescription,
  onFocusSelectAll,
}: Props) {
  return (
    <>
      <div className="muted small">Edit the lookup table name and description.</div>

      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="muted small">Lookup Table Name</label>
          <input
            className="table-input"
            placeholder="Name"
            value={tableName}
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
            value={tableDescription}
            onChange={(e) => onChangeDescription(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

