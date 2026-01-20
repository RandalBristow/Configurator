import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";

type Props = {
  entityLabel: string;
  name: string;
  description: string;
  disabled?: boolean;
  onChange: (payload: { name: string; description: string }) => void;
  onRequestOpen?: () => boolean | Promise<boolean>;
};

export function SidePanelEditPopover({
  entityLabel,
  name,
  description,
  disabled,
  onChange,
  onRequestOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const nameId = useId();
  const descriptionId = useId();

  const buttonLabel = useMemo(() => `Edit ${entityLabel}`, [entityLabel]);

  const closePopover = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      const node = containerRef.current;
      if (!node) return;
      if (!node.contains(event.target as Node)) {
        closePopover();
        buttonRef.current?.focus();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closePopover();
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, closePopover]);

  const handleToggle = useCallback(async () => {
    if (open) {
      closePopover();
      return;
    }
    if (disabled) return;
    if (onRequestOpen) {
      const allowed = await onRequestOpen();
      if (allowed === false) return;
    }
    setOpen(true);
  }, [open, closePopover, disabled, onRequestOpen]);

  return (
    <div className="sidepanel-edit" ref={containerRef}>
      <button
        ref={buttonRef}
        className={`nav-item__edit-btn${open ? " is-open" : ""}`}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={buttonLabel}
        title={buttonLabel}
        onClick={(event) => {
          event.stopPropagation();
          void handleToggle();
        }}
        disabled={disabled}
      >
        <Pencil size={14} />
      </button>

      {open ? (
        <div className="sidepanel-popover sidepanel-popover--wide" role="dialog" aria-label={`Edit ${entityLabel}`}>
          <div className="sidepanel-popover__form">
            <div className="sidepanel-popover__field">
              <label className="sidepanel-popover__label" htmlFor={nameId}>
                Name<span className="sidepanel-popover__required">*</span>
              </label>
              <input
                ref={nameInputRef}
                id={nameId}
                className="table-input"
                value={name}
                onChange={(e) => onChange({ name: e.target.value, description })}
                required
              />
            </div>

            <div className="sidepanel-popover__field">
              <label className="sidepanel-popover__label" htmlFor={descriptionId}>
                Description
              </label>
              <textarea
                id={descriptionId}
                className="table-input sidepanel-popover__textarea"
                value={description}
                onChange={(e) => onChange({ name, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="sidepanel-popover__actions">
              <button
                className="btn secondary small-btn"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closePopover();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
