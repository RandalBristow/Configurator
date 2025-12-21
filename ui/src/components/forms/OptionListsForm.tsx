import { useState } from "react";
import type { OptionList } from "../../types/domain";

export type CreateOptionListInput = Partial<OptionList>;

export function OptionListsForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: CreateOptionListInput) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description });
        setName("");
        setDescription("");
      }}
    >
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button className="btn" type="submit" disabled={loading || !name}>
        Add Option List
      </button>
    </form>
  );
}
