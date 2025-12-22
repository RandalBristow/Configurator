import { useState } from "react";
import type { SelectList } from "../../types/domain";

export type CreateSelectListInput = Partial<SelectList>;

export function SelectListsForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: CreateSelectListInput) => void;
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
        Add Select List
      </button>
    </form>
  );
}
