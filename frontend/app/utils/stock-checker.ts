interface Consumable {
  name: string;
  unit: string;
  quantity: number;
}

interface Stock {
  name: string;
  unit: string;
  quantity: number;
}

/**
 * Vérifie si les consommables d'une action sont en stock suffisant
 * @param consumables - Liste des consommables requis
 * @param stocks - Liste des stocks disponibles
 * @returns true si tous les consommables sont en stock, false sinon
 */
export function checkConsumablesInStock(
  consumables: Consumable[],
  stocks: Stock[]
): boolean {
  if (consumables.length === 0) return true;

  return consumables.every((consumable) => {
    const matchingStock = stocks.find(
      (stock) =>
        stock.name.toLowerCase() === consumable.name.toLowerCase() &&
        stock.unit.toLowerCase() === consumable.unit.toLowerCase()
    );

    // Si pas de stock trouvé ou quantité insuffisante
    if (!matchingStock || matchingStock.quantity < consumable.quantity) {
      return false;
    }

    return true;
  });
}

/**
 * Trouve les consommables manquants en stock
 * @param consumables - Liste des consommables requis
 * @param stocks - Liste des stocks disponibles
 * @returns Liste des consommables manquants ou insuffisants
 */
export function getMissingConsumables(
  consumables: Consumable[],
  stocks: Stock[]
): Array<Consumable & { availableQuantity: number }> {
  return consumables
    .map((consumable) => {
      const matchingStock = stocks.find(
        (stock) =>
          stock.name.toLowerCase() === consumable.name.toLowerCase() &&
          stock.unit.toLowerCase() === consumable.unit.toLowerCase()
      );

      return {
        ...consumable,
        availableQuantity: matchingStock?.quantity || 0,
      };
    })
    .filter((item) => item.availableQuantity < item.quantity);
}

/**
 * Calcule si un achat est nécessaire pour une action
 * @param consumables - Liste des consommables requis
 * @param stocks - Liste des stocks disponibles
 * @returns true si un achat est nécessaire, false sinon
 */
export function calculateNeedsPurchase(
  consumables: Consumable[],
  stocks: Stock[]
): boolean {
  return !checkConsumablesInStock(consumables, stocks);
}
