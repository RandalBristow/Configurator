import { z } from "zod";

export const optionListIdParams = z.object({
  id: z.string().uuid(),
});

export const optionListCreate = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const optionListUpdate = optionListCreate.partial();
