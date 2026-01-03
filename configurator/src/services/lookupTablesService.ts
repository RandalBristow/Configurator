import { createHash } from "crypto";
import type { LookupTableDataType, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { HttpError } from "../api/errors/httpError";
import {
  createLookupTable,
  createLookupTableColumn,
  createLookupTableRow,
  deleteLookupTable,
  deleteLookupTableColumn,
  deleteLookupTableRow,
  listLookupTableColumns,
  listLookupTableRows,
  listLookupTables,
  updateLookupTable,
  updateLookupTableColumn,
  updateLookupTableRow,
} from "../repositories/lookupTables";

type CellValue = string | number | boolean | null;

const isBlankRow = (values: Record<string, CellValue>) => {
  const allKeys = Object.keys(values);
  if (allKeys.length === 0) return true;
  return allKeys.every((k) => values[k] === null || values[k] === undefined);
};

const normalizeCellValue = (raw: unknown, dataType: LookupTableDataType): CellValue => {
  if (raw === undefined) return null;
  if (raw === null) return null;

  if (dataType === "boolean") {
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") return raw !== 0;
    if (typeof raw === "string") {
      const v = raw.trim().toLowerCase();
      if (!v) return null;
      if (["true", "1", "yes", "y"].includes(v)) return true;
      if (["false", "0", "no", "n"].includes(v)) return false;
      return null;
    }
    return null;
  }

  if (dataType === "number") {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const v = raw.trim();
      if (!v) return null;
      const num = Number(v);
      return Number.isFinite(num) ? num : null;
    }
    return null;
  }

  if (dataType === "datetime") {
    if (typeof raw === "string") {
      // Preserve raw string; rules engine can decide how to interpret.
      return raw;
    }
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.toISOString();
    return null;
  }

  // string: keep empty string distinct from null
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "boolean") return raw ? "true" : "false";
  return null;
};

const computeRowHash = (tableId: string, normalizedValuesByColumnId: Record<string, CellValue>) => {
  // Canonicalize by sorting keys; include nulls to enforce "full row" uniqueness.
  const keys = Object.keys(normalizedValuesByColumnId).sort();
  const canonical: Record<string, CellValue> = {};
  keys.forEach((k) => {
    canonical[k] = normalizedValuesByColumnId[k] ?? null;
  });
  const payload = JSON.stringify({ tableId, values: canonical });
  return createHash("sha256").update(payload).digest("hex");
};

const normalizeRowValuesForTable = async (
  tableId: string,
  rawValues: Record<string, unknown>,
  tx: Prisma.TransactionClient,
) => {
  const cols = await tx.lookupTableColumn.findMany({
    where: { tableId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const normalized: Record<string, CellValue> = {};
  cols.forEach((c) => {
    normalized[c.id] = normalizeCellValue(rawValues[c.id], c.dataType);
  });
  const rowHash = computeRowHash(tableId, normalized);
  return { cols, normalized, rowHash };
};

export const lookupTablesService = {
  listTables: () => listLookupTables(),

  createTable: (data: { name: string; description?: string | null }) => {
    const name = data.name.trim();
    return createLookupTable({ ...data, name });
  },

  updateTable: async (id: string, data: { name?: string; description?: string | null }) => {
    const next: any = { ...data };
    if (typeof next.name === "string") next.name = next.name.trim();
    return updateLookupTable(id, next);
  },

  deleteTable: (id: string) => deleteLookupTable(id),

  listColumns: (tableId: string) => listLookupTableColumns(tableId),

  createColumn: async (tableId: string, data: { name: string; dataType: LookupTableDataType; sortOrder?: number }) => {
    const name = data.name.trim();
    return createLookupTableColumn(tableId, { ...data, name });
  },

  updateColumn: async (
    tableId: string,
    columnId: string,
    data: { name?: string; dataType?: LookupTableDataType; sortOrder?: number },
  ) => {
    const next: any = { ...data };
    if (typeof next.name === "string") next.name = next.name.trim();
    const existing = await prisma.lookupTableColumn.findUnique({ where: { id: columnId } });
    if (!existing || existing.tableId !== tableId) throw new HttpError(404, "Column not found");
    return updateLookupTableColumn(columnId, next);
  },

  deleteColumn: async (tableId: string, columnId: string) => {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.lookupTableColumn.findUnique({ where: { id: columnId } });
      if (!existing || existing.tableId !== tableId) throw new HttpError(404, "Column not found");

      // Prevent column deletion if it would collapse distinct rows into duplicates.
      const remainingCols = await tx.lookupTableColumn.findMany({
        where: { tableId, id: { not: columnId } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      if (remainingCols.length > 0) {
        const rows = await tx.lookupTableRow.findMany({ where: { tableId } });
        const seen = new Set<string>();
        for (const row of rows) {
          const values = (row.values ?? {}) as Record<string, unknown>;
          const normalized: Record<string, CellValue> = {};
          remainingCols.forEach((c) => {
            normalized[c.id] = normalizeCellValue(values[c.id], c.dataType);
          });
          const hash = computeRowHash(tableId, normalized);
          if (seen.has(hash)) {
            throw new HttpError(409, "Cannot delete column: would create duplicate rows");
          }
          seen.add(hash);
        }
      }

      await deleteLookupTableColumn(columnId, tx);
    });
  },

  listRows: (tableId: string) => listLookupTableRows(tableId),

  createRowsBulk: async (
    tableId: string,
    rows: Array<{ values: Record<string, unknown>; sortOrder?: number }>,
  ) => {
    return prisma.$transaction(async (tx) => {
      const cols = await tx.lookupTableColumn.findMany({
        where: { tableId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

      const normalizeWithCols = (rawValues: Record<string, unknown>) => {
        const normalized: Record<string, CellValue> = {};
        cols.forEach((c) => {
          normalized[c.id] = normalizeCellValue(rawValues[c.id], c.dataType);
        });
        return normalized;
      };

      let skippedBlank = 0;
      let skippedDuplicateInRequest = 0;

      const candidates: Array<{
        values: Prisma.InputJsonValue;
        rowHash: string;
        sortOrder: number;
      }> = [];
      const requestedHashes = new Set<string>();

      for (const row of rows) {
        const normalized = normalizeWithCols(row.values ?? {});
        if (isBlankRow(normalized)) {
          skippedBlank++;
          continue;
        }
        const rowHash = computeRowHash(tableId, normalized);
        if (requestedHashes.has(rowHash)) {
          skippedDuplicateInRequest++;
          continue;
        }
        requestedHashes.add(rowHash);
        candidates.push({
          values: normalized as unknown as Prisma.InputJsonValue,
          rowHash,
          sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
        });
      }

      let skippedExisting = 0;
      let inserted = 0;

      if (candidates.length) {
        const existing = await tx.lookupTableRow.findMany({
          where: { tableId, rowHash: { in: candidates.map((c) => c.rowHash) } },
          select: { rowHash: true },
        });
        const existingSet = new Set(existing.map((e) => e.rowHash));
        const toInsert = candidates.filter((c) => !existingSet.has(c.rowHash));
        skippedExisting = candidates.length - toInsert.length;

        if (toInsert.length) {
          const result = await tx.lookupTableRow.createMany({
            data: toInsert.map((r) => ({
              tableId,
              values: r.values,
              rowHash: r.rowHash,
              sortOrder: r.sortOrder,
            })),
            skipDuplicates: true,
          });
          inserted = result.count;
        }
      }

      return {
        inserted,
        skippedBlank,
        skippedDuplicateInRequest,
        skippedExisting,
      };
    });
  },

  createRow: async (
    tableId: string,
    data: { values: Record<string, unknown>; sortOrder?: number },
  ) => {
    return prisma.$transaction(async (tx) => {
      const { normalized, rowHash } = await normalizeRowValuesForTable(tableId, data.values ?? {}, tx);
      if (isBlankRow(normalized)) {
        throw new HttpError(400, "Row is blank");
      }

      const sortOrder = typeof data.sortOrder === "number" ? data.sortOrder : undefined;
      return createLookupTableRow(
        tableId,
        {
          values: normalized as unknown as Prisma.InputJsonValue,
          rowHash,
          ...(sortOrder !== undefined ? { sortOrder } : {}),
        },
        tx,
      );
    });
  },

  updateRow: async (
    tableId: string,
    rowId: string,
    data: { values?: Record<string, unknown>; sortOrder?: number },
  ) => {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.lookupTableRow.findUnique({ where: { id: rowId } });
      if (!existing || existing.tableId !== tableId) throw new HttpError(404, "Row not found");

      const nextValues = (data.values ?? (existing.values as any) ?? {}) as Record<string, unknown>;
      const { normalized, rowHash } = await normalizeRowValuesForTable(tableId, nextValues, tx);

      if (isBlankRow(normalized)) {
        throw new HttpError(400, "Row is blank");
      }

      const sortOrder = typeof data.sortOrder === "number" ? data.sortOrder : undefined;
      return updateLookupTableRow(
        rowId,
        {
          values: normalized as unknown as Prisma.InputJsonValue,
          rowHash,
          ...(sortOrder !== undefined ? { sortOrder } : {}),
        },
        tx,
      );
    });
  },

  deleteRow: async (tableId: string, rowId: string) => {
    const existing = await prisma.lookupTableRow.findUnique({ where: { id: rowId } });
    if (!existing || existing.tableId !== tableId) throw new HttpError(404, "Row not found");
    await deleteLookupTableRow(rowId);
  },
};
