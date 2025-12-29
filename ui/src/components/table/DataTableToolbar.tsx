import { Clipboard, Copy, Eraser, Trash2, Upload, RefreshCcw } from "lucide-react";

type Props = {
  selectedCount: number;
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

  return (
    <div className="selection-bar">
      <div className="selection-bar__actions">
        <button
          className="icon-btn"
          type="button"
          title="Refresh table"
          onClick={onReset}
          disabled={!canReset || allDisabled}
        >
          <RefreshCcw size={16} />
        </button>

        <div className="selection-bar__divider" />

        <button
          className="icon-btn"
          type="button"
          title="Import from clipboard"
          onClick={onImportClipboard}
          disabled={allDisabled}
        >
          <Clipboard size={16} />
        </button>

        <label className="icon-btn" title="Import from file" style={allDisabled ? { pointerEvents: "none", opacity: 0.6 } : undefined}>
          <Upload size={16} />
          <input
            type="file"
            accept=".csv,text/plain"
            onChange={onImportFile}
            style={{ display: "none" }}
          />
        </label>

        <div className="selection-bar__divider" />

        <button
          className="icon-btn"
          type="button"
          title="Clear selection"
          onClick={onClearSelection}
          disabled={!hasSelection || allDisabled}
        >
          <Eraser size={16} />
        </button>

        <button
          className="icon-btn"
          type="button"
          title="Copy selected rows"
          onClick={onCopySelected}
          disabled={!hasSelection || allDisabled}
        >
          <Copy size={16} />
        </button>

        <button
          className="icon-btn"
          type="button"
          title="Delete selected rows"
          onClick={onDeleteSelected}
          disabled={!hasSelection || allDisabled}
        >
          <Trash2 size={16} />
        </button>
      </div>

    </div>
  );
}
