import { parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs
} from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { Grape, MapPin, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Field, SelectField } from "../../components/forms";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { PlotTankSchema } from "../../lib/schemas";
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
    const submission = parseWithZod(formData, { schema: PlotTankSchema });

    if (submission.status !== "success") {
      return { result: submission.reply() };
    }

    const { plotId, volume, harvestDate, yieldRatio } = submission.value;

    // Vérifier que la cuve existe
    const tank = await context.remixService.prisma.tank.findUnique({
      where: { id: tankId, userId: user.id },
      include: {
        plotTanks: true,
        grapeComposition: true
      }
    });

    if (!tank) {
      throw new Error("Tank not found");
    }

    // Vérifier que la parcelle existe
    const plot = await context.remixService.prisma.plot.findUnique({
      where: { id: plotId, userId: user.id },
    });

    if (!plot) {
      throw new Error("Plot not found");
    }

    // Calculer le volume actuellement utilisé dans la cuve
    const currentVolume = tank.plotTanks.reduce((total, pt) => total + pt.volume, 0) -
      tank.grapeComposition.reduce((total, gc) => total + gc.volume, 0);
    // Vérifier la capacité disponible
    const availableCapacity = tank.volume - currentVolume;
    if (volume > availableCapacity) {
      throw new Error(`Volume trop important. Capacité disponible: ${availableCapacity.toFixed(1)} hL`);
    }

    // Calculer le volume maximum théorique de la parcelle
    const maxPlotVolume = plot.surface * yieldRatio;
    if (volume > maxPlotVolume) {
      throw new Error(`Volume trop important pour cette parcelle. Volume max théorique: ${maxPlotVolume.toFixed(1)} hL (${plot.surface} ha × ${yieldRatio} hL/ha)`);
    }

    // Créer l'assignation plotTank
    await context.remixService.prisma.plotTank.create({
      data: {
        plotId,
        tankId,
        volume,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
      },
    });

    // --- Synchroniser grapeComposition après assignation d'un plot ---
    // On ajoute la quantité à grapeComposition pour le cépage de la parcelle
    const existingGrape = await context.remixService.prisma.grapeComposition.findUnique({
      where: {
        tankId_grapeVariety: {
          tankId: tankId,
          grapeVariety: plot.grapeVariety,

        }
      }
    });

    if (existingGrape) {
      // Si le cépage existe déjà, on additionne la quantité
      await context.remixService.prisma.grapeComposition.update({
        where: { id: existingGrape.id },
        data: { volume: existingGrape.volume + volume, percentage: (existingGrape.volume + volume) / tank.volume * 100 }
      });
    } else {
      // Sinon, on crée une nouvelle entrée
      await context.remixService.prisma.grapeComposition.create({
        data: {
          tankId: tankId,
          grapeVariety: plot.grapeVariety,
          volume: volume,
          percentage: (volume / tank.volume) * 100,
          addedAt: harvestDate ? new Date(harvestDate) : new Date()
        }
      });
    }
    // --- Fin synchronisation grapeComposition ---

    const fillingActionType = await context.remixService.prisma.actionType.findFirst({
      where: {
        name: { contains: "REMPLISSAGE", mode: "insensitive" }
      }
    });
    if (!fillingActionType) {
      throw new Error("Type d'action REMPLISSAGE non trouvé");
    }
    // Créer l'action de remplissage
    await context.remixService.prisma.action.create({
      data: {
        tankId,
        userId: user.id,
        typeId: fillingActionType.id,
        duration: 1,
        needsPurchase: false,
        isCompleted: true,
        startedAt: harvestDate ? new Date(harvestDate) : new Date(),
        finishedAt: harvestDate ? new Date(harvestDate) : new Date(),
      },
    });

    // Mettre à jour le statut de la cuve si elle devient utilisée
    if (tank.status === "EMPTY") {
      await context.remixService.prisma.tank.update({
        where: { id: tankId },
        data: { status: "IN_USE" }
      });
    }

    return new Response(null, { status: 200 });
  }

  return new Response("Invalid intent", { status: 400 });
};

export function AddPlotDialog({
  tank,
  plots
}: {
  tank: MyCellarLoaderData['tanks'][number];
  plots: MyCellarLoaderData['plots']
}) {
  const [open, setOpen] = useState(false);
  const [yieldRatio, setYieldRatio] = useState(60); // hL/hectare par défaut

  // Filtrer les parcelles disponibles (pas encore entièrement utilisées)
  const availablePlots = plots.filter(plot => {
    const totalUsed = plot.plotTanks?.reduce((sum, pt) => sum + pt.volume, 0) || 0;
    const maxVolume = plot.surface * yieldRatio;
    return totalUsed < maxVolume;
  });

  // Parcelles actuellement assignées à cette cuve
  const assignedPlots = tank.plotTanks || [];

  // Calculer le volume total utilisé dans la cuve
  const totalUsedVolume = tank.plotTanks.reduce((sum, pt) => sum + pt.volume, 0)
  const availableCapacity = tank.volume - totalUsedVolume;

  const tankVolume = tank.grapeComposition.reduce((sum, grape) => sum + grape.volume, 0)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' className="min-w-40 gap-2">
          <Grape className="w-4 h-4" />
          Mise en cuve
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Mise en {tank.name} des cépages</DialogTitle>
          <DialogDescription>Ce menu permet d&apos;assigner une/plusieurs récolte(s) d&apos;une/plusieurs parcelle(s) à une cuve, il utilise un ratio de conversion pour calculer le volume qui sera dans la cuve.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Info générale de la cuve */}
          <h4 className="font-medium mb-3">Volume de la cuve</h4>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <p className="font-bold">Capacité:</p>
                <p>{tank.volume} hL</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold">Utilisé:</p>
                <p>{tankVolume.toFixed(1)} hL</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold">Disponible:</p>
                <p>{availableCapacity.toFixed(1)} hL</p>
              </div>
            </div>
          </div>

          {/* Parcelles actuellement assignées */}
          {assignedPlots.length > 0 && (
            <div>
              <h4 className="font-medium text-green-900 mb-3">Cépages assignés</h4>
              <div className="space-y-2">
                {assignedPlots.map((plotTank) => (
                  <div key={plotTank.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex flex-col items-start">
                          <h5 className="font-medium text-green-7w00">{plotTank.plot.name} • {plotTank.plot.surface} ha</h5>
                          <div className="flex flex-row items-center gap-2">
                            <p className="text-sm font-semibold text-green-800">
                              {plotTank.volume} hL
                            </p>
                            <p className="text-sm text-green-800">
                              {plotTank.plot.grapeVariety}
                            </p>
                          </div>
                          {plotTank.harvestDate && (
                            <p className="text-xs text-green-600">
                              Récolté le {new Date(plotTank.harvestDate).toLocaleDateString()}
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
              <h4 className="font-medium text-amber-900">Ratio de conversion</h4>
            </div>
            <p className="text-sm text-amber-700">
              Rendement typique : 40-80 hL/ha (blanc), 50-90 hL/ha (rouge)
            </p>
            <div className="flex flex-row items-center gap-3">
              <Field
                inputProps={{
                  type: "number",
                  min: "10",
                  max: "200",
                  step: "5",
                  value: yieldRatio,
                  onChange: (e) => setYieldRatio(Number(e.target.value)),
                  className: "w-20"
                }}
                labelsProps={{ children: "hL/hectare" }}
              />
            </div>
          </div>

          {/* Assigner une nouvelle parcelle */}
          {availablePlots.length > 0 ? (
            <div>
              <h4 className="font-medium mb-3">Assigner une parcelle</h4>
              <Form method="POST" action={`/my-cellar/${tank.id}/addPlot`} className="space-y-4">
                <input type="hidden" name="intent" value="assign" />
                <input type="hidden" name="yieldRatio" value={yieldRatio} />

                {/* Sélection de la parcelle */}
                <SelectField
                  name="plotId"
                  defaultValue={availablePlots.length > 0 ? availablePlots[0].id : "no-plot"}
                  labelsProps={{ children: "Cépage disponible :" }}
                  options={availablePlots.map((plot) => {
                    const totalUsed = plot.plotTanks?.reduce((sum, pt) => sum + pt.volume, 0) || 0;
                    const maxVolume = plot.surface * yieldRatio;
                    const remainingVolume = maxVolume - totalUsed;

                    return {
                      id: plot.id,
                      name: `${plot.grapeVariety} - ${remainingVolume.toFixed(1)} hL disponibles`
                    };
                  })}
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
                  <p><strong>Conseil:</strong> Vérifiez que le volume ne dépasse pas la capacité de la parcelle ni de la cuve</p>
                </div>

                {/* Date de récolte */}
                <Field
                  inputProps={{
                    type: "date",
                    name: "harvestDate"
                  }}
                  labelsProps={{ children: "Date de récolte (optionnel)" }}
                />

                <Button type="submit">
                  Assigner la parcelle
                </Button>
              </Form>
            </div>
          ) : (
            <div className="text-center py-6">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Aucune parcelle disponible</h4>
              <p className="text-sm text-gray-600 mb-4">
                Toutes vos parcelles sont entièrement utilisées ou vous n&apos;avez pas encore de parcelles.
              </p>
              <Link to="/vineyard">
                <Button className="w-full">
                  Gérer les parcelles
                </Button>
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog >
  );
}
