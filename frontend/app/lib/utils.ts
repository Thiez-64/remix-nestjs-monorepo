import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CommodityType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ===== CONFIGURATION DES STATUTS =====

export const getStockStatusConfig = (
  isOutOfStock: boolean,
  isLowStock: boolean
) => {
  if (isOutOfStock) {
    return {
      bgColor: "bg-red-200 text-red-800",
      dotColor: "bg-red-600",
      text: "Rupture de stock",
    };
  }
  if (isLowStock) {
    return {
      bgColor: "bg-orange-200 text-orange-800",
      dotColor: "bg-orange-600",
      text: "Stock faible",
    };
  }
  return {
    bgColor: "bg-green-200 text-green-800",
    dotColor: "bg-green-600",
    text: "En stock",
  };
};

export const getConsumableStatusConfig = (missing: number) => {
  if (missing) {
    return {
      bgColor: "bg-red-200 text-red-800",
      dotColor: "bg-red-600",
      text: "Rupture de stock",
    };
  }
  return {
    bgColor: "bg-green-200 text-green-800",
    dotColor: "bg-green-600",
    text: "En stock",
  };
};

// ===== CONFIGURATION DES COMMODITÉS =====

export const getCommodityStatusConfig = (commodity: string) => {
  switch (commodity) {
    case "FERMENTATION_ADDITIVES":
      return {
        bgColor: "bg-fuchsia-200 text-fuchsia-800",
        dotColor: "bg-fuchsia-600",
        text: "Additifs de fermentation",
      };
    case "STABILIZATION_CLARIFICATION":
      return {
        bgColor: "bg-violet-200 text-violet-800",
        dotColor: "bg-violet-600",
        text: "Stabilisation & Clarification",
      };
    case "ORGANOLEPTIC_CORRECTION":
      return {
        bgColor: "bg-yellow-200 text-yellow-800",
        dotColor: "bg-yellow-600",
        text: "Correction organoleptique",
      };
    case "ENERGY":
      return {
        bgColor: "bg-sky-200 text-sky-800",
        dotColor: "bg-sky-600",
        text: "Énergie",
      };
    case "ANALYSIS_LAB":
      return {
        bgColor: "bg-blue-200 text-blue-800",
        dotColor: "bg-blue-600",
        text: "Analyse & Laboratoire",
      };
    case "FILTRATION":
      return {
        bgColor: "bg-rose-200 text-rose-800",
        dotColor: "bg-rose-600",
        text: "Filtration",
      };
    case "PACKAGING":
      return {
        bgColor: "bg-amber-200 text-amber-800",
        dotColor: "bg-amber-600",
        text: "Conditionnement",
      };
    default:
      return {
        bgColor: "bg-gray-200 text-gray-800",
        dotColor: "bg-gray-600",
        text: "Non défini",
      };
  }
};

export const commodityOptions = [
  { value: "FERMENTATION_ADDITIVES", label: "Additifs de fermentation" },
  {
    value: "STABILIZATION_CLARIFICATION",
    label: "Stabilisation & Clarification",
  },
  { value: "ORGANOLEPTIC_CORRECTION", label: "Correction organoleptique" },
  { value: "ENERGY", label: "Énergie" },
  { value: "ANALYSIS_LAB", label: "Analyse & Laboratoire" },
  { value: "FILTRATION", label: "Filtration" },
  { value: "PACKAGING", label: "Conditionnement" },
];

// ===== CONFIGURATION DES CUVES =====

export const tankMaterialLabels = {
  INOX: "Inox",
  BETON: "Béton",
  BOIS: "Bois",
  PLASTIQUE: "Plastique",
} as const;

export const tankMaterialColors = {
  INOX: "bg-gray-200 text-gray-800",
  BETON: "bg-neutral-400 text-neutral-800",
  BOIS: "bg-yellow-200 text-yellow-800",
  PLASTIQUE: "bg-blue-200 text-blue-800",
} as const;

export const tankStatusLabels = {
  EMPTY: "Vide",
  IN_USE: "En cours d'utilisation",
  MAINTENANCE: "En maintenance",
} as const;

export const tankStatusColors = {
  EMPTY: "bg-gray-200 text-gray-800",
  IN_USE: "bg-green-200 text-green-800",
  MAINTENANCE: "bg-orange-200 text-orange-800",
} as const;

// ===== CONFIGURATION DES CÉPAGES =====

export const grapeVariety: {
  value: string;
  label: string;
  category: string;
}[] = [
  // Cépages blancs
  { value: "CHARDONNAY", label: "Chardonnay", category: "Blancs" },
  { value: "UGNI_BLANC", label: "Ugni Blanc", category: "Blancs" },
  { value: "SAUVIGNON_BLANC", label: "Sauvignon Blanc", category: "Blancs" },
  { value: "CHERRY_BLANC", label: "Chenin Blanc", category: "Blancs" },
  { value: "GEWURZTRAMINER", label: "Gewürztraminer", category: "Blancs" },
  { value: "RIESLING", label: "Riesling", category: "Blancs" },
  { value: "PINOT_BLANC", label: "Pinot Blanc", category: "Blancs" },
  { value: "PINOT_GRIS", label: "Pinot Gris", category: "Blancs" },
  {
    value: "MELON_DE_BOURGOGNE",
    label: "Melon de Bourgogne",
    category: "Blancs",
  },
  { value: "CLAIRETTE", label: "Clairette", category: "Blancs" },
  { value: "MUSCAT_BLANCS", label: "Muscat Blancs", category: "Blancs" },
  { value: "ALIGOTE", label: "Aligoté", category: "Blancs" },
  { value: "VIOGNIER", label: "Viognier", category: "Blancs" },
  { value: "MARSANE", label: "Marsanne", category: "Blancs" },
  { value: "ROUSSE", label: "Roussanne", category: "Blancs" },
  { value: "PICPOUL", label: "Picpoul", category: "Blancs" },
  { value: "SAVAGNIN", label: "Savagnin", category: "Blancs" },
  { value: "SEMILLON", label: "Sémillon", category: "Blancs" },
  { value: "BOURBOULENC", label: "Bourboulenc", category: "Blancs" },
  { value: "COLOMBARD", label: "Colombard", category: "Blancs" },
  { value: "FOLLE_BLANCHE", label: "Folle Blanche", category: "Blancs" },

  // Cépages rouges
  { value: "MERLOT", label: "Merlot", category: "Rouges" },
  { value: "GRENACHE_NOIR", label: "Grenache Noir", category: "Rouges" },
  { value: "SYRAH", label: "Syrah", category: "Rouges" },
  {
    value: "CABERNET_SAUVIGNON",
    label: "Cabernet Sauvignon",
    category: "Rouges",
  },
  { value: "CARIGNAN", label: "Carignan", category: "Rouges" },
  { value: "PINOT_NOIR", label: "Pinot Noir", category: "Rouges" },
  { value: "GAMAY", label: "Gamay", category: "Rouges" },
  { value: "CABERNET_FRANC", label: "Cabernet Franc", category: "Rouges" },
  { value: "CINSAUT", label: "Cinsaut", category: "Rouges" },
  { value: "MOURVEDRE", label: "Mourvèdre", category: "Rouges" },
  { value: "TANNAT", label: "Tannat", category: "Rouges" },
  { value: "MALBEC", label: "Malbec", category: "Rouges" },
  { value: "MONDEUSE", label: "Mondeuse", category: "Rouges" },
];

export const materialVariety: {
  value: string;
  label: string;
}[] = [
  { value: "INOX", label: "Inox" },
  { value: "BETON", label: "Béton" },
  { value: "BOIS", label: "Bois" },
  { value: "PLASTIQUE", label: "Plastique" },
];

export const tankStateVariety: {
  value: string;
  label: string;
}[] = [
  { value: "EMPTY", label: "Vide" },
  { value: "IN_USE", label: "En cours d'utilisation" },
  { value: "MAINTENANCE", label: "En maintenance" },
];

// ===== CONFIGURATION DES TYPES DE BATCH =====

export const batchTypeLabels = {
  MONO_GRAPE: "Mono-cépage",
  ASSEMBLAGE: "Assemblage",
} as const;

export const batchTypeColors = {
  MONO_GRAPE: "bg-green-100 text-green-800",
  ASSEMBLAGE: "bg-purple-100 text-purple-800",
} as const;

export const batchTypeOptions = [
  {
    id: "MONO_GRAPE",
    name: "Mono-cépage",
  },
  {
    id: "ASSEMBLAGE",
    name: "Assemblage",
  },
];

// ===== UTILITAIRES MÉTIER =====

export type StockWithConsumables = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  consumables?: {
    commodity: CommodityType;
  }[];
};

export const getMostCommonCommodity = (
  stock: StockWithConsumables
): CommodityType => {
  if (!stock.consumables || stock.consumables.length === 0) {
    return CommodityType.FERMENTATION_ADDITIVES;
  }

  // Count commodities
  const commodityCounts = stock.consumables.reduce(
    (acc, c) => {
      acc[c.commodity] = (acc[c.commodity] || 0) + 1;
      return acc;
    },
    {} as Record<CommodityType, number>
  );

  // Return the most common commodity
  let mostCommonCommodity: CommodityType = CommodityType.FERMENTATION_ADDITIVES;
  let maxCount = 0;

  for (const [commodity, count] of Object.entries(commodityCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonCommodity = commodity as CommodityType;
    }
  }

  return mostCommonCommodity;
};

// ===== UTILITAIRES DE FORMATAGE =====

export const formatVolume = (volume: number): string => {
  return `${volume.toLocaleString()}hL`;
};

export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return `${value.toFixed(decimals)}%`;
};

export const calculateFillRate = (used: number, total: number): number => {
  return total > 0 ? (used / total) * 100 : 0;
};

// ===== UTILITAIRES POUR LES CÉPAGES DE BATCH =====

export type BatchWithPlots = {
  id: string;
  plotBatches: {
    plot: {
      grapeVariety: string;
    };
    quantityUsed: number;
  }[];
};

export const getBatchGrapeVarieties = (batch: BatchWithPlots): string[] => {
  const varieties = new Set<string>();
  batch.plotBatches.forEach((plotBatch) => {
    varieties.add(plotBatch.plot.grapeVariety);
  });
  return Array.from(varieties);
};

export const getBatchGrapeVarietiesWithQuantity = (
  batch: BatchWithPlots
): Array<{
  variety: string;
  totalQuantity: number;
  plots: number;
}> => {
  const varietyMap = new Map<
    string,
    { totalQuantity: number; plots: number }
  >();

  batch.plotBatches.forEach((plotBatch) => {
    const variety = plotBatch.plot.grapeVariety;
    const current = varietyMap.get(variety) || { totalQuantity: 0, plots: 0 };

    varietyMap.set(variety, {
      totalQuantity: current.totalQuantity + plotBatch.quantityUsed,
      plots: current.plots + 1,
    });
  });

  return Array.from(varietyMap.entries()).map(([variety, data]) => ({
    variety,
    totalQuantity: data.totalQuantity,
    plots: data.plots,
  }));
};

export const formatBatchGrapeVarieties = (batch: BatchWithPlots): string => {
  const varieties = getBatchGrapeVarieties(batch);
  if (varieties.length === 0) return "Aucun cépage";

  if (varieties.length === 1) {
    const varietyOption = grapeVariety.find((v) => v.value === varieties[0]);
    return varietyOption?.label || varieties[0];
  }

  const formattedVarieties = varieties.map((variety) => {
    const varietyOption = grapeVariety.find((v) => v.value === variety);
    return varietyOption?.label || variety;
  });

  return `Assemblage (${formattedVarieties.join(", ")})`;
};

// Fonction pour détecter automatiquement le type de batch
export const detectBatchType = (
  batch: BatchWithPlots
): "MONO_GRAPE" | "ASSEMBLAGE" => {
  const varieties = getBatchGrapeVarieties(batch);
  return varieties.length <= 1 ? "MONO_GRAPE" : "ASSEMBLAGE";
};

// Fonction pour vérifier si un batch est cohérent avec son type
export const isBatchTypeConsistent = (
  batch: BatchWithPlots,
  declaredType: "MONO_GRAPE" | "ASSEMBLAGE"
): boolean => {
  const detectedType = detectBatchType(batch);
  return detectedType === declaredType;
};

// Fonction pour filtrer les batches par type
export const filterBatchesByType = <T extends { type?: string }>(
  batches: T[],
  type: "MONO_GRAPE" | "ASSEMBLAGE" | "ALL"
): T[] => {
  if (type === "ALL") return batches;
  return batches.filter((batch) => batch.type === type);
};

// ===== UTILITAIRES POUR LES RELATIONS PLOT-TANK =====

export type PlotWithTanks = {
  id: string;
  name: string;
  surface: number;
  grapeVariety: string;
  plotTanks: {
    tankId: string;
    volume: number;
    harvestDate?: string;
    tank: {
      id: string;
      name: string;
      volume: number;
    };
  }[];
};

export type TankWithPlots = {
  id: string;
  name: string;
  volume: number;
  material: string;
  status: string;
  plotTanks: {
    plotId: string;
    volume: number;
    harvestDate?: string;
    plot: {
      id: string;
      name: string;
      grapeVariety: string;
      surface: number;
    };
  }[];
};

export type GrapeComposition = {
  grapeVariety: string;
  volume: number;
  percentage: number;
  addedAt: string;
};

// Calculer la quantité totale utilisée d'une parcelle
export const getPlotTotalUsed = (plot: PlotWithTanks): number => {
  return plot.plotTanks.reduce((total, plotTank) => total + plotTank.volume, 0);
};

// Calculer la quantité disponible d'une parcelle (basé sur surface estimée)
export const getPlotAvailableQuantity = (
  plot: PlotWithTanks,
  estimatedYieldPerHa: number = 10
): number => {
  const estimatedTotal = plot.surface * estimatedYieldPerHa;
  return Math.max(0, estimatedTotal - getPlotTotalUsed(plot));
};

// Obtenir tous les tanks d'une parcelle
export const getPlotTanks = (plot: PlotWithTanks): string[] => {
  return plot.plotTanks.map((pt) => pt.tankId);
};

// Obtenir toutes les parcelles d'un tank
export const getTankPlots = (tank: TankWithPlots): string[] => {
  return tank.plotTanks.map((pt) => pt.plotId);
};

// Calculer la composition en cépages d'un tank depuis ses parcelles
export const calculateTankGrapeCompositionFromPlots = (
  tank: TankWithPlots
): GrapeComposition[] => {
  const compositionMap = new Map<
    string,
    { quantity: number; plots: Set<string> }
  >();

  tank.plotTanks.forEach((plotTank) => {
    const variety = plotTank.plot.grapeVariety;
    const current = compositionMap.get(variety) || {
      quantity: 0,
      plots: new Set(),
    };

    compositionMap.set(variety, {
      quantity: current.quantity + plotTank.volume,
      plots: current.plots.add(plotTank.plot.id),
    });
  });

  const totalQuantity = Array.from(compositionMap.values()).reduce(
    (sum, comp) => sum + comp.quantity,
    0
  );

  return Array.from(compositionMap.entries()).map(([variety, data]) => ({
    grapeVariety: variety,
    volume: data.quantity,
    percentage: totalQuantity > 0 ? (data.quantity / totalQuantity) * 100 : 0,
    addedAt: data.plots.size,
  }));
};

// Calculer le volume total utilisé dans un tank
export const getTankUsedVolume = (tank: TankWithPlots): number => {
  return tank.plotTanks.reduce((total, plotTank) => total + plotTank.volume, 0);
};

// Calculer le volume disponible dans un tank
export const getTankAvailableVolume = (tank: TankWithPlots): number => {
  return tank.volume - getTankUsedVolume(tank);
};

// Calculer le taux de remplissage d'un tank
export const getTankFillRate = (tank: TankWithPlots): number => {
  const usedVolume = getTankUsedVolume(tank);
  return tank.volume > 0 ? (usedVolume / tank.volume) * 100 : 0;
};

// Déterminer si un tank contient un mono-cépage ou un assemblage
export const getTankType = (
  tank: TankWithPlots
): "MONO_GRAPE" | "ASSEMBLAGE" | "EMPTY" => {
  const composition = calculateTankGrapeCompositionFromPlots(tank);
  if (composition.length === 0) return "EMPTY";
  if (composition.length === 1) return "MONO_GRAPE";
  return "ASSEMBLAGE";
};

// Obtenir les cépages d'un tank
export const getTankGrapeVarieties = (tank: TankWithPlots): string[] => {
  return calculateTankGrapeCompositionFromPlots(tank).map(
    (comp) => comp.grapeVariety
  );
};

// Formater la composition d'un tank pour affichage
export const formatTankGrapeComposition = (tank: TankWithPlots): string => {
  const composition = calculateTankGrapeCompositionFromPlots(tank);
  if (composition.length === 0) return "Cuve vide";

  if (composition.length === 1) {
    const varietyOption = grapeVariety.find(
      (v) => v.value === composition[0].grapeVariety
    );
    return varietyOption?.label || composition[0].grapeVariety;
  }

  const formattedVarieties = composition.map((comp) => {
    const varietyOption = grapeVariety.find(
      (v) => v.value === comp.grapeVariety
    );
    const name = varietyOption?.label || comp.grapeVariety;
    return `${name} (${comp.percentage.toFixed(1)}%)`;
  });

  return `Assemblage: ${formattedVarieties.join(", ")}`;
};

// Vérifier si un tank peut accueillir un volume donné
export const canTankAccommodateVolume = (
  tank: TankWithPlots,
  volume: number
): boolean => {
  return getTankAvailableVolume(tank) >= volume;
};

// Filtrer les tanks par type de composition
export const filterTanksByCompositionType = (
  tanks: TankWithPlots[],
  type: "MONO_GRAPE" | "ASSEMBLAGE" | "EMPTY" | "ALL"
): TankWithPlots[] => {
  if (type === "ALL") return tanks;
  return tanks.filter((tank) => getTankType(tank) === type);
};

// Formater l'affichage des parcelles d'un tank
export const formatTankPlots = (tank: TankWithPlots): string => {
  if (tank.plotTanks.length === 0) return "Aucune parcelle";

  const plotNames = tank.plotTanks.map((pt) => pt.plot.name);
  if (plotNames.length <= 3) {
    return plotNames.join(", ");
  }

  return `${plotNames.slice(0, 3).join(", ")} et ${plotNames.length - 3} autre(s)`;
};

// Formater l'affichage des tanks d'une parcelle
export const formatPlotTanks = (plot: PlotWithTanks): string => {
  if (plot.plotTanks.length === 0) return "Aucune cuve";

  const tankNames = plot.plotTanks.map((pt) => pt.tank.name);
  if (tankNames.length <= 3) {
    return tankNames.join(", ");
  }

  return `${tankNames.slice(0, 3).join(", ")} et ${tankNames.length - 3} autre(s)`;
};

// ===== GESTION DU CONTENU DES CUVES =====

export type TankWithContent = {
  id: string;
  name: string;
  volume: number;
  material: string;
  status: string;
  description?: string;
  plotTanks: {
    plotId: string;
    volume: number;
    harvestDate?: string;
    transferDate: string;
    plot: {
      id: string;
      name: string;
      grapeVariety: string;
      surface: number;
    };
  }[];
  grapeComposition: {
    grapeVariety: string;
    volume: number;
    percentage?: number;
    addedAt: string;
  }[];
  actions: {
    id: string;
    type: { name: string };
    isCompleted: boolean;
    startedAt?: string;
    finishedAt?: string;
  }[];
};

// Calculer le volume total contenu dans une cuve
export const getTankContentVolume = (tank: TankWithContent): number => {
  // Priorité à la composition déclarée, sinon calculer depuis les parcelles
  const compositionVolume = tank.grapeComposition.reduce(
    (total, comp) => total + comp.volume,
    0
  );
  const plotVolume = tank.plotTanks.reduce((total, pt) => total + pt.volume, 0);

  return compositionVolume > 0 ? compositionVolume : plotVolume;
};

// Calculer le volume disponible dans une cuve
export const getTankAvailableSpace = (tank: TankWithContent): number => {
  return tank.volume - getTankContentVolume(tank);
};

// Calculer le taux de remplissage d'une cuve
export const getTankFillPercentage = (tank: TankWithContent): number => {
  const contentVolume = getTankContentVolume(tank);
  return tank.volume > 0 ? (contentVolume / tank.volume) * 100 : 0;
};

// Déterminer le type de contenu d'une cuve
export const getTankContentType = (
  tank: TankWithContent
): "EMPTY" | "MONO_GRAPE" | "ASSEMBLAGE" => {
  const grapeVarieties = getTankGrapeVarietiesFromContent(tank);
  if (grapeVarieties.length === 0) return "EMPTY";
  if (grapeVarieties.length === 1) return "MONO_GRAPE";
  return "ASSEMBLAGE";
};

// Obtenir les cépages contenus dans une cuve
export const getTankGrapeVarietiesFromContent = (
  tank: TankWithContent
): string[] => {
  // Priorité à la composition déclarée
  if (tank.grapeComposition.length > 0) {
    return tank.grapeComposition.map((comp) => comp.grapeVariety);
  }

  // Sinon calculer depuis les parcelles
  const varieties = new Set<string>();
  tank.plotTanks.forEach((pt) => varieties.add(pt.plot.grapeVariety));
  return Array.from(varieties);
};

// Obtenir la composition détaillée d'une cuve
export const getTankDetailedComposition = (
  tank: TankWithContent
): Array<{
  grapeVariety: string;
  volume: number;
  percentage: number;
  source: "DECLARED" | "CALCULATED";
  plotsCount?: number;
  harvestDate?: string;
}> => {
  // Si composition déclarée existe, l'utiliser
  if (tank.grapeComposition.length > 0) {
    const totalVolume = tank.grapeComposition.reduce(
      (sum, comp) => sum + comp.volume,
      0
    );

    return tank.grapeComposition.map((comp) => ({
      grapeVariety: comp.grapeVariety,
      volume: comp.volume,
      percentage: totalVolume > 0 ? (comp.volume / totalVolume) * 100 : 0,
      source: "DECLARED" as const,
      harvestDate: comp.addedAt,
    }));
  }

  // Sinon calculer depuis les parcelles
  return calculateTankGrapeCompositionFromPlots(tank as TankWithPlots).map(
    (comp) => ({
      ...comp,
      source: "CALCULATED" as const,
    })
  );
};

// Formater l'affichage du contenu d'une cuve
export const formatTankContent = (tank: TankWithContent): string => {
  const contentVolume = getTankContentVolume(tank);
  const fillPercentage = getTankFillPercentage(tank);
  const grapeVarieties = getTankGrapeVarietiesFromContent(tank);

  if (grapeVarieties.length === 0) {
    return "Cuve vide";
  }

  const grapeDisplay =
    grapeVarieties.length === 1
      ? grapeVariety.find((v) => v.value === grapeVarieties[0])?.label ||
        grapeVarieties[0]
      : `Assemblage (${grapeVarieties.length} cépages)`;

  return `${grapeDisplay} • ${contentVolume}hL (${fillPercentage.toFixed(1)}%)`;
};

// Obtenir l'action en cours sur une cuve
export const getTankCurrentAction = (tank: TankWithContent): string => {
  const activeAction = tank.actions.find(
    (action) => action.startedAt && !action.finishedAt && !action.isCompleted
  );

  if (activeAction) {
    return `${activeAction.type.name} (en cours)`;
  }

  const pendingActions = tank.actions.filter(
    (action) => !action.startedAt && !action.isCompleted
  );

  if (pendingActions.length > 0) {
    return `${pendingActions[0].type.name} (planifiée)`;
  }

  return "Aucune action";
};

// Vérifier si une cuve peut recevoir un volume donné
export const canTankReceiveVolume = (
  tank: TankWithContent,
  volume: number
): {
  canReceive: boolean;
  reason?: string;
  maxVolume: number;
} => {
  const availableSpace = getTankAvailableSpace(tank);

  if (volume <= 0) {
    return {
      canReceive: false,
      reason: "Volume invalide",
      maxVolume: availableSpace,
    };
  }

  if (volume > availableSpace) {
    return {
      canReceive: false,
      reason: `Volume trop important (max: ${availableSpace}hL)`,
      maxVolume: availableSpace,
    };
  }

  if (tank.status === "MAINTENANCE") {
    return {
      canReceive: false,
      reason: "Cuve en maintenance",
      maxVolume: availableSpace,
    };
  }

  return { canReceive: true, maxVolume: availableSpace };
};

// Filtrer les cuves par statut du contenu
export const filterTanksByContent = (
  tanks: TankWithContent[],
  filter: "ALL" | "EMPTY" | "MONO_GRAPE" | "ASSEMBLAGE" | "AVAILABLE" | "FULL"
): TankWithContent[] => {
  switch (filter) {
    case "ALL":
      return tanks;
    case "EMPTY":
      return tanks.filter((tank) => getTankContentType(tank) === "EMPTY");
    case "MONO_GRAPE":
      return tanks.filter((tank) => getTankContentType(tank) === "MONO_GRAPE");
    case "ASSEMBLAGE":
      return tanks.filter((tank) => getTankContentType(tank) === "ASSEMBLAGE");
    case "AVAILABLE":
      return tanks.filter((tank) => getTankAvailableSpace(tank) > 0);
    case "FULL":
      return tanks.filter((tank) => getTankAvailableSpace(tank) <= 0);
    default:
      return tanks;
  }
};
