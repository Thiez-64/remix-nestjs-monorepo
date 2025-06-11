interface Tank {
  id: string;
  name: string;
  capacity: number;
  allocatedVolume: number;
  batchId: string | null;
}

interface Batch {
  id: string;
  name: string;
  quantity: number;
  tanks: Tank[];
}

export interface BatchAllocation {
  batchId: string;
  batchName: string;
  totalVolume: number;
  allocatedVolume: number;
  remainingVolume: number;
  progressPercentage: number;
  isFullyAllocated: boolean;
  tanks: Array<{
    id: string;
    name: string;
    capacity: number;
    allocatedVolume: number;
    utilizationPercentage: number;
  }>;
}

/**
 * Calcule la progression d'allocation d'une cuvée sur ses cuves
 * @param batch - Cuvée avec ses cuves assignées
 * @returns Informations détaillées sur l'allocation
 */
export function calculateBatchAllocation(batch: Batch): BatchAllocation {
  const allocatedVolume = batch.tanks.reduce(
    (total, tank) => total + tank.allocatedVolume,
    0
  );

  const remainingVolume = Math.max(0, batch.quantity - allocatedVolume);
  const progressPercentage =
    batch.quantity > 0
      ? Math.round((allocatedVolume / batch.quantity) * 100)
      : 0;

  return {
    batchId: batch.id,
    batchName: batch.name,
    totalVolume: batch.quantity,
    allocatedVolume,
    remainingVolume,
    progressPercentage,
    isFullyAllocated: remainingVolume === 0,
    tanks: batch.tanks.map((tank) => ({
      id: tank.id,
      name: tank.name,
      capacity: tank.capacity,
      allocatedVolume: tank.allocatedVolume,
      utilizationPercentage:
        tank.capacity > 0
          ? Math.round((tank.allocatedVolume / tank.capacity) * 100)
          : 0,
    })),
  };
}

/**
 * Trouve les cuves disponibles pour une allocation
 * @param allTanks - Toutes les cuves disponibles
 * @param requiredVolume - Volume nécessaire
 * @returns Cuves pouvant accueillir le volume
 */
export function findAvailableTanks(
  allTanks: Tank[],
  requiredVolume: number
): Tank[] {
  return allTanks
    .filter((tank) => {
      const availableCapacity = tank.capacity - tank.allocatedVolume;
      return availableCapacity >= requiredVolume && tank.batchId === null;
    })
    .sort((a, b) => {
      // Trier par capacité disponible (plus petite d'abord pour optimiser)
      const availableA = a.capacity - a.allocatedVolume;
      const availableB = b.capacity - b.allocatedVolume;
      return availableA - availableB;
    });
}

/**
 * Calcule la répartition optimale d'une cuvée sur plusieurs cuves
 * @param batchVolume - Volume total de la cuvée
 * @param availableTanks - Cuves disponibles
 * @returns Suggestions de répartition
 */
export function suggestOptimalAllocation(
  batchVolume: number,
  availableTanks: Tank[]
): Array<{ tankId: string; tankName: string; suggestedVolume: number }> {
  const suggestions: Array<{
    tankId: string;
    tankName: string;
    suggestedVolume: number;
  }> = [];
  let remainingVolume = batchVolume;

  // Trier les cuves par capacité disponible (plus grande d'abord)
  const sortedTanks = [...availableTanks].sort((a, b) => {
    const availableA = a.capacity - a.allocatedVolume;
    const availableB = b.capacity - b.allocatedVolume;
    return availableB - availableA;
  });

  for (const tank of sortedTanks) {
    if (remainingVolume <= 0) break;

    const availableCapacity = tank.capacity - tank.allocatedVolume;
    const volumeToAllocate = Math.min(remainingVolume, availableCapacity);

    if (volumeToAllocate > 0) {
      suggestions.push({
        tankId: tank.id,
        tankName: tank.name,
        suggestedVolume: volumeToAllocate,
      });
      remainingVolume -= volumeToAllocate;
    }
  }

  return suggestions;
}

/**
 * Formate l'affichage de progression
 * @param allocation - Données d'allocation
 * @returns Chaîne formatée pour l'affichage
 */
export function formatAllocationProgress(allocation: BatchAllocation): string {
  if (allocation.isFullyAllocated) {
    return `✅ Entièrement allouée (${allocation.allocatedVolume}L)`;
  }

  if (allocation.allocatedVolume === 0) {
    return `⏳ Non allouée (${allocation.totalVolume}L à assigner)`;
  }

  return `🟡 Partiellement allouée (${allocation.allocatedVolume}L / ${allocation.totalVolume}L - ${allocation.remainingVolume}L restants)`;
}
