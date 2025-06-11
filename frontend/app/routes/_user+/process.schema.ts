import { z } from "zod";

export const ProcessSchema = z.object({
  name: z.string({ required_error: "Le nom du processus est requis" }),
  description: z.string().optional(),
  startDate: z.string().optional(),
});
