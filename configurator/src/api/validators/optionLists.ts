import { z } from "zod";

export const selectListIdParams = z.object({
  id: z.string().uuid(),
});

export const selectListCreate = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const selectListUpdate = selectListCreate.partial();
