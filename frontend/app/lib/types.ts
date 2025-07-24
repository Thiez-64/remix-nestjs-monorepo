// Types centralisés pour remplacer les imports Prisma
export enum CommodityType {
  FERMENTATION_ADDITIVES = "FERMENTATION_ADDITIVES",
  STABILIZATION_CLARIFICATION = "STABILIZATION_CLARIFICATION",
  ORGANOLEPTIC_CORRECTION = "ORGANOLEPTIC_CORRECTION",
  ENERGY = "ENERGY",
  ANALYSIS_LAB = "ANALYSIS_LAB",
  FILTRATION = "FILTRATION",
  PACKAGING = "PACKAGING",
}
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum TankStatus {
  EMPTY = "EMPTY",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
}

export enum TankMaterial {
  INOX = "INOX",
  BETON = "BETON",
  BOIS = "BOIS",
  PLASTIQUE = "PLASTIQUE",
}

export enum ActionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  WAITING_STOCK = "WAITING_STOCK",
}

export enum GrapeVarietyType {
  CHARDONNAY = "CHARDONNAY",
  UGNI_BLANC = "UGNI_BLANC",
  SAUVIGNON_BLANC = "SAUVIGNON_BLANC",
  CHERRY_BLANC = "CHERRY_BLANC",
  GEWURZTRAMINER = "GEWURZTRAMINER",
  RIESLING = "RIESLING",
  PINOT_BLANC = "PINOT_BLANC",
  PINOT_GRIS = "PINOT_GRIS",
  MELON_DE_BOURGOGNE = "MELON_DE_BOURGOGNE",
  CLAIRETTE = "CLAIRETTE",
  MUSCAT_BLANCS = "MUSCAT_BLANCS",
  ALIGOTE = "ALIGOTE",
  VIOGNIER = "VIOGNIER",
  MARSANE = "MARSANE",
  ROUSSE = "ROUSSE",
  PICPOUL = "PICPOUL",
  SAVAGNIN = "SAVAGNIN",
  SEMILLON = "SEMILLON",
  BOURBOULENC = "BOURBOULENC",
  COLOMBARD = "COLOMBARD",
  FOLLE_BLANCHE = "FOLLE_BLANCHE",
  MERLOT = " MERLOT",
  GRENACHE_NOIR = "GRENACHE_NOIR",
  SYRAH = "SYRAH",
  CABERNET_SAUVIGNON = "CABERNET_SAUVIGNON",
  CARIGNAN = "CARIGNAN",
  PINOT_NOIR = "PINOT_NOIR",
  GAMAY = "GAMAY",
  CABERNET_FRANC = "CABERNET_FRANC",
  CINSAUT = "CINSAUT",
  MOURVEDRE = "MOURVEDRE",
  TANNAT = "TANNAT",
  MALBEC = "MALBEC",
  MONDEUSE = "MONDEUSE",
}

export const grapeVarietyColors: Record<string, string> = {
  CHARDONNAY: "#FFB6C1", // Rose clair
  UGNI_BLANC: "#98FB98", // Vert clair
  SAUVIGNON_BLANC: "#87CEEB", // Bleu ciel
  CHERRY_BLANC: "#DDA0DD", // Prune
  GEWURZTRAMINER: "#F0E68C", // Kaki
  RIESLING: "#E6E6FA", // Lavande
  PINOT_BLANC: "#FFA07A", // Saumon clair
  PINOT_GRIS: "#B0C4DE", // Bleu acier clair
  MELON_DE_BOURGOGNE: "#20B2AA", // Vert mer clair
  CLAIRETTE: "#FF69B4", // Rose vif
  MUSCAT_BLANCS: "#D8BFD8", // Chardon
  ALIGOTE: "#F5DEB3", // Blé
  VIOGNIER: "#FFD700", // Or
  MARSANE: "#CD853F", // Brun péruvien
  ROUSSE: "#DC143C", // Rouge cramoisi
  PICPOUL: "#32CD32", // Vert lime
  SAVAGNIN: "#8B4513", // Brun selle
  SEMILLON: "#FFE4B5", // Mocassin
  BOURBOULENC: "#D2691E", // Chocolat
  COLOMBARD: "#FF7F50", // Corail
  FOLLE_BLANCHE: "#DEB887", // Brun rosé
  MERLOT: "#800000", // Bordeau
  GRENACHE_NOIR: "#8B0000", // Rouge foncé
  SYRAH: "#4B0082", // Indigo
  CABERNET_SAUVIGNON: "#8B008B", // Magenta foncé
  CARIGNAN: "#A52A2A", // Brun
  PINOT_NOIR: "#4B0082", // Indigo
  GAMAY: "#FF1493", // Rose profond
  CABERNET_FRANC: "#8B0000", // Rouge foncé
  CINSAUT: "#B22222", // Rouge brique
  MOURVEDRE: "#8B0000", // Rouge foncé
  TANNAT: "#800000", // Bordeau
  MALBEC: "#8B0000", // Rouge foncé
  MONDEUSE: "#8B0000", // Rouge foncé
};

export type ActionType = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  actions: Action[];
};

export type Action = {
  id: string;
  tank: Tank;
  tankId: string;
  type: ActionType;
  typeId: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  duration: number;
  previous: Action;
  previousId: string | null;
  next: Action[];
  nextId: string | null;
  isCompleted: boolean;
  needsPurchase: boolean;
  consumables: Consumable[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export type Process = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Batch = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  userId: string;
  processId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Stock = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minimumQty: number;
  isOutOfStock: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Consumable = {
  id: string;
  name: string;
  quantity: number;
  originalQuantity: number | null;
  unit: string;
  description: string | null;
  commodity: CommodityType;
  actionId: string | null;
  stockId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Tank = {
  id: string;
  name: string;
  description: string | null;
  material: TankMaterial;
  capacity: number;
  status: TankStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  plotTanks: PlotTank[];
  actions: Action[];
};

export type PlotTank = {
  id: string;
  plotId: string;
  tankId: string;
  quantityUsed: number;
  harvestDate: Date | null;
  transferDate: Date;
  createdAt: Date;
  updatedAt: Date;
  plot: Plot;
  tank: Tank;
};

export type Plot = {
  id: string;
  name: string;
  description: string | null;
  surface: number;
  grapeVariety: GrapeVarietyType;
  userId: string;
  plotTanks: PlotTank[];
  createdAt: Date;
  updatedAt: Date;
};
