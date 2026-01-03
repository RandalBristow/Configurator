import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesApi } from "../../api/entities";
import { CategoriesForm } from "../../components/forms/CategoriesForm";
import { List } from "../../components/List";
import type { Category } from "../../types/domain";

type Props = {
  selectedCategory?: string;
  onSelect: (id?: string) => void;
  onResetTree: () => void;
};

export function CategoriesSection({ selectedCategory, onSelect, onResetTree }: Props) {
  const qc = useQueryClient();

  const categories = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => categoriesApi.list(true),
  });

  const createCategory = useMutation({
    mutationFn: (data: Partial<Category>) => categoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category added");
    },
    onError: (err) => toast.error(`Add failed: ${String(err)}`),
  });

  const editCategory = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Category> }) =>
      categoriesApi.update(data.id, data.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
    },
    onError: (err) => toast.error(`Update failed: ${String(err)}`),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      qc.invalidateQueries({ queryKey: ["options"] });
      qc.invalidateQueries({ queryKey: ["attributes"] });
      onResetTree();
      toast.success("Category deleted");
    },
    onError: (err) => toast.error(`Delete failed: ${String(err)}`),
  });

  const activateCategory = useMutation({
    mutationFn: (id: string) => categoriesApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category activated");
    },
    onError: (err) => toast.error(`Activate failed: ${String(err)}`),
  });

  return (
    <div className="card">
      <div className="card-head">
        <h2>Categories</h2>
        <span className="tag">{categories.data?.length ?? 0}</span>
      </div>

      <CategoriesForm onSubmit={createCategory.mutate} loading={createCategory.isPending} />

      <List<Category>
        items={categories.data ?? []}
        selectedId={selectedCategory}
        onSelect={(id) => onSelect(id)}
        onDelete={(id) => {
          if (!confirm("Delete category? This cannot be undone.")) return;
          deleteCategory.mutate(id);
        }}
        onActivate={(id) => activateCategory.mutate(id)}
        onEdit={(cat) => {
          const name = prompt("Name", cat.name);
          if (!name) return;
          const description = prompt("Description", cat.description ?? "");
          if (description === null) return;
          const orderRaw = prompt("Order", String(cat.order ?? 0));
          if (orderRaw === null) return;
          const order = Number(orderRaw);
          if (Number.isNaN(order)) {
            toast.error("Order must be a number");
            return;
          }
          editCategory.mutate({ id: cat.id, payload: { name, description, order } });
        }}
        render={(cat) => (
          <>
            <div>
              <div>{cat.name}</div>
              <div className="muted">{cat.description}</div>
              <div className="muted small">Order: {cat.order ?? 0}</div>
            </div>
            {!cat.isActive && <span className="tag">inactive</span>}
          </>
        )}
      />

      {categories.error && <div className="error">{String(categories.error)}</div>}
    </div>
  );
}
