import { parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs
} from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { SquareArrowRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { ProcessLoaderData } from "./process";

export const ProcessActionSchema = z.object({
  type: z.string().min(1, "Le type d'action est requis"),
  description: z.string().min(1, "La description est requise"),
  duration: z.coerce.number().min(1, "La durée doit être supérieure à 0"),
  needsPurchase: z.boolean().optional(),
});



export const action = async ({ request, params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const processId = params.processId;

  if (!processId) {
    throw new Error("Process ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Assigner une action existante au processus
  if (intent === "assign") {
    const actionId = formData.get("actionId");
    const assignedDate = formData.get("assignedDate");

    if (!actionId) {
      throw new Error("Action ID is required");
    }

    // Récupérer l'action avec ses consommables
    const action = await context.remixService.prisma.action.findUnique({
      where: { id: actionId.toString(), userId: user.id },
      include: {
        consumables: true,
      },
    });

    if (!action) {
      throw new Error("Action not found");
    }

    // Récupérer le processus avec le batch et tank pour connaître le volume
    const process = await context.remixService.prisma.process.findUnique({
      where: { id: processId, userId: user.id },
      include: {
        batch: {
          include: {
            tanks: true,
          },
        },
      },
    });

    if (!process) {
      throw new Error("Process not found");
    }

    // Calculer les nouvelles quantités si applicable
    if (action.referenceVolume && process.batch?.tanks?.[0]?.capacity) {
      const tankVolume = process.batch.tanks[0].capacity;
      const scaleFactor = tankVolume / action.referenceVolume;

      // Mettre à jour les consommables avec les quantités calculées
      for (const consumable of action.consumables) {
        const scaledQuantity = Math.round((consumable.quantity * scaleFactor) * 100) / 100;

        await context.remixService.prisma.consumable.update({
          where: { id: consumable.id },
          data: {
            originalQuantity: consumable.quantity, // Sauvegarder la quantité originale
            quantity: scaledQuantity, // Nouvelle quantité calculée
          },
        });
      }
    }

    // Mettre à jour l'action
    await context.remixService.prisma.action.update({
      where: { id: actionId.toString(), userId: user.id },
      data: {
        processId: processId,
        assignedDate: assignedDate ? new Date(assignedDate.toString()) : null,
        scaleWithVolume: true, // Activer automatiquement l'adaptation au volume lors de l'assignation
      },
    });

    return new Response(null, { status: 200 });
  }

  // Retirer une action du processus
  if (intent === "unassign") {
    const actionId = formData.get("actionId");
    if (!actionId) {
      throw new Error("Action ID is required");
    }

    // Récupérer l'action avec ses consommables
    const action = await context.remixService.prisma.action.findUnique({
      where: { id: actionId.toString(), userId: user.id },
      include: {
        consumables: true,
      },
    });

    if (!action) {
      throw new Error("Action not found");
    }

    // Restaurer les quantités originales des consommables
    for (const consumable of action.consumables) {
      if (consumable.originalQuantity !== null) {
        await context.remixService.prisma.consumable.update({
          where: { id: consumable.id },
          data: {
            quantity: consumable.originalQuantity, // Restaurer la quantité originale
            originalQuantity: null, // Supprimer la sauvegarde
          },
        });
      }
    }

    // Mettre à jour l'action
    await context.remixService.prisma.action.update({
      where: { id: actionId.toString(), userId: user.id },
      data: {
        processId: null,
        assignedDate: null,
        scaleWithVolume: false, // Désactiver l'adaptation au volume quand l'action redevient template
      },
    });

    return new Response(null, { status: 200 });
  }

  // Créer une nouvelle action et l'assigner au processus
  const submission = parseWithZod(formData, {
    schema: ProcessActionSchema,
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }


  return { result: submission.reply() };
};

export function CreateActionDialog({
  process,
  availableActions
}: {
  process: ProcessLoaderData['processes'][number]
  availableActions: ProcessLoaderData['allActions']
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SquareArrowRight className="w-4 h-4 mr-1" />
          Actions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Actions pour {process.name}</DialogTitle>
        </DialogHeader>
        {/* Actions actuellement assignées */}
        {process.actions && process.actions.length > 0 && (
          <div className="p-3 rounded-lg border border-green-200 mb-4">
            <h4 className="font-medium text-green-900 mb-2">
              Actions assignées ({process.actions.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {process.actions.map((action) => (
                <div key={action.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">{action.type}</h4>
                      <p className="text-sm text-green-700">{`${action.duration} jours - Début: ${new Date(action.assignedDate ?? "").toLocaleDateString()}`}</p>
                    </div>
                    <Form method="POST" action={`/process/${process.id}/actions`}>
                      <input type="hidden" name="intent" value="unassign" />
                      <input type="hidden" name="actionId" value={action.id} />
                      <Button variant="outline" size="sm" type="submit">
                        Retirer
                      </Button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          </div>

        )}

        {/* Actions disponibles à assigner */}
        <div className="space-y-4">
          {availableActions.length > 0 ? (
            <>
              <div>
                <h4 className="font-medium mb-2">Assigner une action existante</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableActions.map((action) => (
                    <Form key={action.id} method="POST" action={`/process/${process.id}/actions`} className="p-3 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{action.type}</p>
                          <p className="text-sm text-gray-600">{action.duration} jours</p>
                          {action.description && (
                            <p className="text-xs text-gray-500">{action.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <label htmlFor={`assignedDate-${action.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                            Date de début (optionnel)
                          </label>
                          {(() => {
                            // Calculer la date minimale basée sur les actions précédentes
                            const sortedActions = process.actions
                              .filter(a => a.assignedDate)
                              .sort((a, b) => new Date(a.assignedDate!).getTime() - new Date(b.assignedDate!).getTime());

                            let minDate = new Date().toISOString().split('T')[0]; // Aujourd'hui par défaut

                            if (sortedActions.length > 0) {
                              const lastAction = sortedActions[sortedActions.length - 1];
                              const lastActionEnd = new Date(lastAction.assignedDate!);
                              lastActionEnd.setDate(lastActionEnd.getDate() + lastAction.duration);
                              minDate = lastActionEnd.toISOString().split('T')[0];
                            }

                            return (
                              <>
                                <input
                                  id={`assignedDate-${action.id}`}
                                  type="date"
                                  name="assignedDate"
                                  min={minDate}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {sortedActions.length > 0 && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    Date minimale : {new Date(minDate).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <div className="pt-5">
                          <input type="hidden" name="intent" value="assign" />
                          <input type="hidden" name="actionId" value={action.id} />
                          <Button size="sm" type="submit">Assigner</Button>
                        </div>
                      </div>
                    </Form>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <Link to="/production">
                  <Button
                    className="w-full"
                  >
                    Ou créer une nouvelle action
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <SquareArrowRight className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Aucune action disponible</h4>
              <p className="text-sm text-gray-600 mb-4">
                Créez votre première action pour ce processus
              </p>
              <Link to="/production">
                <Button className="w-full">
                  Créer une action
                </Button>
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
