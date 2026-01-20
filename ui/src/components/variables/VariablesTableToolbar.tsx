import { Copy, Eraser, RefreshCcw, Trash2 } from "lucide-react";
import { ToolbarButton, ToolbarDivider } from "../ui/ToolbarButton";

type Props = {
  selectedCount: number;
  rowCount?: number;
  disabled?: boolean;
  variant?: "default" | "compact";
  onReset: () => void;
  onClearSelection: () => void;
  onCopySelected: () => void;
  onDeactivateSelected: () => void;
};

export function VariablesTableToolbar({
  selectedCount,
  rowCount,
  disabled,
  variant = "default",
  onReset,
  onClearSelection,
  onCopySelected,
  onDeactivateSelected,
}: Props) {
  const hasSelection = selectedCount > 0;
  const allDisabled = Boolean(disabled);
  const formattedRows = typeof rowCount === "number" ? rowCount.toLocaleString() : null;
  const formattedSelected = selectedCount ? selectedCount.toLocaleString() : null;
  const className = variant === "compact" ? "selection-bar selection-bar--compact" : "selection-bar";

  return (
    <div className={className}>
      <div className="selection-bar__actions">
        <ToolbarButton
          title="Refresh table"
          onClick={onReset}
          disabled={allDisabled}
          icon={<RefreshCcw size={14} />}
          label="Refresh"
        />

        <ToolbarDivider />

        <ToolbarButton
          title="Clear selection"
          onClick={onClearSelection}
          disabled={!hasSelection || allDisabled}
          icon={<Eraser size={14} />}
          label="Clear"
        />

        <ToolbarButton
          title="Copy selected rows"
          onClick={onCopySelected}
          disabled={!hasSelection || allDisabled}
          icon={<Copy size={14} />}
          label="Copy"
        />

        <ToolbarButton
          title="Deactivate selected rows"
          onClick={onDeactivateSelected}
          disabled={!hasSelection || allDisabled}
          icon={<Trash2 size={14} />}
          label="Deactivate"
        />
      </div>

      {formattedRows !== null && (
        <div className="selection-bar__meta">
          <span className="selection-bar__meta-item">Rows: {formattedRows}</span>
          {formattedSelected !== null && (
            <span className="selection-bar__meta-item">Selected: {formattedSelected}</span>
          )}
        </div>
      )}
    </div>
  );
}
