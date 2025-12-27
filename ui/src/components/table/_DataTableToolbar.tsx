import { Clipboard, Copy, Upload } from "lucide-react";

type Props = {
  importing?: boolean;
  allowPagination?: boolean;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (size: number) => void;

  onImportClipboard?: () => void;
  onImportFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyToClipboard?: () => void;
  onExportCSV?: () => void;
  onExportXLSX?: () => void;
};

export function DataTableToolbar({
  importing,
  allowPagination,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onImportClipboard,
  onImportFile,
  onCopyToClipboard,
  onExportCSV,
  onExportXLSX,
}: Props) {
  return (
    <div className="table-toolbar">
      <div className="table-toolbar__left">
        {onImportClipboard && (
          <button className="icon-btn" title="Paste from clipboard" onClick={onImportClipboard}>
            <Clipboard size={16} />
          </button>
        )}

        {onImportFile && (
          <label className="icon-btn" title="Import file">
            <Upload size={16} />
            <input
              type="file"
              accept=".csv,text/plain"
              onChange={onImportFile}
              style={{ display: "none" }}
            />
          </label>
        )}

        {onCopyToClipboard && (
          <button className="icon-btn" title="Copy table" onClick={onCopyToClipboard}>
            <Copy size={16} />
          </button>
        )}

        {onExportCSV && (
          <button className="btn secondary small-btn" onClick={onExportCSV}>
            Export CSV
          </button>
        )}

        {onExportXLSX && (
          <button className="btn secondary small-btn" onClick={onExportXLSX}>
            Export XLSX
          </button>
        )}
      </div>

      <div className="table-toolbar__right">
        <label className="muted small">Page size</label>
        <select
          className="table-input"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={importing || !allowPagination
          }
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
