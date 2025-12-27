import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../../api/entities";
import type { Category } from "../../types/domain";
import { DataTable, type DataTableColumn } from "../../components/table/_DataTable";
import { toast } from "sonner";

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

  const toggleCategory = (id: string, next: boolean) => {
    if (next) {
      activateCategory.mutate(id);
    } else {
      editCategory.mutate({ id, payload: { isActive: false } });
    }
  };

  const importCategories = async (records: Partial<Category>[]) => {
    const before = await categoriesApi.list(true);
    const beforeCount = before.length;
    const beforeNames = before.map((c) => c.name.toLowerCase());
    const normalized = records
      .map((r) => {
        const entries = Object.entries(r).reduce<Record<string, any>>((acc, [k, v]) => {
          acc[k.toLowerCase()] = v;
          return acc;
        }, {});
        const name = (entries.name ?? entries[""] ?? "").toString().trim();
        if (!name) return null;
        const description = (entries.description ?? entries.desc ?? "").toString().trim();
        if (!description) return null;
        const sortRaw = entries.sort ?? entries.sortorder ?? entries.order ?? entries[""] ?? 0;
        const order = Number.isFinite(Number(sortRaw)) ? Number(sortRaw) : 0;
        const statusVal = (entries.status ?? entries.isactive ?? "").toString().toLowerCase();
        const isActive = statusVal
          ? !(statusVal.startsWith("in") || statusVal.startsWith("f") || statusVal === "0")
          : true;
        return { name, description, order, isActive };
      })
      .filter(Boolean) as Partial<Category>[];

    if (!normalized.length) {
      throw new Error("No valid rows to import");
    }

    const seen = new Set<string>(beforeNames);
    const deduped = normalized.filter((item) => {
      const key = item.name?.toLowerCase() ?? "";
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!deduped.length) {
      throw new Error("All rows are duplicates of existing categories");
    }

    let success = 0;
    let failed = 0;
    const failures: Array<{ payload: Partial<Category>; error: unknown }> = [];
    const createdNames: string[] = [];

    for (const payload of deduped) {
      try {
        console.info("Import category create attempt", payload);
        const created = await categoriesApi.create(payload);
        if ((created as any)?.id) {
          success += 1;
          if (payload.name) createdNames.push(payload.name);
          console.info("Import category created response", created);
        } else {
          failed += 1;
          failures.push({ payload, error: "Missing id in response" });
          console.error("Import category missing id response", created);
        }
      } catch (err) {
        failed += 1;
        failures.push({ payload, error: err });
        console.error("Import category failed", payload, err);
      }
    }

    const afterList = await categoriesApi.list(true);
    const afterNames = afterList.map((c) => c.name.toLowerCase());
    await qc.invalidateQueries({ queryKey: ["categories"] });
    const skipped = normalized.length - deduped.length;
    const delta = afterList.length - beforeCount;
    const actuallyAdded = afterNames.filter((n) => !beforeNames.includes(n)).length;

    if (success) {
      toast.success(
        `Imported ${success} categories${skipped > 0 ? ` (skipped ${skipped} duplicates)` : ""}${
          failed ? ` (${failed} failed)` : ""
        }. Actual added: ${Math.max(delta, 0)} (unique new: ${actuallyAdded})`,
      );
      console.info("Category import created:", createdNames);
    }
    if (failed) {
      console.error("Category import failures", failures);
      toast.error(`Some imports failed (${failed}). See console for details.`);
    }
    if (!success) {
      throw new Error("No categories were imported");
    }
  };

  const columns: DataTableColumn<Category>[] = [
    {
      key: "name",
      header: "*Name",
      width: 320,
      input: (value, onChange) => (
        <input
          className="table-input"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Name"
        />
      ),
    },
    {
      key: "description",
      header: "*Description",
      width: undefined,
      input: (value, onChange) => (
        <input
          className="table-input"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Description"
        />
      ),
      render: (row) => row.description ?? "",
    },
    {
      key: "order",
      header: "*Order",
      width: 125,
      input: (value, onChange) => (
        <input
          className="table-input"
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder="0"
        />
      ),
      render: (row) => row.order ?? 0,
    },
    {
      key: "isActive",
      header: "Status",
      width: 125,
      filterLabel: (val) => (val ? "Active" : "Inactive"),
      render: (row) => (row.isActive ? "Active" : "Inactive"),
    },
  ];

  const validateNewCategory = (draft: Partial<Category>) => {
    if (!draft.name || !draft.name.trim()) return "Name is required.";
    if (!draft.description || !draft.description.trim()) return "Description is required.";
    if (draft.order === undefined || draft.order === null || Number.isNaN(Number(draft.order))) {
      return "Order is required.";
    }
    return null;
  };

  return (
    <div className="card">
      <DataTable<Category>
        title="Categories"
        badge={categories.data?.length ?? 0}
        columns={columns}
        rows={categories.data ?? []}
        selectedId={selectedCategory}
        getRowId={(row) => row.id}
        onSelect={(id) => onSelect(id)}
        onSave={(id, changes) => editCategory.mutate({ id, payload: changes })}
        onDelete={(id) => deleteCategory.mutate(id)}
        getDeleteConfirm={async (row) => {
          const summary = await categoriesApi.deleteSummary(row.id);
          const attrs = summary.attributes ? ` and ${summary.attributes} attributes` : "";
          return {
            title: `Delete category "${row.name}"?`,
            description: `This will permanently delete ${summary.subcategories} subcategories and ${summary.options} options${attrs}. This cannot be undone.`,
          };
        }}
        onCreate={(data) => createCategory.mutate(data)}
        getIsActive={(row) => row.isActive}
        onToggleActive={toggleCategory}
        onImport={importCategories}
        isLoading={categories.isLoading}
        error={categories.error ? String(categories.error) : undefined}
        newRowDefaults={{ order: 0, isActive: true }}
        validateCreate={validateNewCategory}
      />
    </div>
  );
}
