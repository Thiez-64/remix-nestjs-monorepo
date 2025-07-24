import { z } from "zod";

// Vineyard Schema
export const PlotSchema = z.object({
  name: z.string({ required_error: "Le nom de la parcelle est requis" }),
  description: z.string().optional(),
  surface: z.number().min(1, "La surface doit être supérieure à 0"),
  grapeVariety: z.enum([
    "CHARDONNAY",
    "UGNI_BLANC",
    "SAUVIGNON_BLANC",
    "CHERRY_BLANC",
    "GEWURZTRAMINER",
    "RIESLING",
    "PINOT_BLANC",
    "PINOT_GRIS",
    "MELON_DE_BOURGOGNE",
    "CLAIRETTE",
    "MUSCAT_BLANCS",
    "ALIGOTE",
    "VIOGNIER",
    "MARSANE",
    "ROUSSE",
    "PICPOUL",
    "SAVAGNIN",
    "SEMILLON",
    "BOURBOULENC",
    "COLOMBARD",
    "FOLLE_BLANCHE",
    "MERLOT",
    "GRENACHE_NOIR",
    "SYRAH",
    "CABERNET_SAUVIGNON",
    "CARIGNAN",
    "PINOT_NOIR",
    "GAMAY",
    "CABERNET_FRANC",
    "CINSAUT",
    "MOURVEDRE",
    "TANNAT",
    "MALBEC",
    "MONDEUSE",
  ]),
});

// ActionType Schema - for creating templates
export const ActionTypeSchema = z.object({
  name: z.string({ required_error: "Le nom de l'action est requis" }),
  description: z.string().optional(),
});

// Action Schema - for creating instances (simplified, mostly handled server-side)
export const ActionSchema = z.object({
  typeId: z.string({ required_error: "Le type d'action est requis" }),
  tankId: z.string({ required_error: "La cuve est requise" }),
  duration: z.coerce.number().min(1, "La durée doit être supérieure à 0"),
});

// Process Schema
export const ProcessSchema = z.object({
  name: z.string({ required_error: "Le nom du processus est requis" }),
  description: z.string().optional(),
  startDate: z.string().optional(),
});

// Batch Schema
export const BatchSchema = z.object({
  name: z.string({ required_error: "Le nom de la cuvée est requis" }),
  description: z.string().optional(),
  volume: z.number().min(1, "La quantité doit être supérieure à 0"),
  createdAt: z.string().optional(),
  yieldRatio: z.coerce.number().min(0.1).max(20).default(1.5), // hL/hectare
});

// Stock Schema
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
});

// Tank Schema
export const TankSchema = z.object({
  name: z.string({ required_error: "Le nom de la cuve est requis" }),
  description: z.string().optional(),
  material: z.enum(["INOX", "BETON", "BOIS", "PLASTIQUE"]),
  status: z.enum(["EMPTY", "IN_USE", "MAINTENANCE"]),
  volume: z.number().min(1, "La capacité doit être supérieure à 0"),
});

// Schema pour l'assignation de parcelles avec ratio de conversion
export const PlotTankSchema = z.object({
  plotId: z.string().min(1, "La parcelle est requise"),
  volume: z.coerce
    .number()
    .min(0.1, "La quantité doit être supérieure à 0.1 hL"),
  harvestDate: z.string().optional(),
  yieldRatio: z.coerce.number().min(10).max(200).default(60), // hL/hectare
});

export const TransferSchema = z.object({
  volume: z.number().min(1, "La capacité doit être supérieure à 0"),
  sourceTank: z.string().min(1, "Sélectionnez une cuve source"),
  targetTank: z.string().min(1, "Sélectionnez une cuve cible"),
  duration: z.coerce.number().min(0, "La durée doit être supérieure à 0"),
});

export const ConsumableSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  quantity: z.number().min(0, "Quantité requise"),
  originalQuantity: z.number().min(0, "Quantité requise"),
  unit: z.string().min(1, "Unité requise"),
  description: z.string().optional(),
  commodity: z.string().optional(),
});

export const AddConsuambleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  quantity: z.number().min(0, "Quantité requise"),
  originalQuantity: z.number().min(0, "Quantité requise"),
  unit: z.string().min(1, "Unité requise"),
  description: z.string().optional(),
  commodity: z.string().optional(),
});

// Types inférés des schémas
export type PlotInput = z.infer<typeof PlotSchema>;
export type ActionTypeInput = z.infer<typeof ActionTypeSchema>;
export type ActionInput = z.infer<typeof ActionSchema>;
export type StockInput = z.infer<typeof StockSchema>;
export type TankInput = z.infer<typeof TankSchema>;
export type BatchInput = z.infer<typeof BatchSchema>;
export type PlotTankInput = z.infer<typeof PlotTankSchema>;
export type TransferInput = z.infer<typeof TransferSchema>;
export type ConsumableInput = z.infer<typeof ConsumableSchema>;
export type AddConsuambleInput = z.infer<typeof AddConsuambleSchema>;
