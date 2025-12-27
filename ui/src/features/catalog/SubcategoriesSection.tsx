import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, subcategoriesApi } from "../../api/entities";
import { DataTable, type DataTableColumn } from "../../components/table/_DataTable";
import type { Subcategory } from "../../types/domain";
import { toast } from "sonner";

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
  const categoriesList = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => categoriesApi.list(true),
  });
  const subcategories = useQuery({
    queryKey: ["subcategories", categoryId, "all"],
    queryFn: () => subcategoriesApi.list(categoryId, true),
    enabled: true,
  });

  const createSubcategory = useMutation({
    mutationFn: (data: Partial<Subcategory>) => subcategoriesApi.create(data),
    onSuccess: (created) => {
      // Update the cache for the current category view immediately
      if (categoryId) {
        qc.setQueryData<Subcategory[]>(["subcategories", categoryId, "all"], (prev) =>
          prev ? [...prev, created] : [created],
        );
      }
      // Invalidate all subcategory queries to keep other views in sync
      qc.invalidateQueries({ queryKey: ["subcategories"], exact: false });
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

  const categoriesOptions = categoriesList.data ?? [];

  const columns: DataTableColumn<Subcategory>[] = [
    {
      key: "categoryId",
      header: "*Category",
      width: 200,
      render: (row) => categoriesOptions.find((c) => c.id === row.categoryId)?.name ?? "Unknown",
      exportValue: (row) => categoriesOptions.find((c) => c.id === row.categoryId)?.name ?? "",
      input: (value, onChange) => (
        <select
          className="table-input"
          value={value ?? categoryId ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">Select category</option>
          {categoriesOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      ),
    },
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
      key: "sortOrder",
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
      render: (row) => row.sortOrder ?? 0,
    },
    {
      key: "isActive",
      header: "Status",
      width: 125,
      filterLabel: (val) => (val ? "Active" : "Inactive"),
      render: (row) => (row.isActive ? "Active" : "Inactive"),
    },
  ];

  const importSubcategories = async (records: Partial<Subcategory>[]) => {
    if (!categoriesOptions.length) throw new Error("Categories not loaded");

    const normalized = records
      .map((r) => {
        const entries = Object.entries(r).reduce<Record<string, any>>((acc, [k, v]) => {
          acc[k.toLowerCase()] = v;
          return acc;
        }, {});
        const name = (entries.name ?? entries[""] ?? "").toString().trim();
        if (!name) return null;
        const description = (entries.description ?? entries.desc ?? "").toString().trim() || undefined;
        const sortRaw = entries.sort ?? entries.sortorder ?? entries.order ?? entries[""] ?? 0;
        const sortOrder = Number.isFinite(Number(sortRaw)) ? Number(sortRaw) : 0;
        const statusVal = (entries.status ?? entries.isactive ?? "").toString().toLowerCase();
        const isActive = statusVal
          ? !(statusVal.startsWith("in") || statusVal.startsWith("f") || statusVal === "0")
          : true;
        const catName = (entries.category ?? entries.categoryname ?? entries.cat ?? "").toString().toLowerCase();
        let catId = entries.categoryid ?? entries.category_id;
        if (!catId && catName) {
          const match = categoriesOptions.find((c) => c.name.toLowerCase() === catName);
          catId = match?.id;
        }
        if (!catId) return null;
        return { name, description, sortOrder, isActive, categoryId: String(catId) };
      })
      .filter(Boolean) as Partial<Subcategory>[];

    if (!normalized.length) throw new Error("No valid rows to import");

    const existing =
      subcategories.data ??
      (categoryId ? await subcategoriesApi.list(categoryId, true) : await subcategoriesApi.list(undefined, true));
    const seen = new Set(existing.map((s) => `${s.categoryId.toLowerCase()}::${s.name.toLowerCase()}`));
    const deduped = normalized.filter((item) => {
      const key = `${item.categoryId?.toLowerCase() ?? ""}::${item.name?.toLowerCase() ?? ""}`;
      if (!item.categoryId || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!deduped.length) throw new Error("All rows are duplicates or missing category");

    let success = 0;
    let failed = 0;
    for (const payload of deduped) {
      try {
        await subcategoriesApi.create(payload);
        success += 1;
      } catch (err) {
        failed += 1;
        console.error("Import subcategory failed", payload, err);
      }
    }
    await qc.invalidateQueries({ queryKey: ["subcategories"] });
    if (success) toast.success(`Imported ${success} subcategories${failed ? ` (${failed} failed)` : ""}`);
    if (!success) throw new Error("No subcategories were imported");
  };

  return (
    <div className="card">
      <DataTable<Subcategory>
        title="Subcategories"
        badge={subcategories.data?.length ?? 0}
        columns={columns}
        rows={subcategories.data ?? []}
        selectedId={selectedSubcategory}
        getRowId={(row) => row.id}
        onSelect={(id) => onSelect(id)}
        onSave={(id, changes) => editSubcategory.mutate({ id, payload: changes })}
        onDelete={(id) => deleteSubcategory.mutate(id)}
        getDeleteConfirm={async (row) => {
          const summary = await subcategoriesApi.deleteSummary(row.id);
          const attrs = summary.attributes ? ` and ${summary.attributes} attributes` : "";
          return {
            title: `Delete subcategory "${row.name}"?`,
            description: `This will permanently delete ${summary.options} options${attrs}. This cannot be undone.`,
          };
        }}
        onCreate={(data) => createSubcategory.mutate({ ...data, categoryId: data.categoryId ?? categoryId })}
        getIsActive={(row) => row.isActive}
        onToggleActive={(id, next) =>
          next ? activateSubcategory.mutate(id) : editSubcategory.mutate({ id, payload: { isActive: false } })
        }
        onImport={importSubcategories}
        isLoading={subcategories.isLoading || categoriesList.isLoading}
        error={subcategories.error ? String(subcategories.error) : undefined}
        newRowDefaults={{ categoryId, sortOrder: 0, isActive: true }}
        validateCreate={(draft) => {
          if (!draft.categoryId) return "Category is required.";
          if (!draft.name || !String(draft.name).trim()) return "Name is required.";
          if (!draft.description || !String(draft.description).trim()) return "Description is required.";
          if (draft.sortOrder === undefined || draft.sortOrder === null || Number.isNaN(Number(draft.sortOrder))) {
            return "Order is required.";
          }
          return null;
        }}
      />
      {subcategories.error && <div className="error">{String(subcategories.error)}</div>}
    </div>
  );
}
