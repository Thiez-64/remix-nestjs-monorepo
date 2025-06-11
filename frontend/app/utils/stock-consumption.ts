interface Consumable {
  name: string;
  unit: string;
  quantity: number;
}

interface Stock {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  isOutOfStock?: boolean;
}

interface StockConsumptionResult {
  success: boolean;
  updatedStocks: Array<{
    id: string;
    newQuantity: number;
    wasConsumed: boolean;
  }>;
  outOfStockItems: Array<{
    name: string;
    unit: string;
    requiredQuantity: number;
    availableQuantity: number;
    missingQuantity: number;
  }>;
}

/**
 * Calcule la consommation des stocks pour une liste de consommables
 * @param consumables - Consommables requis pour l'action
 * @param stocks - Stocks disponibles
 * @returns Résultat de la consommation avec les stocks mis à jour et les ruptures
 */
export function calculateStockConsumption(
  consumables: Consumable[],
  stocks: Stock[]
): StockConsumptionResult {
  const updatedStocks: StockConsumptionResult["updatedStocks"] = [];
  const outOfStockItems: StockConsumptionResult["outOfStockItems"] = [];

  for (const consumable of consumables) {
    const matchingStock = stocks.find(
      (stock) =>
        stock.name.toLowerCase() === consumable.name.toLowerCase() &&
        stock.unit.toLowerCase() === consumable.unit.toLowerCase()
    );

    if (matchingStock) {
      const newQuantity = matchingStock.quantity - consumable.quantity;

      updatedStocks.push({
        id: matchingStock.id,
        newQuantity,
        wasConsumed: true,
      });

      // Si la quantité devient négative, c'est une rupture partielle
      if (newQuantity < 0) {
        outOfStockItems.push({
          name: consumable.name,
          unit: consumable.unit,
          requiredQuantity: consumable.quantity,
          availableQuantity: matchingStock.quantity,
          missingQuantity: Math.abs(newQuantity),
        });
      }
    } else {
      // Aucun stock trouvé pour ce consommable
      outOfStockItems.push({
        name: consumable.name,
        unit: consumable.unit,
        requiredQuantity: consumable.quantity,
        availableQuantity: 0,
        missingQuantity: consumable.quantity,
      });
    }
  }

  return {
    success: outOfStockItems.length === 0,
    updatedStocks,
    outOfStockItems,
  };
}

/**
 * Génère les données pour créer des entrées de rupture de stock
 * @param outOfStockItems - Éléments en rupture
 * @param userId - ID de l'utilisateur
 * @returns Données pour créer les entrées de stock en rupture
 */
export function generateOutOfStockEntries(
  outOfStockItems: StockConsumptionResult["outOfStockItems"],
  userId: string
) {
  return outOfStockItems.map((item) => ({
    name: item.name,
    unit: item.unit,
    quantity: -item.missingQuantity, // Quantité négative pour indiquer le manque
    minimumQty: 0,
    isOutOfStock: true,
    description: `Rupture de stock - Manque ${item.missingQuantity} ${item.unit}`,
    userId,
  }));
}
