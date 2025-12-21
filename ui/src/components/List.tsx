import type React from "react";

type ListProps<T extends { id: string }> = {
  items: T[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onActivate?: (id: string) => void;
  onEdit?: (item: T) => void;
  render: (item: T) => React.ReactNode;
};

export function List<T extends { id: string }>({
  items,
  selectedId,
  onSelect,
  onDelete,
  onActivate,
  onEdit,
  render,
}: ListProps<T>) {
  return (
    <div className="list">
      {items.map((item) => (
        <div
          key={item.id}
          className={`item ${selectedId === item.id ? "active" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          <div>{render(item)}</div>
          <div className="actions">
            <button
              className="btn secondary"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              Delete
            </button>
            {onEdit && (
              <button
                className="btn secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
              >
                Edit
              </button>
            )}
            {onActivate && (
              <button
                className="btn secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate(item.id);
                }}
              >
                Activate
              </button>
            )}
          </div>
        </div>
      ))}
      {!items.length && <div className="muted">No records yet.</div>}
    </div>
  );
}
