import { parseWithZod } from "@conform-to/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { ArrowDown, Plus } from "lucide-react";
import React, { useRef, useState } from "react";
import { ConsumablesDataTable } from "../../components/consumables-data-table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { AddConsuambleSchema } from "../../lib/schemas";
import { CommodityType } from "../../lib/types";
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

  if (intent === "save-consumables") {
    const actionId = formData.get("actionId") as string;

    if (!actionId) {
      throw new Error("Action ID is required");
    }

    // Parser les consommables depuis les champs
    const consumablesData: any[] = [];
    let index = 0;

    while (formData.has(`consumables[${index}].name`)) {
      const consumable = {
        name: formData.get(`consumables[${index}].name`) as string,
        quantity: Number(formData.get(`consumables[${index}].quantity`)) || 0,
        unit: formData.get(`consumables[${index}].unit`) as string,
        description: formData.get(`consumables[${index}].description`) as string || "",
        commodity: formData.get(`consumables[${index}].commodity`) as CommodityType || CommodityType.ANALYSIS_LAB,
      };

      if (consumable.name && consumable.quantity > 0) {
        consumablesData.push(consumable);
      }
      index++;
    }

    // Créer les nouveaux consommables
    if (consumablesData.length > 0) {
      await context.remixService.prisma.consumable.createMany({
        data: consumablesData.map(c => ({
          ...c,
          actionId,
        }))
      });
    }

    return new Response(null, { status: 200 });
  }

  if (intent === "update-consumable") {
    const consumableId = formData.get("consumableId") as string;
    const field = formData.get("field") as string;
    const value = formData.get("value") as string;

    if (!consumableId || !field) {
      throw new Error("ConsumableId and field are required");
    }

    const updateData: any = {};

    if (field === "quantity") {
      updateData[field] = Number(value) || 0;
    } else if (field === "commodity") {
      updateData[field] = value as CommodityType;
    } else if (field === "name" && value) {
      // Si on change le nom, vérifier si le stock existe
      const existingStock = await context.remixService.prisma.stock.findFirst({
        where: { name: value, userId: user.id }
      });

      // Si le stock n'existe pas, le créer
      if (!existingStock) {
        await context.remixService.prisma.stock.create({
          data: {
            name: value,
            quantity: 0,
            unit: "", // unité par défaut
            minimumQty: 0,
            userId: user.id,
          }
        });
      }

      updateData[field] = value;
    } else {
      updateData[field] = value;
    }

    await context.remixService.prisma.consumable.update({
      where: { id: consumableId },
      data: updateData,
    });

    return new Response(null, { status: 200 });
  }

  if (intent === "delete-consumable") {
    const consumableId = formData.get("consumableId") as string;

    if (!consumableId) {
      throw new Error("ConsumableId is required");
    }

    await context.remixService.prisma.consumable.delete({
      where: { id: consumableId },
    });

    return new Response(null, { status: 200 });
  }

  if (intent === "add") {
    const submission = parseWithZod(formData, { schema: AddConsuambleSchema });

    if (submission.status !== "success") {
      return { result: submission.reply() };
    }

    const { name, quantity, unit, description, commodity } = submission.value;

    //verifier que l'action existe

    const action = await context.remixService.prisma.action.findUnique({
      where: { id: tankId, userId: user.id },
    });

    if (!action) {
      throw new Error("Action not found");
    }



    //verifier que le consommable existe dans la base de données

    const existingConsumable = await context.remixService.prisma.consumable.findFirst({
      where: { name, commodity: commodity as CommodityType, actionId: action.id },
    });

    //si il existe, on ajoute la quantité
    if (existingConsumable) {
      await context.remixService.prisma.consumable.update({
        where: { id: existingConsumable.id },
        data: { quantity: existingConsumable.quantity + quantity },
      });
    } else {
      //s'il n'existe pas, on le crée et on ajoute la quantité
      await context.remixService.prisma.consumable.create({
        data: { name, quantity, unit, description, commodity: commodity as CommodityType, actionId: action.id },
      });
    }

    const fillingActionType = await context.remixService.prisma.actionType.findFirst({
      where: {
        name: { contains: "CONSOMMATION", mode: "insensitive" }
      }
    });
    if (!fillingActionType) {
      throw new Error("Type d'action CONSOMMATION non trouvé");
    }

    await context.remixService.prisma.action.create({
      data: {
        tankId,
        userId: user.id,
        typeId: fillingActionType.id,
        duration: 1,
        needsPurchase: false,
        isCompleted: true,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    //on ajoute le consommable à l'action
    // Créer l'action de consommation

    return new Response(null, { status: 200 });


  }
  return new Response("Invalid intent", { status: 400 });
};

export function ActionPlan({ tank, stocks }: { tank: MyCellarLoaderData['tanks'][number]; stocks: any[] }) {
  const actionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pendingConsumables, setPendingConsumables] = useState<Record<string, any[]>>({});

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const handleAddConsumable = (actionId: string) => {
    setPendingConsumables(prev => ({
      ...prev,
      [actionId]: [
        ...(prev[actionId] || []),
        {
          id: `temp-${Date.now()}`,
          name: "",
          quantity: 0,
          unit: "",
          description: "",
          commodity: CommodityType.ANALYSIS_LAB,
          selected: false,
        }
      ]
    }));
  };

  const updatePendingConsumable = (actionId: string, consumableId: string, field: string, value: any) => {
    setPendingConsumables(prev => ({
      ...prev,
      [actionId]: prev[actionId]?.map(c =>
        c.id === consumableId ? { ...c, [field]: value } : c
      ) || []
    }));
  };

  const deletePendingConsumable = (actionId: string, consumableId: string) => {
    setPendingConsumables(prev => ({
      ...prev,
      [actionId]: prev[actionId]?.filter(c => c.id !== consumableId) || []
    }));
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row items-center justify-between">
            <h4 className="text-lg font-bold">Planification</h4>
            <Select value={tank.actions[0].id}
              onValueChange={value => {
                const idx = tank.actions.findIndex(a => a.id === value);
                if (actionRefs.current[idx]) {
                  actionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              {tank.actions.length > 0 && <SelectContent>
                {tank.actions.map((action, index) =>
                  <SelectItem key={index} value={action.id}>{action.type.name}</SelectItem>
                )}
              </SelectContent>}
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] overflow-y-auto w-[450px]">
        {
          [...tank.actions]
            .sort((a, b) => new Date(b.startedAt ?? b.createdAt).getTime() - new Date(a.startedAt ?? a.createdAt).getTime()).map((action, index) =>
              <div key={index} className="flex flex-col mb-2" ref={el => actionRefs.current[index] = el}>
                <div className="flex flex-col gap-2 w-full mb-2">
                  <div className="flex flex-row items-center gap-2 bg-background border border-input rounded-md p-1">
                    {action.icon && React.cloneElement(action.icon, { className: "w-4 h-4" })}
                    <h4 className="text-normal font-bold">{action.type.name}</h4>
                  </div>
                  <div className="flex flex-col w-full">
                    <p className="text-sm text-muted-foreground">{action.type.description}</p>
                    <div className="flex flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Début</p>
                      <p className="text-sm text-muted-foreground">{action.startedAt ? new Date(action.startedAt).toISOString().slice(0, 10) : null}</p>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Fin</p>
                      <p className="text-sm text-muted-foreground">{action.finishedAt ? new Date(action.finishedAt).toISOString().slice(0, 10) : null}</p>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Durée</p>
                      <p className="text-sm text-muted-foreground">{action.duration} jours</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto h-full">
                  {/* Consommables existants en DB */}
                  <ConsumablesDataTable
                    consumables={action.consumables || []}
                    stocks={stocks}
                    fields={{}}
                    editable={true}
                    onUpdateConsumable={(consumableId, field, value) => {
                      // Auto-save pour les consommables existants
                      if (field === "name" && (!value || value.length < 2)) return;

                      const form = new FormData();
                      form.append("intent", "update-consumable");
                      form.append("consumableId", consumableId);
                      form.append("field", field);
                      form.append("value", value.toString());

                      fetch(`/my-cellar/${tank.id}/actionConsumable`, {
                        method: "POST",
                        body: form,
                      }).then(() => {
                        window.location.reload();
                      });
                    }}
                    onDeleteConsumable={(consumableId) => {
                      const form = new FormData();
                      form.append("intent", "delete-consumable");
                      form.append("consumableId", consumableId);

                      fetch(`/my-cellar/${tank.id}/actionConsumable`, {
                        method: "POST",
                        body: form,
                      }).then(() => {
                        window.location.reload();
                      });
                    }}
                  />

                  {/* Nouveaux consommables en attente */}
                  {(pendingConsumables[action.id] || []).length > 0 && (
                    <Form method="POST" action={`/my-cellar/${tank.id}/actionConsumable`} className="space-y-4">
                      <input type="hidden" name="intent" value="save-consumables" />
                      <input type="hidden" name="actionId" value={action.id} />

                      {/* Hidden inputs pour les consommables en attente */}
                      {(pendingConsumables[action.id] || []).map((consumable, index) => (
                        <div key={consumable.id}>
                          <input type="hidden" name={`consumables[${index}].name`} value={consumable.name} />
                          <input type="hidden" name={`consumables[${index}].quantity`} value={consumable.quantity} />
                          <input type="hidden" name={`consumables[${index}].unit`} value={consumable.unit} />
                          <input type="hidden" name={`consumables[${index}].description`} value={consumable.description} />
                          <input type="hidden" name={`consumables[${index}].commodity`} value={consumable.commodity} />
                        </div>
                      ))}

                      <ConsumablesDataTable
                        consumables={pendingConsumables[action.id] || []}
                        stocks={stocks}
                        fields={{}}
                        editable={true}
                        onUpdateConsumable={(consumableId, field, value) => {
                          updatePendingConsumable(action.id, consumableId, field, value);
                        }}
                        onDeleteConsumable={(consumableId) => {
                          deletePendingConsumable(action.id, consumableId);
                        }}
                      />

                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Sauvegarder ({(pendingConsumables[action.id] || []).length})
                        </Button>
                      </div>
                    </Form>
                  )}

                  {/* Bouton pour ajouter une nouvelle ligne */}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddConsumable(action.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter consommable
                    </Button>
                  </div>
                </div>
              </div>
            )
        }

      </CardContent>
      <CardFooter className="flex flex-row items-center justify-center">
        <Button size="icon" className="size-8" onClick={() => {
          const lastIdx = tank.actions.length - 1;
          if (actionRefs.current[lastIdx]) {
            actionRefs.current[lastIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }}>
          <ArrowDown className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card >
  );
}
