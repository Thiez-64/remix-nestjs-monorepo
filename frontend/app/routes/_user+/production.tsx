import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs
} from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Plus, SquareArrowRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ConsumablesDataTable } from "../../components/consumables-data-table";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { requireUser } from "../../server/auth.server";
import { EditActionDialog } from "./production.$actionId.edit";

export const ActionSchema = z.object({
  type: z.string().min(1, "Le type de l'action est requis"),
  description: z.string().optional(),
  duration: z.coerce.number().min(1, "La durée doit être supérieure à 0"),
  needsPurchase: z.boolean().default(false),
  referenceVolume: z.coerce.number().min(1, "Le volume de référence doit être supérieur à 0").optional(),
});

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  const [actions, processes] = await Promise.all([
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
  ]);

  return { actions, processes, user };
};

export type ProductionLoaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const actionId = formData.get("actionId");

    if (!actionId) {
      throw new Error("Action ID is required");
    }

    await context.remixService.prisma.action.delete({
      where: { id: actionId as string },
    });

    return new Response(null, { status: 200 });
  }

  // Extraire les consommables du FormData
  const consumablesData: Array<{
    name: string;
    unit: string;
    quantity: number;
    description?: string;
  }> = [];

  // Récupérer tous les champs qui commencent par "consumables["
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^consumables\[(\d+)\]\.(.+)$/);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2];

      // Initialiser l'objet s'il n'existe pas
      if (!consumablesData[index]) {
        consumablesData[index] = { name: "", unit: "", quantity: 0, description: "" };
      }

      if (field === "quantity") {
        consumablesData[index].quantity = parseFloat(value.toString()) || 0;
      } else if (field === "name") {
        consumablesData[index].name = value.toString();
      } else if (field === "unit") {
        consumablesData[index].unit = value.toString();
      } else if (field === "description") {
        consumablesData[index].description = value.toString();
      }
    }
  }

  // Création d'une action - schema simplifié sans les consommables
  const basicSchema = z.object({
    type: z.string().min(1, "Le type de l'action est requis"),
    description: z.string().optional(),
    duration: z.coerce.number().min(1, "La durée doit être supérieure à 0"),
    needsPurchase: z.boolean().default(false),
    referenceVolume: z.coerce.number().min(1, "Le volume de référence doit être supérieur à 0").optional(),
  });

  const submission = await parseWithZod(formData, {
    async: true,
    schema: basicSchema.superRefine(async (data, ctx) => {
      const existingAction = await context.remixService.prisma.action.findFirst(
        {
          where: { type: data.type, userId: user.id },
        }
      );

      if (existingAction) {
        ctx.addIssue({
          code: "custom",
          path: ["type"],
          message: "Une action avec ce type existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  // Filtrer les consommables valides avant la transaction
  const validConsumables = consumablesData.filter(
    (consumable) =>
      consumable &&
      consumable.name &&
      consumable.name.trim() &&
      consumable.unit &&
      consumable.unit.trim() &&
      consumable.quantity &&
      consumable.quantity > 0
  );

  // Transaction atomique : action + consommables ensemble
  await context.remixService.prisma.action.create({
    data: {
      type: submission.value.type,
      description: submission.value.description ?? "",
      duration: submission.value.duration,
      needsPurchase: submission.value.needsPurchase,
      scaleWithVolume: false, // Par défaut false, sera activé automatiquement lors de l'assignation
      referenceVolume: submission.value.referenceVolume,
      userId: user.id,
      consumables: {
        create: validConsumables.map((consumable) => ({
          name: consumable.name.trim(),
          unit: consumable.unit.trim(),
          quantity: consumable.quantity,
          description: consumable.description?.trim() || null,
        })),
      },
    },
  });

  return { result: submission.reply() };
};

export default function Production() {
  const { actions, processes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);
  const [consumables, setConsumables] = useState([{ name: "", unit: "", quantity: 0, description: "" }]);

  const [form, fields] = useForm({
    id: "create-action",
    constraint: getZodConstraint(ActionSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ActionSchema });
    },
    lastResult: actionData?.result,
    onSubmit() {
      setOpen(false);
      setConsumables([{ name: "", unit: "", quantity: 0, description: "" }]);
    },
  });

  const addConsumable = () => {
    setConsumables([...consumables, { name: "", unit: "", quantity: 0, description: "" }]);
  };

  const removeConsumable = (index: number) => {
    setConsumables(consumables.filter((_, i) => i !== index));
  };

  const updateConsumable = (index: number, field: string, value: string | number) => {
    const updated = [...consumables];
    updated[index] = { ...updated[index], [field]: value };
    setConsumables(updated);
  };

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
          <DialogContent className="max-w-lg">
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
                labelsProps={{ children: "Durée (h)" }}
                errors={fields.duration.errors}
              />

              <Field
                inputProps={getInputProps(fields.referenceVolume, { type: "number", step: "0.1" })}
                labelsProps={{ children: "Volume de référence (L) - pour calculer les proportions quand l'action sera assignée" }}
                errors={fields.referenceVolume.errors}
              />

              {/* Section Consommables */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Consommables requis
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addConsumable}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {consumables.map((consumable, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <Field
                            inputProps={{
                              type: "text",
                              placeholder: "Nom (ex: Levure, Sulfite)",
                              value: consumable.name,
                              onChange: (e) => updateConsumable(index, "name", e.target.value),
                              className: "h-8 text-sm",
                            }}
                            labelsProps={{ children: "Nom" }}
                          />
                        </div>
                        <div className="w-24">
                          <Field
                            inputProps={{
                              type: "number",
                              placeholder: "Quantité",
                              step: "0.1",
                              min: "0",
                              value: consumable.quantity || "",
                              onChange: (e) => updateConsumable(index, "quantity", parseFloat(e.target.value) || 0),
                              className: "h-8 text-sm",
                            }}
                            labelsProps={{ children: "Quantité" }}
                          />
                        </div>
                        <div className="w-20">
                          <Field
                            inputProps={{
                              type: "text",
                              placeholder: "Unité",
                              value: consumable.unit,
                              onChange: (e) => updateConsumable(index, "unit", e.target.value),
                              className: "h-8 text-sm",
                            }}
                            labelsProps={{ children: "Unité" }}
                          />
                        </div>
                        {consumables.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeConsumable(index)}
                            className="text-red-600 hover:text-red-700 h-8"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      <Field
                        inputProps={{
                          type: "text",
                          placeholder: "Description (optionnel)",
                          value: consumable.description,
                          onChange: (e) => updateConsumable(index, "description", e.target.value),
                          className: "h-8 text-sm",
                        }}
                        labelsProps={{ children: "Description" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Hidden inputs pour les consommables */}
                {consumables.map((consumable, index) => (
                  <div key={`hidden-${index}`} className="hidden">
                    <input
                      type="hidden"
                      name={`consumables[${index}].name`}
                      value={consumable.name}
                    />
                    <input
                      type="hidden"
                      name={`consumables[${index}].quantity`}
                      value={consumable.quantity}
                    />
                    <input
                      type="hidden"
                      name={`consumables[${index}].unit`}
                      value={consumable.unit}
                    />
                    <input
                      type="hidden"
                      name={`consumables[${index}].description`}
                      value={consumable.description}
                    />
                  </div>
                ))}
              </div>

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
          actions.map((action) => (
            <Card key={action.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{action.type}</CardTitle>
                    {action.description && (
                      <CardDescription>{action.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {/* eslint-disable @typescript-eslint/no-explicit-any */}
                    <EditActionDialog production={action as any} />
                    {/* eslint-enable @typescript-eslint/no-explicit-any */}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="duration" className="w-full">
                  <TabsList>
                    <TabsTrigger value="duration">Durée</TabsTrigger>
                    <TabsTrigger value="process">Processus</TabsTrigger>
                    <TabsTrigger value="needsPurchase">Nécessite une acquisition</TabsTrigger>
                    <TabsTrigger value="referenceVolume">Volume de référence</TabsTrigger>
                    <TabsTrigger value="consumables">Consommables</TabsTrigger>
                  </TabsList>
                  <TabsContent value="duration" className="mt-4">
                    <div className="font-medium">{action.duration}h</div>
                  </TabsContent>
                  <TabsContent value="process" className="mt-4">
                    <div className="font-medium">
                      {processes.find((process) => process.id === action.processId)?.name || "Non assigné"}
                    </div>
                  </TabsContent>
                  <TabsContent value="needsPurchase" className="mt-4">
                    <div className="font-medium">{action.needsPurchase ? "Oui" : "Non"}</div>
                  </TabsContent>
                  <TabsContent value="referenceVolume" className="mt-4">
                    <div className="font-medium">
                      {action.referenceVolume ? `${action.referenceVolume}L` : "Non défini"}
                    </div>
                  </TabsContent>
                  <TabsContent value="consumables" className="mt-4">
                    <ConsumablesDataTable consumables={action.consumables} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
