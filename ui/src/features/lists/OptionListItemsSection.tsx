import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { optionListItemsApi } from "../../api/entities";
import { OptionListItemsForm } from "../../components/forms/OptionListItemsForm";
import { List } from "../../components/List";
import type { OptionListItem } from "../../types/domain";

type Props = {
  showInactive: boolean;
  optionListId?: string;
};

export function OptionListItemsSection({ showInactive, optionListId }: Props) {
  const qc = useQueryClient();
  const optionListItems = useQuery({
    queryKey: ["option-list-items", optionListId, showInactive],
    queryFn: () => optionListItemsApi.list(optionListId, showInactive),
    enabled: !!optionListId,
  });

  const createOptionListItem = useMutation({
    mutationFn: (data: Partial<OptionListItem>) => optionListItemsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["option-list-items"] }),
  });

  const editOptionListItem = useMutation({
    mutationFn: (data: { id: string; payload: Partial<OptionListItem> }) =>
      optionListItemsApi.update(data.id, data.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["option-list-items"] }),
  });

  const deleteOptionListItem = useMutation({
    mutationFn: (id: string) => optionListItemsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["option-list-items"] }),
  });

  return (
    <div className="card">
      <div className="card-head">
        <h2>Option List Items</h2>
        <span className="tag">{optionListItems.data?.length ?? 0}</span>
      </div>
      <OptionListItemsForm
        disabled={!optionListId}
        optionListId={optionListId}
        onSubmit={createOptionListItem.mutate}
        loading={createOptionListItem.isPending}
      />
      <List<OptionListItem>
        items={optionListItems.data ?? []}
        selectedId={undefined}
        onSelect={() => undefined}
        onDelete={(id) => deleteOptionListItem.mutate(id)}
        onEdit={(item) => {
          const label = prompt("Label", item.label);
          if (!label) return;
          const value = prompt("Value", item.value);
          if (!value) return;
          const sortOrderRaw = prompt("Sort order", String(item.sortOrder ?? 0));
          const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : item.sortOrder ?? 0;
          editOptionListItem.mutate({ id: item.id, payload: { label, value, sortOrder } });
        }}
        render={(item) => (
          <>
            <div>
              <div>
                {item.label} <span className="muted">({item.value})</span>
              </div>
              <div className="muted">Sort: {item.sortOrder ?? 0}</div>
            </div>
            {!item.isActive && <span className="tag">inactive</span>}
          </>
        )}
      />
      {!optionListId && <div className="muted">Select an option list to manage items.</div>}
      {optionListItems.error && <div className="error">{String(optionListItems.error)}</div>}
    </div>
  );
}
