import { z } from "zod";

export const StockSchema = z.object({
  name: z
    .string({ required_error: "Le nom du produit est requis" })
    .min(1, "Le nom du produit est requis"),
  unit: z
    .string({ required_error: "L'unité est requise" })
    .min(1, "L'unité est requise"),
  quantity: z.coerce
    .number({ required_error: "La quantité est requise" })
    .min(0, "La quantité doit être positive"),
  minimumQty: z.coerce
    .number({ required_error: "Le seuil minimum est requis" })
    .min(0, "Le seuil minimum doit être positif"),
  description: z.string().optional(),
});
