import { useState } from "react";
import type { Option } from "../../types/domain";

export type CreateOptionInput = Partial<Option>;

export function OptionsForm({
  subcategoryId,
  onSubmit,
  loading,
  disabled,
}: {
  subcategoryId?: string;
  onSubmit: (data: CreateOptionInput) => void;
  loading: boolean;
  disabled: boolean;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!subcategoryId) return;
        onSubmit({ subcategoryId, name, code, description, sortOrder });
        setName("");
        setCode("");
        setDescription("");
        setSortOrder(0);
      }}
    >
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        placeholder="Sort order"
        value={sortOrder}
        onChange={(e) => setSortOrder(Number(e.target.value))}
      />
      <button className="btn" type="submit" disabled={disabled || loading || !name || !code}>
        Add Option
      </button>
    </form>
  );
}
