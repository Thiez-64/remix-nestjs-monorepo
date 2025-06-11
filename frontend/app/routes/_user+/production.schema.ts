import { z } from "zod";

export const ActionSchema = z.object({
  type: z.string({ required_error: "Le nom de l'action est requis" }),
  description: z.string().optional(),
  duration: z
    .number({ required_error: "La durée est requise" })
    .min(1, "La durée doit être supérieure à 0"),
  needsPurchase: z.boolean().default(false),
  referenceVolume: z.number().optional(),
});
