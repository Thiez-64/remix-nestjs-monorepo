import { z } from "zod";

export const BatchSchema = z.object({
  name: z.string({ required_error: "Le nom de la cuvée est requis" }),
  description: z.string().optional(),
  quantity: z.number().min(1, "La quantité doit être supérieure à 0"),
});
