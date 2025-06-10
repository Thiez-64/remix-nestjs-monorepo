export interface ConsumableWithQuantity {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  description: string | null;
}

export interface ScaledConsumable extends ConsumableWithQuantity {
  scaledQuantity: number;
  originalQuantity: number;
}

/**
 * Calcule les quantités de consommables en fonction du volume de la cuvée
 * @param consumables - Liste des consommables avec leurs quantités de référence
 * @param referenceVolume - Volume de référence pour lequel les quantités sont définies (en L)
 * @param targetVolume - Volume de la cuvée pour laquelle calculer les nouvelles quantités (en L)
 * @returns Consommables avec quantités calculées
 */
export function calculateScaledQuantities(
  consumables: ConsumableWithQuantity[],
  referenceVolume: number,
  targetVolume: number
): ScaledConsumable[] {
  if (referenceVolume <= 0 || targetVolume <= 0) {
    return consumables.map((consumable) => ({
      ...consumable,
      scaledQuantity: consumable.quantity,
      originalQuantity: consumable.quantity,
    }));
  }

  const scaleFactor = targetVolume / referenceVolume;

  return consumables.map((consumable) => ({
    ...consumable,
    scaledQuantity: Math.round(consumable.quantity * scaleFactor * 100) / 100, // Arrondi à 2 décimales
    originalQuantity: consumable.quantity,
  }));
}

/**
 * Formate une quantité avec son unité pour l'affichage
 * @param quantity - Quantité à formater
 * @param unit - Unité de mesure
 * @returns Chaîne formatée "quantité unité"
 */
export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity} ${unit}`;
}

/**
 * Formate l'affichage d'un consommable avec quantité adaptée
 * @param consumable - Consommable avec quantités calculées
 * @param showOriginal - Afficher aussi la quantité originale
 * @returns Chaîne formatée pour l'affichage
 */
export function formatScaledConsumable(
  consumable: ScaledConsumable,
  showOriginal: boolean = false
): string {
  const scaledDisplay = `${consumable.name}: ${formatQuantity(consumable.scaledQuantity, consumable.unit)}`;

  if (
    showOriginal &&
    consumable.scaledQuantity !== consumable.originalQuantity
  ) {
    return `${scaledDisplay} (base: ${formatQuantity(consumable.originalQuantity, consumable.unit)})`;
  }

  return scaledDisplay;
}
