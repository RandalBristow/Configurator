import type React from "react";
import { Clipboard, Copy, Trash2, Upload, X } from "lucide-react";

type Props = {
  disabled?: boolean;
  hasSelection: boolean;
  onImportClipboard?: () => void;
  onImportFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSelection?: () => void;
  onCopySelected?: () => void;
  onDeleteSelected?: () => void;
};

export function GroupSetToolbar({
  disabled,
  hasSelection,
  onImportClipboard,
  onImportFile,
  onClearSelection,
  onCopySelected,
  onDeleteSelected,
}: Props) {
  const isDisabled = Boolean(disabled);
  const hasImportButtons = Boolean(onImportClipboard || onImportFile);
  const hasActionButtons = Boolean(onClearSelection || onCopySelected || onDeleteSelected);

  return (
    <div className="group-set-toolbar group-set-toolbar-icons">
      {onImportClipboard && (
        <button
          className="icon-plain"
          type="button"
          title="Import from clipboard"
          onClick={onImportClipboard}
          disabled={isDisabled}
        >
          <Clipboard size={18} />
        </button>
      )}

      {onImportFile && (
        <label
          className="icon-plain"
          title="Import from file"
          style={isDisabled ? { pointerEvents: "none", opacity: 0.5 } : undefined}
        >
          <Upload size={18} />
          <input
            type="file"
            accept=".csv,text/plain"
            onChange={onImportFile}
            style={{ display: "none" }}
          />
        </label>
      )}

      {hasImportButtons && hasActionButtons && <div className="group-set-toolbar-divider" />}

      {onClearSelection && (
        <button
          className="icon-plain"
          type="button"
          title="Clear selection"
          onClick={onClearSelection}
          disabled={isDisabled || !hasSelection}
        >
          <X size={18} />
        </button>
      )}

      {onCopySelected && (
        <button
          className="icon-plain"
          type="button"
          title="Copy selected rows"
          onClick={onCopySelected}
          disabled={isDisabled || !hasSelection}
        >
          <Copy size={18} />
        </button>
      )}

      {onDeleteSelected && (
        <button
          className="icon-plain"
          type="button"
          title="Delete selected rows"
          onClick={onDeleteSelected}
          disabled={isDisabled || !hasSelection}
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}
