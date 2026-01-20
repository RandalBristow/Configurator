import { useState } from "react";
import type { Option, OptionType } from "../../types/domain";

export type CreateOptionInput = Partial<Option>;

export function OptionsForm({
  optionType,
  onSubmit,
  loading,
  disabled,
}: {
  optionType: OptionType;
  onSubmit: (data: CreateOptionInput) => void;
  loading: boolean;
  disabled: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description, isActive, optionType });
        setName("");
        setDescription("");
        setIsActive(true);
      }}
    >
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Active
      </label>
      <button className="btn" type="submit" disabled={disabled || loading || !name}>
        Add Option
      </button>
    </form>
  );
}
