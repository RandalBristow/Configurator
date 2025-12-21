import { useState } from "react";
import type { Category } from "../../types/domain";

export type CreateCategoryInput = Partial<Category>;

export function CategoriesForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: CreateCategoryInput) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description, order, isActive: true });
        setName("");
        setDescription("");
        setOrder(0);
      }}
    >
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Order"
        value={order}
        onChange={(e) => setOrder(Number(e.target.value))}
      />
      <button className="btn" type="submit" disabled={loading || !name}>
        Add Category
      </button>
    </form>
  );
}
