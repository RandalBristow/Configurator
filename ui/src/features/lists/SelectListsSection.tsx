import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { selectListsApi } from "../../api/entities";
import type { SelectList } from "../../types/domain";

type Props = {
  showInactive: boolean;
  selectedSelectList?: string;
  onSelect: (id?: string) => void;
};

export function SelectListsSection({ showInactive, selectedSelectList, onSelect }: Props) {
  const qc = useQueryClient();
  const listsQuery = useQuery({
    queryKey: ["select-lists", showInactive],
    queryFn: () => selectListsApi.list(),
  });

  const [search, setSearch] = useState("");
  const [currentId, setCurrentId] = useState<string | undefined>(selectedSelectList);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => setCurrentId(selectedSelectList), [selectedSelectList]);

  const filteredLists = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return listsQuery.data ?? [];
    return (listsQuery.data ?? []).filter(
      (l) => l.name.toLowerCase().includes(term) || (l.description ?? "").toLowerCase().includes(term),
    );
  }, [listsQuery.data, search]);

  useEffect(() => {
    if (!currentId) {
      setName("");
      setDescription("");
      return;
    }
    const found = (listsQuery.data ?? []).find((l) => l.id === currentId);
    setName(found?.name ?? "");
    setDescription(found?.description ?? "");
  }, [currentId, listsQuery.data]);

  const createList = useMutation({
    mutationFn: (data: Partial<SelectList>) => selectListsApi.create(data),
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: ["select-lists"] });
      if ((created as any)?.id) {
        setCurrentId((created as any).id);
        onSelect((created as any).id);
      }
      toast.success(`Created "${created.name}"`);
    },
    onError: (err) => toast.error(`Create failed: ${String(err)}`),
  });

  const updateList = useMutation({
    mutationFn: (data: { id: string; payload: Partial<SelectList> }) =>
      selectListsApi.update(data.id, data.payload),
    onSuccess: async (_, vars) => {
      await qc.invalidateQueries({ queryKey: ["select-lists"] });
      toast.success(`Saved "${vars.payload.name ?? ""}"`);
    },
    onError: (err) => toast.error(`Update failed: ${String(err)}`),
  });

  const deleteList = useMutation({
    mutationFn: (id: string) => selectListsApi.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["select-lists"] });
      qc.invalidateQueries({ queryKey: ["select-list-items"] });
      setCurrentId(undefined);
      onSelect(undefined);
      toast.success("Select list deleted");
    },
    onError: (err) => toast.error(`Delete failed: ${String(err)}`),
  });

  const selected = (listsQuery.data ?? []).find((l) => l.id === currentId);
  const dirty = (selected?.name ?? "") !== name || (selected?.description ?? "") !== (description ?? "");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const confirmMsg = selected ? `Save changes to "${name}"?` : `Create new select list "${name}"?`;
    if (!window.confirm(confirmMsg)) return;
    if (selected) {
      updateList.mutate({ id: selected.id, payload: { name, description } });
    } else {
      createList.mutate({ name, description });
    }
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.name}"? This will remove its list items/groups.`)) return;
    deleteList.mutate(selected.id);
  };

  return (
    <div className="card">
      <div className="card-head spaced">
        <div className="table-title">
          <span className="table-badge">{listsQuery.data?.length ?? 0}</span>
          <h2>Select Lists</h2>
        </div>
      </div>

      <div className="select-list-toolbar">
        <div className="select-list-picker">
          <label className="muted small">Select list</label>
          <div className="picker-row">
            <input
              className="table-input"
              placeholder="Filter lists"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="table-input"
              value={currentId ?? ""}
              onChange={(e) => {
                const next = e.target.value || undefined;
                setCurrentId(next);
                onSelect(next);
              }}
            >
              <option value="">-- New select list --</option>
              {filteredLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="list-form grid-two">
        <div className="form-field">
          <label className="muted small">*Name</label>
          <input className="table-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        </div>
        <div className="form-field">
          <label className="muted small">Description</label>
          <input
            className="table-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
      </div>

      <div className="table-actions" style={{ marginTop: 10 }}>
        <button
          className="btn secondary"
          type="button"
          onClick={() => {
            setCurrentId(undefined);
            setName("");
            setDescription("");
            onSelect(undefined);
          }}
        >
          New
        </button>
        <button className="btn primary" type="button" onClick={handleSave} disabled={!name.trim() || !dirty}>
          Save
        </button>
        <button
          className="btn secondary"
          type="button"
          onClick={handleDelete}
          disabled={!selected || deleteList.isPending}
        >
          Delete
        </button>
      </div>

      {listsQuery.error && <div className="error">{String(listsQuery.error)}</div>}
    </div>
  );
}
