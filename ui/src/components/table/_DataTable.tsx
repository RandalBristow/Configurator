import { useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Filter } from "lucide-react";

import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { DataTableToolbar } from "./_DataTableToolbar";
import { ColumnFilterPopover, type ColumnFilterDraft, type ColumnFilterMenu, type ColumnFilterOption } from "./DataTableColumnFilterPopover";

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  width?: number;
  align?: "left" | "center" | "right";
  type?: "string" | "number" | "boolean";
  filterLabel?: (value: any, row?: T) => string;
  render?: (value: any, row: T) => React.ReactNode;
};

type Props<T extends Record<string, any>> = {
  title?: string;
  description?: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;

  allowPagination?: boolean;
  pageSizeOptions?: number[];
};

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  columns,
  rows,
  getRowId,
  allowPagination = true,
  pageSizeOptions = [10, 20, 50, 100],
}: Props<T>) {
  const tableRef = useRef<HTMLTableElement | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

  const [filterMenu, setFilterMenu] = useState<ColumnFilterMenu | null>(null);

  const colById = useMemo(() => {
    const map = new Map<string, DataTableColumn<T>>();
    for (const c of columns) map.set(String(c.key), c);
    return map;
  }, [columns]);

  const columnDefs = useMemo<ColumnDef<T>[]>(() => {
    return columns.map((col) => {
      const id = String(col.key);
      return {
        id,
        accessorFn: (row) => (row as any)[id],
        header: col.header,
        cell: (ctx) => {
          const v = ctx.getValue();
          return col.render ? col.render(v, ctx.row.original) : String(v ?? "");
        },
        filterFn: (row, columnId, filterValue: any) => {
          const raw = row.getValue(columnId);

          const text = (filterValue?.text ?? "").toString().toLowerCase().trim();
          const values: string[] = Array.isArray(filterValue?.values) ? filterValue.values : [];

          // Value checkboxes: if any selected, raw must match one
          if (values.length) {
            const rawStr = String(raw ?? "");
            if (!values.includes(rawStr)) return false;
          }

          // Text contains: match label (if provided) or raw string
          if (text) {
            const cfg = colById.get(columnId);
            const label = cfg?.filterLabel ? cfg.filterLabel(raw, row.original) : String(raw ?? "");
            return label.toLowerCase().includes(text);
          }

          return true;
        },
      };
    });
  }, [columns, colById]);

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getRowId: (row) => getRowId(row),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: pageSizeOptions[0] ?? 10 },
    },
  });

  const closeFilterMenu = () => setFilterMenu(null);

  const buildFilterOptionsForColumn = (colId: string): ColumnFilterOption[] => {
    const cfg = colById.get(colId);
    const uniques = new Map<string, string>();

    // Use prefiltered rows so values aren't already constrained by that same column
    const allRows = table.getPreFilteredRowModel().rows;

    for (const r of allRows) {
      const raw = r.getValue(colId);
      const value = String(raw ?? "");
      if (uniques.has(value)) continue;
      const label = cfg?.filterLabel ? cfg.filterLabel(raw, r.original) : value;
      uniques.set(value, label);
    }

    return Array.from(uniques.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const openFilterForColumn = (colId: string, title: string, e: React.MouseEvent) => {
    const col = table.getColumn(colId);
    if (!col) return;

    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = r.left;
    const y = r.bottom + 6;

    const current = (col.getFilterValue() as any) ?? {};
    const draft: ColumnFilterDraft = {
      text: String(current.text ?? ""),
      values: Array.isArray(current.values) ? current.values : [],
    };

    setFilterMenu({
      colId,
      title,
      position: { x, y },
      values: buildFilterOptionsForColumn(colId),
      draft,
    });
  };

  const applyFilterDraft = (draft: ColumnFilterDraft) => {
    if (!filterMenu) return;

    const col = table.getColumn(filterMenu.colId);
    if (!col) return;

    const text = (draft.text ?? "").trim();
    const values = Array.isArray(draft.values) ? draft.values : [];

    if (!text && values.length === 0) col.setFilterValue(undefined);
    else col.setFilterValue({ text, values });

    closeFilterMenu();
  };

  return (
    <div className="data-table">
      {(title || description) && (
        <div style={{ marginBottom: 10 }}>
          {title && <div style={{ fontWeight: 700, fontSize: 18 }}>{title}</div>}
          {description && <div className="muted">{description}</div>}
        </div>
      )}

      <DataTableToolbar
        pageSize={table.getState().pagination.pageSize}
        pageSizeOptions={pageSizeOptions}
        allowPagination={allowPagination}
        onPageSizeChange={(size) => table.setPagination({ pageIndex: 0, pageSize: size })}
      />

      <div style={{ position: "relative" }}>
        <table ref={tableRef} className="table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const colId = header.column.id;
                  return (
                    <th key={header.id}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                        <button
                          className="icon-btn"
                          type="button"
                          title="Filter"
                          onClick={(e) =>
                            openFilterForColumn(
                              colId,
                              typeof header.column.columnDef.header === "string"
                                ? (header.column.columnDef.header as string)
                                : colId,
                              e,
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id}>
                {r.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {filterMenu && (
          <ColumnFilterPopover
            menu={filterMenu}
            onClose={closeFilterMenu}
            onApply={applyFilterDraft}
          />
        )}
      </div>

      {allowPagination && (
        <div className="table-pagination" style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
          <div className="muted small">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn secondary small-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Prev
            </button>
            <button className="btn secondary small-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null);
          }}
          onConfirm={() => {
            const action = confirmDialog.onConfirm;
            setConfirmDialog(null);
            action();
          }}
        />
      )}
    </div>
  );
}
