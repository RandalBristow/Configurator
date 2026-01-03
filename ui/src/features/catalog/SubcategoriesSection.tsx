import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subcategoriesApi } from "../../api/entities";
import { List } from "../../components/List";
import type { Subcategory } from "../../types/domain";

type Props = {
  categoryId?: string;
  selectedSubcategory?: string;
  onSelect: (id?: string) => void;
  onResetBelow: () => void;
};

export function SubcategoriesSection({
  categoryId,
  selectedSubcategory,
  onSelect,
  onResetBelow,
}: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const subcategories = useQuery({
    queryKey: ["subcategories", categoryId, "all"],
    queryFn: () => subcategoriesApi.list(categoryId, true),
    enabled: !!categoryId,
  });

  const createSubcategory = useMutation({
    mutationFn: (data: Partial<Subcategory>) => subcategoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory added");
    },
    onError: (err) => toast.error(`Add failed: ${String(err)}`),
  });

  const editSubcategory = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Subcategory> }) =>
      subcategoriesApi.update(data.id, data.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory updated");
    },
    onError: (err) => toast.error(`Update failed: ${String(err)}`),
  });

  const deleteSubcategory = useMutation({
    mutationFn: (id: string) => subcategoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      qc.invalidateQueries({ queryKey: ["options"] });
      qc.invalidateQueries({ queryKey: ["attributes"] });
      onResetBelow();
      toast.success("Subcategory deleted");
    },
    onError: (err) => toast.error(`Delete failed: ${String(err)}`),
  });

  const activateSubcategory = useMutation({
    mutationFn: (id: string) => subcategoriesApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory activated");
    },
    onError: (err) => toast.error(`Activate failed: ${String(err)}`),
  });

  return (
    <div className="card">
      <div className="card-head">
        <h2>Subcategories</h2>
        <span className="tag">{subcategories.data?.length ?? 0}</span>
      </div>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!categoryId) return;
          if (!name.trim() || !description.trim()) return;
          createSubcategory.mutate({
            categoryId,
            name: name.trim(),
            description: description.trim(),
            sortOrder: Number(sortOrder) || 0,
            isActive: true,
          });
          setName("");
          setDescription("");
          setSortOrder(0);
        }}
      >
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={!categoryId || createSubcategory.isPending}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={!categoryId || createSubcategory.isPending}
        />
        <input
          type="number"
          placeholder="Order"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          disabled={!categoryId || createSubcategory.isPending}
        />
        <button className="btn" type="submit" disabled={!categoryId || createSubcategory.isPending}>
          Add Subcategory
        </button>
      </form>

      <List<Subcategory>
        items={subcategories.data ?? []}
        selectedId={selectedSubcategory}
        onSelect={(id) => onSelect(id)}
        onDelete={(id) => {
          if (!confirm("Delete subcategory? This cannot be undone.")) return;
          deleteSubcategory.mutate(id);
        }}
        onActivate={(id) => activateSubcategory.mutate(id)}
        onEdit={(sub) => {
          const nextName = prompt("Name", sub.name);
          if (!nextName) return;
          const nextDescription = prompt("Description", sub.description ?? "");
          if (nextDescription === null) return;
          const nextOrderRaw = prompt("Order", String(sub.sortOrder ?? 0));
          if (nextOrderRaw === null) return;
          const nextOrder = Number(nextOrderRaw);
          if (Number.isNaN(nextOrder)) {
            toast.error("Order must be a number");
            return;
          }
          editSubcategory.mutate({
            id: sub.id,
            payload: { name: nextName, description: nextDescription, sortOrder: nextOrder },
          });
        }}
        render={(sub) => (
          <>
            <div>
              <div>{sub.name}</div>
              {sub.description && <div className="muted">{sub.description}</div>}
              <div className="muted small">Order: {sub.sortOrder ?? 0}</div>
            </div>
            {!sub.isActive && <span className="tag">inactive</span>}
          </>
        )}
      />

      {!categoryId && <div className="muted">Select a category to manage subcategories.</div>}
      {subcategories.error && <div className="error">{String(subcategories.error)}</div>}
    </div>
  );
}
