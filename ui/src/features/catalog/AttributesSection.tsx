import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attributesApi, optionListsApi } from "../../api/entities";
import { AttributesForm } from "../../components/forms/AttributesForm";
import { List } from "../../components/List";
import type { Attribute } from "../../types/domain";

type Props = {
  showInactive: boolean;
  optionId?: string;
};

export function AttributesSection({ showInactive, optionId }: Props) {
  const qc = useQueryClient();
  const attributes = useQuery({
    queryKey: ["attributes", optionId, showInactive],
    queryFn: () => attributesApi.list(optionId, showInactive),
    enabled: !!optionId,
  });

  const optionLists = useQuery({
    queryKey: ["option-lists"],
    queryFn: () => optionListsApi.list(),
  });

  const createAttribute = useMutation({
    mutationFn: (data: Partial<Attribute>) => attributesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attributes"] }),
  });

  const editAttribute = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Attribute> }) =>
      attributesApi.update(data.id, data.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attributes"] }),
  });

  const deleteAttribute = useMutation({
    mutationFn: (id: string) => attributesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attributes"] }),
  });

  const activateAttribute = useMutation({
    mutationFn: (id: string) => attributesApi.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attributes"] }),
  });

  const dataTypes: Attribute["dataType"][] = useMemo(
    () => ["string", "number", "boolean", "enum", "range", "json"],
    [],
  );

  return (
    <div className="card">
      <div className="card-head">
        <h2>Attributes</h2>
        <span className="tag">{attributes.data?.length ?? 0}</span>
      </div>
      <AttributesForm
        disabled={!optionId}
        optionId={optionId}
        optionLists={optionLists.data ?? []}
        dataTypes={dataTypes}
        onSubmit={createAttribute.mutate}
        loading={createAttribute.isPending}
      />
      <List<Attribute>
        items={attributes.data ?? []}
        selectedId={undefined}
        onSelect={() => undefined}
        onDelete={(id) => deleteAttribute.mutate(id)}
        onActivate={(id) => activateAttribute.mutate(id)}
        onEdit={(attr) => {
          const label = prompt("Label", attr.label);
          if (!label) return;
          const key = prompt("Key", attr.key);
          if (!key) return;
          const sortOrderRaw = prompt("Sort order", String(attr.sortOrder ?? 0));
          const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : attr.sortOrder ?? 0;
          editAttribute.mutate({
            id: attr.id,
            payload: { label, key, sortOrder },
          });
        }}
        render={(attr) => (
          <>
            <div>
              <div>
                {attr.label} <span className="muted">({attr.key})</span>
              </div>
              <div className="muted">Type: {attr.dataType}</div>
            </div>
            {!attr.isActive && <span className="tag">inactive</span>}
          </>
        )}
      />
      {!optionId && <div className="muted">Select an option to manage attributes.</div>}
      {attributes.error && <div className="error">{String(attributes.error)}</div>}
    </div>
  );
}
