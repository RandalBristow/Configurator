// @ts-nocheck
import React from "react";
import { createPortal } from "react-dom";

type Item =
  | {
      kind?: "item";
      label: string;
      icon?: React.ReactNode;
      shortcut?: string;
      disabled?: boolean;
      onSelect?: () => void;
    }
  | { kind: "separator" };

type Props = {
  open: boolean;
  x: number;
  y: number;
  items: Item[];
  onClose: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function DesignerContextMenu({ open, x, y, items, onClose }: Props) {
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState({ x, y });

  React.useEffect(() => {
    if (!open) return;
    setPos({ x, y });
  }, [open, x, y]);

  React.useLayoutEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const padding = 8;
    const nextX = clamp(pos.x, padding, window.innerWidth - rect.width - padding);
    const nextY = clamp(pos.y, padding, window.innerHeight - rect.height - padding);
    if (nextX !== pos.x || nextY !== pos.y) {
      setPos({ x: nextX, y: nextY });
    }
  }, [open, pos.x, pos.y, items?.length]);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const menu = menuRef.current;
      if (!menu) return;
      if (e.target instanceof Node && menu.contains(e.target)) return;
      onClose();
    };

    const handleScroll = () => onClose();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    // Close on scroll anywhere (including scrollable containers).
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="designer-context-menu-overlay"
      onContextMenu={(e) => {
        // Prevent the native menu when right-clicking on our menu overlay.
        e.preventDefault();
        onClose();
      }}
    >
      <div
        ref={menuRef}
        className="designer-context-menu"
        role="menu"
        style={{ left: pos.x, top: pos.y }}
      >
        {items.map((item, index) => {
          if (item.kind === "separator") {
            return <div key={`sep-${index}`} className="designer-context-menu__sep" />;
          }
          const disabled = item.disabled === true;
          return (
            <button
              key={`${item.label}-${index}`}
              type="button"
              className="designer-context-menu__item"
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (disabled) return;
                item.onSelect?.();
                onClose();
              }}
            >
              <span className="designer-context-menu__icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.shortcut ? (
                <span className="designer-context-menu__shortcut">
                  {item.shortcut}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

