import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { CommodityType, type Action, type Batch, type Process, type Stock } from "@prisma/client";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs
} from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Plus, Save, SquareArrowRight } from "lucide-react";
import { useState } from "react";
import { ConsumablesDataTable } from "../../components/consumables-data-table";
import { Field } from "../../components/forms";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { EditActionDialog } from "./production.$actionId.edit";
import { ActionSchema } from "./production.schema";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  if (!["USER"].includes(user.role)) {
    return redirect("/unauthorized");
  }

  const [actions, processes, batches, stocks] = await Promise.all([
    context.remixService.prisma.action.findMany({
      where: { userId: user.id },
      include: {
        consumables: true,
        process: {
          include: {
            batch: true,
          },
        },
      },
    }),
    context.remixService.prisma.process.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    }),
    context.remixService.prisma.batch.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    }),
    context.remixService.prisma.stock.findMany({
      where: { userId: user.id },
      include: {
        consumables: {
          select: {
            commodity: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { actions, processes, batches, stocks, user };
};

export type ProductionLoaderData = {
  actions: (Action & {
    consumables: {
      id: string;
      name: string;
      quantity: number;
      originalQuantity: number | null;
      unit: string;
      description: string | null;
      commodity: CommodityType;
    }[];
    process?: {
      batch?: {
        id: string;
        name: string;
      } | null;
    } | null;
  })[];
  processes: Process[];
  batches: Batch[];
  stocks: (Stock & {
    consumables: {
      commodity: CommodityType;
    }[];
  })[];
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const actionId = formData.get("actionId");
    if (!actionId) throw new Error("Action ID is required");

    await context.remixService.prisma.action.delete({
      where: { id: actionId as string },
    });
    return new Response(null, { status: 200 });
  }

  if (intent === "update-consumables") {
    const actionId = formData.get("actionId") as string;
    const consumablesData = JSON.parse(formData.get("consumables") as string);

    if (!actionId) throw new Error("Action ID is required");

    type ConsumableInput = {
      id?: string;
      name: string;
      unit: string;
      quantity: number;
      description?: string;
      commodity: CommodityType;
    };

    // Validation et nettoyage des consommables
    const validConsumables = (consumablesData as ConsumableInput[]).filter((c: ConsumableInput) =>
      c.name?.trim() && c.unit?.trim() && c.quantity > 0
    );

    await context.remixService.prisma.$transaction(async (tx) => {
      // Supprimer les anciens consommables de cette action
      await tx.consumable.deleteMany({
        where: { actionId }
      });

      // Créer ou mettre à jour les stocks et recréer les consommables
      const stocksMap = new Map<string, string>();

      for (const consumable of validConsumables) {
        // Skip les IDs temporaires créés côté client
        if (consumable.id?.startsWith('temp-')) {
          delete consumable.id;
        }

        const stockKey = `${consumable.name}|${consumable.unit}`;
        let stockId = stocksMap.get(stockKey);

        if (!stockId) {
          // Chercher le stock existant
          let stock = await tx.stock.findFirst({
            where: { name: consumable.name, unit: consumable.unit, userId: user.id },
          });

          if (!stock) {
            // Créer le stock s'il n'existe pas
            stock = await tx.stock.create({
              data: {
                name: consumable.name.trim(),
                unit: consumable.unit.trim(),
                quantity: 0,
                isOutOfStock: true,
                userId: user.id,
              },
            });
          }

          stockId = stock.id;
          stocksMap.set(stockKey, stockId);
        }

        // Créer le consommable
        await tx.consumable.create({
          data: {
            name: consumable.name.trim(),
            unit: consumable.unit.trim(),
            quantity: consumable.quantity,
            description: consumable.description?.trim() || null,
            commodity: consumable.commodity ?? CommodityType.FERMENTATION_ADDITIVES,
            actionId,
            stockId,
          },
        });
      }
    });

    return { success: true };
  }

  // 1. Parse dynamique des consommables
  const consumablesData: Array<{ name: string; unit: string; quantity: number; description?: string; commodity: CommodityType }> = [];
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^consumables\[(\d+)\]\.(.+)$/);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2];
      consumablesData[index] ??= { name: "", unit: "", quantity: 0, commodity: CommodityType.FERMENTATION_ADDITIVES };
      if (field === "quantity") consumablesData[index].quantity = parseFloat(value.toString()) || 0;
      else if (field === "commodity") consumablesData[index].commodity = value.toString() as CommodityType;
      else consumablesData[index][field] = value.toString();
    }
  }

  // 2. Validation Zod
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ActionSchema.superRefine(async (data, ctx) => {
      const existing = await context.remixService.prisma.action.findFirst({
        where: { type: data.type, userId: user.id },
      });
      if (existing) {
        ctx.addIssue({ code: "custom", path: ["type"], message: "Une action avec ce type existe déjà" });
      }
    }),
  });
  if (submission.status !== "success") return { result: submission.reply() };

  // 3. Nettoyage des consommables
  const validConsumables = consumablesData.filter(
    (c) => c.name?.trim() && c.unit?.trim() && c.quantity > 0
  );

  // 4. Transaction atomique
  await context.remixService.prisma.$transaction(async (tx) => {
    // a. Check et update ou création stock - et récupération des IDs
    const stocksMap = new Map<string, string>(); // key: "name|unit", value: stockId
    let hasInsufficientStock = false;

    for (const consumable of validConsumables) {
      const stockKey = `${consumable.name}|${consumable.unit}`;
      const stock = await tx.stock.findFirst({
        where: { name: consumable.name, unit: consumable.unit, userId: user.id },
      });

      if (stock) {
        if (stock.quantity < consumable.quantity) {
          // ✅ Flux tendu: Ne pas bloquer, juste marquer comme insuffisant
          hasInsufficientStock = true;
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              isOutOfStock: true
            },
          });
        } else {
          // Stock suffisant: consommer normalement
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantity: stock.quantity - consumable.quantity,
              isOutOfStock: stock.quantity - consumable.quantity <= 0,
            },
          });
        }
        stocksMap.set(stockKey, stock.id);
      } else {
        // Crée le stock avec 0 de quantité
        const newStock = await tx.stock.create({
          data: {
            name: consumable.name.trim(),
            unit: consumable.unit.trim(),
            quantity: 0,
            isOutOfStock: true,
            userId: user.id,
          },
        });
        stocksMap.set(stockKey, newStock.id);
        hasInsufficientStock = true;
      }
    }

    // b. Création de l'action avec ses consommables liés aux stocks
    await tx.action.create({
      data: {
        type: submission.value.type,
        description: submission.value.description ?? "",
        duration: submission.value.duration,
        needsPurchase: submission.value.needsPurchase,
        scaleWithVolume: false,
        referenceVolume: submission.value.referenceVolume,
        status: hasInsufficientStock ? "WAITING_STOCK" : "PENDING", // ✅ Marquer le statut
        userId: user.id,
        consumables: {
          create: validConsumables.map((c) => {
            const stockKey = `${c.name}|${c.unit}`;
            const stockId = stocksMap.get(stockKey);
            return {
              name: c.name.trim(),
              unit: c.unit.trim(),
              quantity: c.quantity,
              description: c.description?.trim() || null,
              commodity: c.commodity ?? CommodityType.FERMENTATION_ADDITIVES,
              stockId: stockId, // ✅ Liaison avec le stock !
            };
          }),
        },
      },
    });
  });

  return { result: submission.reply() };
};

export default function Production() {
  const { actions, processes, batches, stocks } = useLoaderData<ProductionLoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);

  // State pour gérer les consommables de chaque action
  const [actionConsumables, setActionConsumables] = useState<Record<string, typeof actions[0]['consumables']>>({});
  // State pour tracker les actions avec des modifications non sauvegardées
  const [unsavedActions, setUnsavedActions] = useState<Set<string>>(new Set());

  // Fonction pour sauvegarder les consommables d'une action
  const saveConsumables = async (actionId: string) => {
    const consumables = getActionConsumables(actionId);
    const formData = new FormData();
    formData.append("intent", "update-consumables");
    formData.append("actionId", actionId);
    formData.append("consumables", JSON.stringify(consumables));

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUnsavedActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(actionId);
          return newSet;
        });
        // Optionnel: afficher un message de succès
        console.log("Consommables sauvegardés avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  // Fonction pour marquer une action comme modifiée
  const markActionAsModified = (actionId: string) => {
    setUnsavedActions(prev => new Set(prev.add(actionId)));
  };

  // Fonction pour ajouter un consommable à une action
  const addConsumableToAction = (actionId: string) => {
    const newConsumable = {
      id: `temp-${Date.now()}`,
      name: "",
      quantity: 0,
      originalQuantity: null,
      unit: "",
      description: "",
      commodity: CommodityType.FERMENTATION_ADDITIVES
    };

    setActionConsumables(prev => ({
      ...prev,
      [actionId]: [...(prev[actionId] || actions.find(a => a.id === actionId)?.consumables || []), newConsumable]
    }));
    markActionAsModified(actionId);
  };

  // Fonction pour mettre à jour plusieurs champs d'un consommable en même temps
  const updateMultipleFields = (actionId: string, consumableId: string, updates: Record<string, string | number>) => {
    setActionConsumables(prev => ({
      ...prev,
      [actionId]: (prev[actionId] || actions.find(a => a.id === actionId)?.consumables || []).map(c =>
        c.id === consumableId ? { ...c, ...updates } : c
      )
    }));
    markActionAsModified(actionId);
  };

  // Fonction pour mettre à jour un consommable
  const updateConsumable = (actionId: string, consumableId: string, field: string, value: string | number) => {
    setActionConsumables(prev => ({
      ...prev,
      [actionId]: (prev[actionId] || actions.find(a => a.id === actionId)?.consumables || []).map(c =>
        c.id === consumableId ? { ...c, [field]: value } : c
      )
    }));
    markActionAsModified(actionId);
  };

  // Fonction pour supprimer un consommable
  const deleteConsumable = (actionId: string, consumableId: string) => {
    setActionConsumables(prev => ({
      ...prev,
      [actionId]: (prev[actionId] || actions.find(a => a.id === actionId)?.consumables || []).filter(c =>
        c.id !== consumableId
      )
    }));
    markActionAsModified(actionId);
  };

  // Fonction pour obtenir les consommables d'une action (avec les modifications)
  const getActionConsumables = (actionId: string) => {
    return actionConsumables[actionId] || actions.find(a => a.id === actionId)?.consumables || [];
  };

  const [form, fields] = useForm({
    id: "create-action",
    constraint: getZodConstraint(ActionSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ActionSchema });
    },
    lastResult: actionData?.result,
    onSubmit() {
      setOpen(false);
    },
    defaultValue: {
      type: "",
      description: "",
      duration: 0,
      needsPurchase: false,
      referenceVolume: 0,
    },
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Actions de production</h1>
          <p className="text-gray-600">
            Créez et gérez vos actions de production (ex: &quot;Fermentation&quot;, &quot;Clarification&quot;)
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle action
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle action</DialogTitle>
            </DialogHeader>

            <Form {...getFormProps(form)} method="POST" className="space-y-4">
              <Field
                inputProps={getInputProps(fields.type, { type: "text" })}
                labelsProps={{ children: "Type d'action (ex: Fermentation, Clarification)" }}
                errors={fields.type.errors}
              />

              <Field
                inputProps={getInputProps(fields.description, { type: "text" })}
                labelsProps={{ children: "Description (optionnel)" }}
                errors={fields.description.errors}
              />

              <Field
                inputProps={getInputProps(fields.duration, { type: "number", step: "0.1" })}
                labelsProps={{ children: "Durée (j)" }}
                errors={fields.duration.errors}
              />

              <Field
                inputProps={getInputProps(fields.referenceVolume, { type: "number", step: "0.1" })}
                labelsProps={{ children: "Volume de référence (L) - pour calculer les proportions quand l'action sera assignée" }}
                errors={fields.referenceVolume.errors}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Création..." : "Créer l'action"}
                </Button>
              </div>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {actions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <SquareArrowRight className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune action</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer votre première action
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
            actions.map((actionItem) => (
              <Card key={actionItem.id}>
                <Accordion type="single"
                  collapsible
                  className="w-full"
                >
                  <AccordionItem value={actionItem.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{actionItem.type}</CardTitle>
                          {actionItem.description && (
                            <CardDescription>{actionItem.description}</CardDescription>
                          )}
                          <div className="flex flex-row gap-6 mt-2">
                            <div className="flex flex-col gap-2">
                              <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                                <p className="font-bold ">Durée de l&apos;action (J) :
                                </p>
                                <p>
                                  {actionItem.duration}
                                </p>
                              </div>
                              <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                                <p className="font-bold ">Volume de référence (L) :
                                </p>
                                <p>
                                  {actionItem.referenceVolume ? `${actionItem.referenceVolume}L` : "Non défini"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                                <p className="font-bold ">Cuvée :
                                </p>
                                <p>
                                  {batches.find((batch) => batch.id === actionItem?.process?.batch?.id)?.name || "Non assigné"}
                                </p>
                              </div>
                              <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                                <p className="font-bold">Processus :
                                </p>
                                <p>
                                  {processes.find((process) => process.id === actionItem.processId)?.name || "Non assigné"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {/* eslint-disable @typescript-eslint/no-explicit-any */}
                          <EditActionDialog production={actionItem as any} />
                          {/* eslint-enable @typescript-eslint/no-explicit-any */}
                          <AccordionTrigger className="px-4 py-0 h-8 w-[32px] border border-input rounded-md flex items-center justify-center">
                          </AccordionTrigger>
                        </div>
                      </div>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-600">Liste des consommables :</h4>
                            <div className="flex gap-2">
                              <Button size="icon" onClick={() => addConsumableToAction(actionItem.id)} className="size-8">
                                <Plus className="w-4 h-4" />
                              </Button>
                              {unsavedActions.has(actionItem.id) && (
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  onClick={() => saveConsumables(actionItem.id)}
                                  disabled={isSubmitting}
                                  className="size-8"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <ConsumablesDataTable
                            consumables={getActionConsumables(actionItem.id)}
                            stocks={stocks}
                            editable={true}
                            onUpdateConsumable={(consumableId, field, value) => updateConsumable(actionItem.id, consumableId, field, value)}
                            onDeleteConsumable={(consumableId) => deleteConsumable(actionItem.id, consumableId)}
                            onUpdateMultipleFields={(consumableId, updates) => updateMultipleFields(actionItem.id, consumableId, updates)}
                          />
                        </div>
                      </CardContent>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
