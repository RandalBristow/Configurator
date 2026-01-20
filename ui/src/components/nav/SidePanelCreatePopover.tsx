import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

type Props = {
  entityLabel: string;
  disabled?: boolean;
  onCreate: (payload: { name: string; description?: string }) => Promise<void>;
};

export function SidePanelCreatePopover({ entityLabel, disabled, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const nameId = useId();
  const descriptionId = useId();

  const canCreate = useMemo(() => name.trim().length > 0, [name]);
  const buttonLabel = `New ${entityLabel}`;

  const resetFields = useCallback(() => {
    setName("");
    setDescription("");
  }, []);

  const closePopover = useCallback(() => {
    setOpen(false);
    resetFields();
  }, [resetFields]);

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
      if (isSubmitting) return;
      const node = containerRef.current;
      if (!node) return;
      if (!node.contains(event.target as Node)) {
        closePopover();
        buttonRef.current?.focus();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isSubmitting) return;
      closePopover();
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, closePopover, isSubmitting]);

  const handleToggle = () => {
    if (open) {
      closePopover();
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
      });
      closePopover();
    } catch {
      // Keep the popover open on failure.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sidepanel-create" ref={containerRef}>
      <button
        ref={buttonRef}
        className={`sidepanel-action-btn${open ? " is-open" : ""}`}
        type="button"
        onClick={handleToggle}
        disabled={disabled || isSubmitting}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        <Plus size={16} />
      </button>

      {open ? (
        <div className="sidepanel-popover" role="dialog" aria-label={`Create ${entityLabel}`}>
          <form className="sidepanel-popover__form" onSubmit={handleSubmit}>
            <div className="sidepanel-popover__field">
              <label className="sidepanel-popover__label" htmlFor={nameId}>
                Name<span className="sidepanel-popover__required">*</span>
              </label>
              <input
                ref={nameInputRef}
                id={nameId}
                className="table-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="sidepanel-popover__actions">
              <button
                className="btn secondary small-btn"
                type="button"
                onClick={closePopover}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn primary small-btn"
                type="submit"
                disabled={!canCreate || isSubmitting}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
