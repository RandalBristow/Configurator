import type React from "react";
import type { OptionType } from "../../types/domain";

export type OptionsDetailsPaneProps = {
  name: string;
  description: string;
  isActive: boolean;
  optionType: OptionType;
  disabled?: boolean;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeIsActive: (value: boolean) => void;
  onFocusSelectAll: (e: React.FocusEvent<HTMLInputElement>) => void;
};

const formatOptionType = (value: OptionType) =>
  value === "configured" ? "Configured" : "Simple";

export function OptionsDetailsPane({
  name,
  description,
  isActive,
  optionType,
  disabled,
  onChangeName,
  onChangeDescription,
  onChangeIsActive,
  onFocusSelectAll,
}: OptionsDetailsPaneProps) {
  return (
    <>
      <div className="muted small">Edit the option metadata and status.</div>

      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="muted small">Option Name</label>
          <input
            className="table-input"
            placeholder="Name"
            value={name}
            disabled={disabled}
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
            value={description}
            disabled={disabled}
            onChange={(e) => onChangeDescription(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label className="muted small">Option Type</label>
          <input className="table-input" value={formatOptionType(optionType)} disabled />
        </div>

        <label className="muted small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={isActive}
            disabled={disabled}
            onChange={(e) => onChangeIsActive(e.target.checked)}
          />
          Active
        </label>
      </div>
    </>
  );
}
