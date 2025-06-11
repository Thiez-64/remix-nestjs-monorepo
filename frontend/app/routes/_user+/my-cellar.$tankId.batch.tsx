import { parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs
} from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { Grape } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { MyCellarLoaderData } from "./my-cellar";

export const BatchSchema = z.object({
  name: z.string().min(1, "Le nom du lot est requis"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "La quantité doit être supérieure à 0"),
});


export const action = async ({ request, params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const tankId = params.tankId;

  if (!tankId) {
    throw new Error("Tank ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Assigner un batch existant à la cuve avec volume spécifique
  if (intent === "assign") {
    const batchId = formData.get("batchId");
    const allocatedVolumeStr = formData.get("allocatedVolume");

    if (!batchId) {
      throw new Error("Batch ID is required");
    }

    const allocatedVolume = allocatedVolumeStr ? parseFloat(allocatedVolumeStr.toString()) : 0;

    // Vérifier la capacité disponible de la cuve
    const tank = await context.remixService.prisma.tank.findUnique({
      where: { id: tankId, userId: user.id },
    });

    if (!tank) {
      throw new Error("Tank not found");
    }

    if (allocatedVolume <= 0) {
      throw new Error("Le volume doit être supérieur à 0");
    }

    const availableCapacity = tank.capacity - tank.allocatedVolume;
    if (allocatedVolume > availableCapacity) {
      throw new Error(`Volume trop important. Capacité disponible: ${availableCapacity}L`);
    }

    // Vérifier le volume restant du batch
    const batch = await context.remixService.prisma.batch.findUnique({
      where: { id: batchId.toString(), userId: user.id },
      include: { tanks: true },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    const currentlyAllocated = batch.tanks.reduce(
      (total, t) => total + t.allocatedVolume,
      0
    );
    const remainingVolume = batch.quantity - currentlyAllocated;

    if (allocatedVolume > remainingVolume) {
      throw new Error(`Volume trop important. Volume restant: ${remainingVolume}L`);
    }

    // Effectuer l'assignation
    await context.remixService.prisma.tank.update({
      where: { id: tankId, userId: user.id },
      data: {
        batchId: batchId.toString(),
        allocatedVolume: tank.allocatedVolume + allocatedVolume,
        status: "IN_USE",
      },
    });

    return new Response(null, { status: 200 });
  }

  // Retirer le batch de la cuve
  if (intent === "unassign") {
    await context.remixService.prisma.tank.update({
      where: { id: tankId, userId: user.id },
      data: {
        batchId: null,
        allocatedVolume: 0,
        status: "EMPTY"
      },
    });

    return new Response(null, { status: 200 });
  }

  // Créer un nouveau batch
  const submission = parseWithZod(formData, {
    schema: BatchSchema,
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  const newBatch = await context.remixService.prisma.batch.create({
    data: {
      ...submission.value,
      userId: user.id,
    },
  });

  // Assigner automatiquement le nouveau batch à la cuve
  await context.remixService.prisma.tank.update({
    where: { id: tankId, userId: user.id },
    data: { batchId: newBatch.id },
  });

  return { result: submission.reply() };
};

export function CreateMyCellarBatchDialog({ tank, batches }: { tank: MyCellarLoaderData['tanks'][number]; batches: MyCellarLoaderData['batches'] }) {
  const [open, setOpen] = useState(false);

  // Filtrer les cuvées qui ont encore du volume disponible (pas entièrement allouées)
  const availableBatches = batches.filter(batch => {
    // Si c'est la cuvée actuelle de cette cuve, on peut toujours l'ajuster
    if (batch.id === tank.batchId) {
      return true;
    }
    // Sinon, vérifier qu'elle n'est pas entièrement allouée
    return !batch.isFullyAllocated;
  });

  // Calculer les informations de la cuvée actuelle
  const currentBatchInfo = tank.batch ? {
    ...tank.batch,
    allocatedVolume: tank.allocatedVolume,
    remainingVolume: tank.batch.quantity - tank.allocatedVolume,
    progressPercentage: Math.round((tank.allocatedVolume / tank.batch.quantity) * 100)
  } : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Grape className="w-4 h-4 mr-1" />
          Cuvées
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cuvée pour {tank.name}</DialogTitle>
        </DialogHeader>

        {/* Cuvée actuellement assignée */}
        {currentBatchInfo && (
          <div className="p-3 rounded-lg border border-green-200 mb-4">
            <h4 className="font-medium text-green-900 mb-2">
              Cuvée assignée
            </h4>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex flex-row items-center gap-4">
                    <h4 className="font-medium text-green-900">{currentBatchInfo.name}</h4>
                    <p className="text-sm text-green-700">
                      {tank.allocatedVolume}L sur cette cuve
                    </p>
                  </div>
                  {currentBatchInfo.description && (
                    <p className="text-xs text-green-600 mt-1">{currentBatchInfo.description}</p>
                  )}

                  {/* Informations sur l'allocation totale de la cuvée */}
                  <div className="mt-2 text-xs text-green-600">
                    <p>Total cuvée: {tank.batch?.quantity}L</p>
                    <p>Total alloué: {batches.find(b => b.id === tank.batch?.id)?.totalAllocated || 0}L</p>
                    <p>Restant à allouer: {batches.find(b => b.id === tank.batch?.id)?.remainingVolume || 0}L</p>
                  </div>

                  <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${Math.round(((batches.find(b => b.id === tank.batch?.id)?.totalAllocated || 0) / (tank.batch?.quantity || 1)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <Form method="POST" action={`/my-cellar/${tank.id}/batch`}>
                  <input type="hidden" name="intent" value="unassign" />
                  <Button variant="outline" size="sm" type="submit">
                    Retirer
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        )}

        {/* Cuvées disponibles à assigner */}
        <div className="space-y-4">
          {availableBatches.length > 0 ? (
            <>
              <div>
                <h4 className="font-medium mb-2">Assigner une cuvée existante</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableBatches.map((batch) => {
                    // Calculer la capacité disponible de la cuve
                    const tankAvailableCapacity = tank.capacity - tank.allocatedVolume;

                    // Calculer le volume restant de la cuvée (en utilisant les données enrichies du loader)
                    const batchRemainingVolume = batch.remainingVolume;

                    // Volume maximum assignable = minimum entre capacité cuve et volume restant cuvée
                    const maxAssignableVolume = Math.min(tankAvailableCapacity, batchRemainingVolume);

                    // Si c'est la cuvée déjà assignée à cette cuve, on peut ajuster
                    const isCurrentBatch = batch.id === tank.batchId;

                    if (maxAssignableVolume <= 0 && !isCurrentBatch) {
                      return null; // Ne pas afficher si pas de volume disponible
                    }

                    return (
                      <Form key={batch.id} method="POST" action={`/my-cellar/${tank.id}/batch`} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-row items-center gap-4">
                              <p className="font-medium">{batch.name}</p>
                              <p className="text-sm text-gray-600">
                                {batch.remainingVolume}L restants
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              Total: {batch.quantity}L • Alloué: {batch.totalAllocated}L
                            </p>
                            {batch.isFullyAllocated && (
                              <p className="text-xs text-amber-600">⚠️ Cuvée entièrement allouée</p>
                            )}
                          </div>
                        </div>

                        {batch.description && (
                          <p className="text-xs text-gray-500">{batch.description}</p>
                        )}

                        {maxAssignableVolume > 0 && (
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <Field
                                inputProps={{
                                  type: "number",
                                  name: "allocatedVolume",
                                  min: "1",
                                  max: maxAssignableVolume,
                                  defaultValue: maxAssignableVolume,
                                  className: "text-xs",
                                  required: true
                                }}
                                labelsProps={{
                                  children: `Volume à assigner (max: ${maxAssignableVolume}L)`,
                                  className: "text-xs font-medium text-gray-700"
                                }}
                              />
                              <div className="flex space-x-1 mt-1">
                                <span className="text-xs text-gray-500">Suggestions:</span>
                                <button
                                  type="button"
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  onClick={(e) => {
                                    const input = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('input[name="allocatedVolume"]') as HTMLInputElement;
                                    if (input) input.value = maxAssignableVolume.toString();
                                  }}
                                >
                                  Max ({maxAssignableVolume}L)
                                </button>
                                {maxAssignableVolume >= 1000 && (
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    onClick={(e) => {
                                      const input = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('input[name="allocatedVolume"]') as HTMLInputElement;
                                      if (input) input.value = Math.min(1000, maxAssignableVolume).toString();
                                    }}
                                  >
                                    1000L
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <input type="hidden" name="intent" value="assign" />
                              <input type="hidden" name="batchId" value={batch.id} />
                              <Button size="sm" type="submit">Assigner</Button>
                            </div>
                          </div>
                        )}
                      </Form>
                    );
                  })}
                </div>
              </div>
              <div className="border-t pt-4">
                <Link to="/batch">
                  <Button className="w-full">
                    Créer une nouvelle cuvée
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Grape className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Aucune cuvée disponible</h4>
              <p className="text-sm text-gray-600 mb-4">
                {tank.batch
                  ? "Cette cuve a déjà une cuvée assignée ou toutes les cuvées sont entièrement allouées"
                  : "Créez votre première cuvée pour cette cuve"
                }
              </p>
              <Link to="/batch">
                <Button className="w-full">
                  Créer une cuvée
                </Button>
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
