import { parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs
} from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { TrendingUp, Wine } from "lucide-react";
import { useState } from "react";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { BatchSchema } from "../../lib/schemas";
import { requireUser } from "../../server/auth.server";
import { MyCellarLoaderData } from "./my-cellar";

export const action = async ({ request, params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const tankId = params.tankId;

  if (!tankId) {
    throw new Error("Tank ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Assigner une parcelle à la cuve

  if (intent === "assign") {
    const submission = parseWithZod(formData, { schema: BatchSchema });

    if (submission.status !== "success") {
      return { result: submission.reply() };
    }

    const { volume, createdAt, name } = submission.value;

    // 1. Récupérer la cuve avec sa composition
    const tank = await context.remixService.prisma.tank.findUnique({
      where: { id: tankId, userId: user.id },
      include: { grapeComposition: true }
    });
    if (!tank) throw new Error("Tank not found");

    // 2. Calculer le volume utilisé et disponible dans la cuve
    const usedVolume = tank.grapeComposition.reduce((sum, comp) => sum + comp.volume, 0);

    // 3. Vérifier que le volume demandé n'excède pas le volume utilisé
    if (volume > usedVolume) {
      return { result: { error: "Volume demandé supérieur au volume disponible dans la cuve" } };
    }

    // 4. Créer le batch (lot de conditionnement)
    await context.remixService.prisma.batch.create({
      data: {
        name: name || `Batch ${new Date().toLocaleDateString()}`,
        tankId,
        volume,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        userId: user.id,
      },
    });

    // 5. Retirer le volume mis en batch de la composition de la cuve
    let remainingToRemove = volume;
    const updatedCompo = [...tank.grapeComposition];

    // On retire proportionnellement à chaque cépage
    for (const comp of updatedCompo) {
      if (remainingToRemove <= 0) break;
      const proportion = comp.volume / usedVolume;
      const toRemove = Math.min(comp.volume, volume * proportion);
      comp.volume -= toRemove;
      remainingToRemove -= toRemove;
    }

    // On filtre les cépages à 0 et prépare les updates
    const newCompo = updatedCompo
      .filter(comp => comp.volume > 0)
      .map(comp => ({
        tankId: tank.id,
        grapeVariety: comp.grapeVariety,
        volume: comp.volume,
        addedAt: comp.addedAt,
        percentage: comp.percentage
      }));

    // On supprime toute la composition puis on recrée la nouvelle (Prisma)
    await context.remixService.prisma.grapeComposition.deleteMany({
      where: { tankId: tank.id },
    });
    if (newCompo.length > 0) {
      await context.remixService.prisma.grapeComposition.createMany({
        data: newCompo,
      });
    }

    // 6. Si le batch utilise tout le volume dispo, passer la cuve en MAINTENANCE
    if (volume === usedVolume) {
      await context.remixService.prisma.tank.update({
        where: { id: tankId },
        data: { status: "MAINTENANCE" }
      });
    }

    // 7. Créer une action de type "MISE EN BATCH" ou "CONDITIONNEMENT" pour la traçabilité
    const batchActionType = await context.remixService.prisma.actionType.findFirst({
      where: {
        OR: [
          { name: { contains: "CONDITIONNEMENT", mode: "insensitive" } },
        ]
      }
    });
    if (batchActionType) {
      await context.remixService.prisma.action.create({
        data: {
          tankId,
          userId: user.id,
          typeId: batchActionType.id,
          duration: 1,
          needsPurchase: false,
          isCompleted: true,
          startedAt: createdAt ? new Date(createdAt) : new Date(),
          finishedAt: createdAt ? new Date(createdAt) : new Date(),
        },
      });
    }

    // 8. Succès
    return new Response(null, { status: 200 });
  }


  return new Response("Invalid intent", { status: 400 });
};

export function RemoveWineDialog({
  tank,
}: {
  tank: MyCellarLoaderData['tanks'][number];
}) {
  const [open, setOpen] = useState(false);
  const [yieldRatio, setYieldRatio] = useState(1.5); // hL/hectare par défaut


  // Batches actuellement assignées à cette cuve
  const assignedBatches = tank.batches || [];
  const availableBatches = tank.grapeComposition.reduce((sum, grape) => sum + grape.volume, 0)
  // Calculer le volume total utilisé dans la cuve

  const availableCapacity = tank.grapeComposition.reduce((sum, grape) => sum + grape.volume, 0)


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' className="min-w-40 gap-2">
          <Wine className="w-4 h-4" />
          Mise en bouteille
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Conditionnement du contenu de la {tank.name}</DialogTitle>
          <DialogDescription>Ce menu permet retirer une partie ou la totalité de la cuve, il utilise un ratio de conversion pour calculer le volume qui perdu lors du conditionnement.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Info générale de la cuve */}
          <h4 className="font-medium mb-3">Volume du conditionnement</h4>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <p className="font-bold">Capacité:</p>
                <p>{availableCapacity.toFixed(1)} hL</p>
              </div>
            </div>
          </div>

          {/* Parcelles actuellement assignées */}
          {assignedBatches.length > 0 && (
            <div>
              <h4 className="font-medium text-green-900 mb-3">Batches assignés</h4>
              <div className="space-y-2">
                {assignedBatches.map((batch) => (
                  <div key={batch.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex flex-col items-start">
                          <h5 className="font-medium text-green-7w00">{batch.name} • {batch.volume} hL</h5>
                          <div className="flex flex-row items-center gap-2">
                            <p className="text-sm font-semibold text-green-800">
                              {batch.volume} hL
                            </p>
                            <p className="text-sm text-green-800">
                              {tank.batches.filter(b => b.id === batch.tankId).map(b => b.name)}
                            </p>
                          </div>
                          {batch.createdAt && (
                            <p className="text-xs text-green-600">
                              Récolté le {new Date(batch.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratio de conversion */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <h4 className="font-medium text-amber-900">Ratio de filtration</h4>
            </div>
            <p className="text-sm text-amber-700">
              Perte moyenne estimée : 1,5 %
            </p>
            <div className="flex flex-row items-center gap-3">
              <Field
                inputProps={{
                  type: "number",
                  min: "0.1",
                  max: "20",
                  step: "0.1",
                  value: yieldRatio,
                  onChange: (e) => setYieldRatio(Number(e.target.value)),
                  className: "w-20"
                }}
                labelsProps={{ children: "hL/hectare" }}
              />
            </div>
          </div>

          {/* Assigner une nouvelle parcelle */}
          {availableBatches > 0 ? (
            <div>
              <h4 className="font-medium mb-3">Retirer une partie ou la totalité de la cuve</h4>
              <Form method="POST" action={`/my-cellar/${tank.id}/removeWine`} className="space-y-4">
                <input type="hidden" name="intent" value="assign" />
                <input type="hidden" name="yieldRatio" value={yieldRatio} />

                {/* Sélection le vin */}
                <p className="text-gray-500 text-sm">Cépages disponibles:</p>
                <p>{tank.grapeComposition.map(grape => `${grape.grapeVariety} - ${grape.volume.toFixed(1)} hL`).join(", ")}</p>
                <Field
                  inputProps={{
                    type: "text",
                    name: "name",
                    required: true
                  }}
                  labelsProps={{
                    children: "Nom du batch"
                  }}
                />
                {/* Volume à assigner */}
                <Field
                  inputProps={{
                    type: "number",
                    name: "volume",
                    min: "0.1",
                    step: "0.1",
                    required: true
                  }}
                  labelsProps={{
                    children: "Volume à transférer (hL)"
                  }}
                />
                <div className="text-xs text-gray-600">
                  <p><strong>Conseil:</strong> Vérifiez que le volume ne dépasse pas la capacité de le volume du nombre de bouteille/bib disponible</p>
                </div>

                {/* Date de récolte */}
                <Field
                  inputProps={{
                    type: "date",
                    name: "createdAt"
                  }}
                  labelsProps={{ children: "Date de conditionnement" }}
                />

                <Button type="submit">
                  Retirer le vin
                </Button>
              </Form>
            </div>
          ) : (
            <div className="text-center py-6">
              <Wine className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Aucun vin disponible</h4>
              <p className="text-sm text-gray-600 mb-4">
                Toutes vos cuves sont entièrement vides ou en cours de fabrication vous n&apos;avez pas encore de vins.
              </p>
              <Link to="/my-cellar">
                <Button className="w-full">
                  Gérer les cuves
                </Button>
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog >
  );
}
