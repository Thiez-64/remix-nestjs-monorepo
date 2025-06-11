import { z } from "zod";

export const TankSchema = z.object({
  name: z.string({ required_error: "Le nom de la cuve est requis" }),
  description: z.string().optional(),
  material: z.enum(["INOX", "BETON", "BOIS", "PLASTIQUE"]),
  status: z.enum(["EMPTY", "IN_USE", "MAINTENANCE"]),
  capacity: z.number().min(1, "La capacité doit être supérieure à 0"),
});
