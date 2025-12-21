import { useMemo, useState } from "react";

export type EditableColumn<T> = {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  input?: (value: any, onChange: (val: any) => void) => React.ReactNode;
  align?: "left" | "center" | "right";
};

type InlineEditTableProps<T> = {
  columns: EditableColumn<T>[];
  rows: T[];
  selectedId?: string;
  getRowId: (row: T) => string;
  onSelect?: (id: string) => void;
  onSave: (id: string, changes: Partial<T>) => void;
  onDelete: (id: string) => void;
  onCreate: (data: Partial<T>) => void;
  onActivate?: (id: string) => void;
  isLoading?: boolean;
  error?: string;
};

export function InlineEditTable<T>({
  columns,
  rows,
  selectedId,
  getRowId,
  onSelect,
  onSave,
  onDelete,
  onCreate,
  onActivate,
  isLoading,
  error,
}: InlineEditTableProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, any>>>({});
  const [newRowDraft, setNewRowDraft] = useState<Record<string, any>>({});

  const editableKeys = useMemo(
    () => columns.filter((c) => c.input).map((c) => c.key as string),
    [columns],
  );

  const startEdit = (id: string, row: T) => {
    const initial: Record<string, any> = {};
    editableKeys.forEach((key) => {
      initial[key] = (row as any)[key];
    });
    setDrafts((prev) => ({ ...prev, [id]: initial }));
    setEditingId(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const updateDraft = (id: string, key: string, value: any) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [key]: value },
    }));
  };

  const updateNewDraft = (key: string, value: any) => {
    setNewRowDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (id: string) => {
    const draft = drafts[id] ?? {};
    onSave(id, draft as Partial<T>);
    setEditingId(null);
  };

  const handleCreate = () => {
    onCreate(newRowDraft as Partial<T>);
    setNewRowDraft({});
  };

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} style={col.width ? { width: col.width } : undefined} className={col.align}>
                {col.header}
              </th>
            ))}
            <th style={{ width: "190px" }} className="center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = getRowId(row);
            const isEditing = editingId === id;
            const draft = drafts[id] ?? {};
            return (
              <tr
                key={id}
                className={selectedId === id ? "is-selected" : undefined}
                onClick={() => onSelect?.(id)}
              >
                {columns.map((col) => {
                  const key = col.key as string;
                  const value = isEditing ? draft[key] : (row as any)[key];
                  return (
                    <td key={String(col.key)} className={col.align}>
                      {isEditing && col.input
                        ? col.input(value, (val) => updateDraft(id, key, val))
                        : col.render
                          ? col.render(row)
                          : value ?? ""}
                    </td>
                  );
                })}
                <td className="actions-cell center">
                  {isEditing ? (
                    <div className="table-actions">
                      <button className="btn small-btn" onClick={(e) => { e.stopPropagation(); handleSave(id); }}>
                        Save
                      </button>
                      <button className="btn secondary small-btn" onClick={(e) => { e.stopPropagation(); cancelEdit(); }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="table-actions">
                      <button className="btn secondary small-btn" onClick={(e) => { e.stopPropagation(); startEdit(id, row); }}>
                        Edit
                      </button>
                      <button className="btn secondary small-btn" onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
                        Delete
                      </button>
                      {onActivate && (
                        <button className="btn secondary small-btn" onClick={(e) => { e.stopPropagation(); onActivate(id); }}>
                          Activate
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          <tr className="new-row">
            {columns.map((col) => {
              const key = col.key as string;
              const value = newRowDraft[key];
              return (
                <td key={`new-${key}`} className={col.align}>
                  {col.input
                    ? col.input(value, (val) => updateNewDraft(key, val))
                    : null}
                </td>
              );
            })}
            <td className="actions-cell center">
              <button className="btn small-btn" onClick={(e) => { e.stopPropagation(); handleCreate(); }}>
                Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {isLoading && <div className="muted">Loading...</div>}
      {error && <div className="error">{error}</div>}
      {!rows.length && !isLoading && <div className="muted">No records yet.</div>}
    </div>
  );
}
