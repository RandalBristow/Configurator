import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { optionsApi } from "../../api/entities";
import { OptionsForm } from "../../components/forms/OptionsForm";
import { List } from "../../components/List";
import type { Option } from "../../types/domain";

type Props = {
  showInactive: boolean;
  subcategoryId?: string;
  selectedOption?: string;
  onSelect: (id?: string) => void;
  onResetBelow: () => void;
};

export function OptionsSection({
  showInactive,
  subcategoryId,
  selectedOption,
  onSelect,
  onResetBelow,
}: Props) {
  const qc = useQueryClient();
  const options = useQuery({
    queryKey: ["options", subcategoryId, showInactive],
    queryFn: () => optionsApi.list(subcategoryId, showInactive),
    enabled: !!subcategoryId,
  });

  const createOption = useMutation({
    mutationFn: (data: Partial<Option>) => optionsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });

  const editOption = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Option> }) =>
      optionsApi.update(data.id, data.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });

  const deleteOption = useMutation({
    mutationFn: (id: string) => optionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["options"] });
      qc.invalidateQueries({ queryKey: ["attributes"] });
      onResetBelow();
    },
  });

  const activateOption = useMutation({
    mutationFn: (id: string) => optionsApi.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });

  return (
    <div className="card">
      <div className="card-head">
        <h2>Options</h2>
        <span className="tag">{options.data?.length ?? 0}</span>
      </div>
      <OptionsForm
        disabled={!subcategoryId}
        subcategoryId={subcategoryId}
        onSubmit={createOption.mutate}
        loading={createOption.isPending}
      />
      <List<Option>
        items={options.data ?? []}
        selectedId={selectedOption}
        onSelect={(id) => onSelect(id)}
        onDelete={(id) => deleteOption.mutate(id)}
        onActivate={(id) => activateOption.mutate(id)}
        onEdit={(opt) => {
          const name = prompt("Name", opt.name);
          if (!name) return;
          const code = prompt("Code", opt.code);
          if (!code) return;
          const description = prompt("Description", opt.description ?? "") ?? opt.description;
          const sortOrderRaw = prompt("Sort order", String(opt.sortOrder ?? 0));
          const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : opt.sortOrder ?? 0;
          editOption.mutate({
            id: opt.id,
            payload: { name, code, description, sortOrder },
          });
        }}
        render={(opt) => (
          <>
            <div>
              <div>
                {opt.name} <span className="muted">({opt.code})</span>
              </div>
              <div className="muted">Sort: {opt.sortOrder ?? 0}</div>
            </div>
            {!opt.isActive && <span className="tag">inactive</span>}
          </>
        )}
      />
      {!subcategoryId && <div className="muted">Select a subcategory to manage options.</div>}
      {options.error && <div className="error">{String(options.error)}</div>}
    </div>
  );
}
