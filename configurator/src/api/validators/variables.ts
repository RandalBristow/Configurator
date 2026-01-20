import { z } from "zod";

export const variableIdParams = z.object({
  id: z.string().uuid(),
});

export const variableQuery = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined)),
  optionId: z.string().uuid().optional(),
});

export const variableCreate = z.object({
  optionId: z.string().uuid().optional().nullable(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  dataType: z.enum([
    "string",
    "number",
    "boolean",
    "datetime",
    "stringArray",
    "numberArray",
    "booleanArray",
    "datetimeArray",
    "collection",
  ]),
  defaultValue: z.any().optional().nullable(),
});

export const variableUpdate = variableCreate.partial();
