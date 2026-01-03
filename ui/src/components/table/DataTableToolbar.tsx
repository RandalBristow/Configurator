import { Clipboard, Copy, Eraser, Trash2, Upload, RefreshCcw } from "lucide-react";
import { ToolbarButton, ToolbarDivider, ToolbarFileButton } from "../ui/ToolbarButton";

type Props = {
  selectedCount: number;
  rowCount?: number;
  canReset: boolean;
  disabled?: boolean;

  onImportClipboard: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onClearSelection: () => void;
  onCopySelected: () => void;
  onDeleteSelected: () => void;

  onReset: () => void;
};

export function DataTableToolbar({
  selectedCount,
  rowCount,
  canReset,
  disabled,
  onImportClipboard,
  onImportFile,
  onClearSelection,
  onCopySelected,
  onDeleteSelected,
  onReset,
}: Props) {
  const hasSelection = selectedCount > 0;
  const allDisabled = Boolean(disabled);
  const formattedRows = typeof rowCount === "number" ? rowCount.toLocaleString() : null;
  const formattedSelected = selectedCount ? selectedCount.toLocaleString() : null;

  return (
    <div className="selection-bar">
      <div className="selection-bar__actions">
        <ToolbarButton
          title="Refresh table"
          onClick={onReset}
          disabled={!canReset || allDisabled}
          icon={<RefreshCcw size={14} />}
          label="Refresh"
        />

        <ToolbarDivider />

        <ToolbarButton
          title="Import from clipboard"
          onClick={onImportClipboard}
          disabled={allDisabled}
          icon={<Clipboard size={14} />}
          label="Paste"
        />

        <ToolbarFileButton
          title="Import from file"
          disabled={allDisabled}
          icon={<Upload size={14} />}
          label="Import"
          accept=".csv,text/plain"
          onChange={onImportFile}
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
          title="Delete selected rows"
          onClick={onDeleteSelected}
          disabled={!hasSelection || allDisabled}
          icon={<Trash2 size={14} />}
          label="Delete"
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
