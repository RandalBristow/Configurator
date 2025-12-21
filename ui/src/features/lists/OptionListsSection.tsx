import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { optionListsApi } from "../../api/entities";
import { OptionListsForm } from "../../components/forms/OptionListsForm";
import { List } from "../../components/List";
import type { OptionList } from "../../types/domain";

type Props = {
  showInactive: boolean;
  selectedOptionList?: string;
  onSelect: (id?: string) => void;
};

export function OptionListsSection({ showInactive, selectedOptionList, onSelect }: Props) {
  const qc = useQueryClient();
  const optionLists = useQuery({
    queryKey: ["option-lists", showInactive],
    queryFn: () => optionListsApi.list(),
  });

  const createOptionList = useMutation({
    mutationFn: (data: Partial<OptionList>) => optionListsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["option-lists"] }),
  });

  const editOptionList = useMutation({
    mutationFn: (data: { id: string; payload: Partial<OptionList> }) =>
      optionListsApi.update(data.id, data.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["option-lists"] }),
  });

  const deleteOptionList = useMutation({
    mutationFn: (id: string) => optionListsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["option-lists"] });
      qc.invalidateQueries({ queryKey: ["option-list-items"] });
      onSelect(undefined);
    },
  });

  return (
    <div className="card">
      <div className="card-head">
        <h2>Option Lists</h2>
        <span className="tag">{optionLists.data?.length ?? 0}</span>
      </div>
      <OptionListsForm onSubmit={createOptionList.mutate} loading={createOptionList.isPending} />
      <List<OptionList>
        items={optionLists.data ?? []}
        selectedId={selectedOptionList}
        onSelect={(id) => onSelect(id)}
        onDelete={(id) => deleteOptionList.mutate(id)}
        onEdit={(ol) => {
          const name = prompt("Name", ol.name);
          if (!name) return;
          const description = prompt("Description", ol.description ?? "") ?? ol.description;
          editOptionList.mutate({ id: ol.id, payload: { name, description } });
        }}
        render={(ol) => (
          <>
            <div>
              <div>{ol.name}</div>
              <div className="muted">{ol.description}</div>
            </div>
          </>
        )}
      />
      {optionLists.error && <div className="error">{String(optionLists.error)}</div>}
    </div>
  );
}
