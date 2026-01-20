import type { ReactNode } from "react";

export type RailItem =
  | {
      type: "item";
      id: string;
      label: string;
      icon: ReactNode;
      disabled?: boolean;
      badge?: string | number;
    }
  | {
      type: "separator";
      id: string;
    };

type RailNavItem = Extract<RailItem, { type: "item" }>;

type Props = {
  topItem?: RailNavItem;
  items: RailItem[];
  activeId?: string;
  onSelect: (id: string) => void;
};

export function RailNav({ topItem, items, activeId, onSelect }: Props) {
  return (
    <div className="rail-nav" role="navigation" aria-label="Primary">
      {topItem && (
        <button
          type="button"
          className={`rail-item ${topItem.id === activeId ? "active" : ""}`}
          aria-pressed={topItem.id === activeId}
          aria-label={topItem.label}
          title={topItem.label}
          disabled={topItem.disabled}
          onClick={() => onSelect(topItem.id)}
        >
          {topItem.icon}
          {topItem.badge !== undefined && (
            <span className="rail-badge" aria-hidden="true">
              {topItem.badge}
            </span>
          )}
        </button>
      )}

      <div className="rail-items">
        {items.map((item) => {
          if (item.type === "separator") {
            return (
              <div
                key={item.id}
                className="rail-divider"
                role="separator"
                aria-orientation="horizontal"
              />
            );
          }
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={`rail-item ${isActive ? "active" : ""}`}
              aria-pressed={isActive}
              aria-label={item.label}
              title={item.label}
              disabled={item.disabled}
              onClick={() => onSelect(item.id)}
            >
              {item.icon}
              {item.badge !== undefined && (
                <span className="rail-badge" aria-hidden="true">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
