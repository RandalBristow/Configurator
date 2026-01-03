import { z } from "zod";

export const lookupTableIdParams = z.object({
  tableId: z.string().uuid(),
});

export const lookupTableRowIdParams = z.object({
  tableId: z.string().uuid(),
  rowId: z.string().uuid(),
});

export const lookupTableColumnIdParams = z.object({
  tableId: z.string().uuid(),
  columnId: z.string().uuid(),
});

export const lookupTableCreate = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const lookupTableUpdate = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export const lookupTableDataType = z.enum(["string", "number", "boolean", "datetime"]);

export const lookupTableColumnCreate = z.object({
  name: z.string().min(1),
  dataType: lookupTableDataType,
  sortOrder: z.number().int().optional(),
});

export const lookupTableColumnUpdate = z.object({
  name: z.string().min(1).optional(),
  dataType: lookupTableDataType.optional(),
  sortOrder: z.number().int().optional(),
});

const cellValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const lookupTableRowCreate = z.object({
  sortOrder: z.number().int().optional(),
  values: z.record(cellValue),
});

export const lookupTableRowUpdate = z.object({
  sortOrder: z.number().int().optional(),
  values: z.record(cellValue).optional(),
});

export const lookupTableRowsBulkCreate = z.object({
  rows: z
    .array(
      z.object({
        sortOrder: z.number().int().optional(),
        values: z.record(cellValue),
      }),
    )
    .min(1),
});
