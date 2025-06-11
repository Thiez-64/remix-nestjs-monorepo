import { Form } from "@remix-run/react";
import { Plus, Settings } from "lucide-react";
import { calculateBatchAllocation, formatAllocationProgress } from "../utils/batch-allocation";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

interface BatchAllocationProgressProps {
  batch: {
    id: string;
    name: string;
    quantity: number;
    tanks: Array<{
      id: string;
      name: string;
      capacity: number;
      allocatedVolume: number;
      batchId: string | null;
    }>;
  };
  availableTanks?: Array<{
    id: string;
    name: string;
    capacity: number;
    allocatedVolume: number;
    batchId: string | null;
  }>;
}

export function BatchAllocationProgress({ batch, availableTanks = [] }: BatchAllocationProgressProps) {
  const allocation = calculateBatchAllocation(batch);

  return (
    <Card className={`${allocation.isFullyAllocated
      ? 'border-green-300 bg-green-50'
      : allocation.allocatedVolume > 0
        ? 'border-yellow-300 bg-yellow-50'
        : 'border-gray-300'
      }`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {batch.name}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${allocation.isFullyAllocated
                ? 'bg-green-200 text-green-800'
                : allocation.allocatedVolume > 0
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-gray-200 text-gray-800'
                }`}>
                {allocation.progressPercentage}%
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {formatAllocationProgress(allocation)}
            </p>
          </div>
          <div className="flex space-x-2">
            {!allocation.isFullyAllocated && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Assigner
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Assigner {batch.name} à une cuve</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Volume restant :</strong> {allocation.remainingVolume}L
                      </p>
                    </div>

                    {availableTanks.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Cuves disponibles</h4>
                        {availableTanks.map((tank) => {
                          const availableCapacity = tank.capacity - tank.allocatedVolume;
                          const canFitRemainingVolume = availableCapacity >= allocation.remainingVolume;

                          return (
                            <Form key={tank.id} method="POST" className="p-3 border rounded-lg">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm">{tank.name}</p>
                                    <p className="text-xs text-gray-600">
                                      Disponible: {availableCapacity}L / {tank.capacity}L
                                    </p>
                                    {canFitRemainingVolume && (
                                      <p className="text-xs text-green-600">
                                        ✅ Peut contenir tout le volume restant
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Suggestions rapides */}
                                <div className="flex space-x-1">
                                  <span className="text-xs text-gray-500">Suggestions:</span>
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    onClick={(e) => {
                                      const input = e.currentTarget.parentElement?.parentElement?.querySelector('input[name="allocatedVolume"]') as HTMLInputElement;
                                      if (input) input.value = Math.min(availableCapacity, allocation.remainingVolume).toString();
                                    }}
                                  >
                                    Max ({Math.min(availableCapacity, allocation.remainingVolume)}L)
                                  </button>
                                  {availableCapacity >= allocation.remainingVolume / 2 && (
                                    <button
                                      type="button"
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                      onClick={(e) => {
                                        const input = e.currentTarget.parentElement?.parentElement?.querySelector('input[name="allocatedVolume"]') as HTMLInputElement;
                                        if (input) input.value = Math.floor(allocation.remainingVolume / 2).toString();
                                      }}
                                    >
                                      Moitié ({Math.floor(allocation.remainingVolume / 2)}L)
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    onClick={(e) => {
                                      const input = e.currentTarget.parentElement?.parentElement?.querySelector('input[name="allocatedVolume"]') as HTMLInputElement;
                                      if (input) input.value = Math.min(1000, availableCapacity, allocation.remainingVolume).toString();
                                    }}
                                  >
                                    1000L
                                  </button>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex flex-col">
                                    <input
                                      type="number"
                                      name="allocatedVolume"
                                      placeholder="Volume"
                                      min="1"
                                      max={Math.min(availableCapacity, allocation.remainingVolume)}
                                      defaultValue={Math.min(availableCapacity, allocation.remainingVolume)}
                                      className="w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500"
                                      required
                                    />
                                    <span className="text-xs text-gray-400 mt-1">
                                      Max: {Math.min(availableCapacity, allocation.remainingVolume)}L
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">L</span>
                                  <input type="hidden" name="intent" value="assign" />
                                  <input type="hidden" name="batchId" value={batch.id} />
                                  <input type="hidden" name="tankId" value={tank.id} />
                                  <Button size="sm" type="submit">
                                    Assigner
                                  </Button>
                                </div>
                              </div>
                            </Form>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Aucune cuve disponible</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Barre de progression */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progression</span>
            <span>{allocation.allocatedVolume}L / {allocation.totalVolume}L</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${allocation.isFullyAllocated ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              style={{ width: `${allocation.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Liste des cuves assignées */}
        {allocation.tanks.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Cuves assignées</h4>
            <div className="grid gap-2">
              {allocation.tanks.map((tank) => (
                <div key={tank.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{tank.name}</p>
                    <p className="text-xs text-gray-600">
                      {tank.allocatedVolume}L / {tank.capacity}L ({tank.utilizationPercentage}%)
                    </p>
                  </div>
                  <Form method="POST" className="inline">
                    <input type="hidden" name="intent" value="unassign" />
                    <input type="hidden" name="batchId" value={batch.id} />
                    <input type="hidden" name="tankId" value={tank.id} />
                    <Button
                      variant="outline"
                      size="sm"
                      type="submit"
                      className="text-red-600 hover:text-red-700"
                    >
                      Retirer
                    </Button>
                  </Form>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
