import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Plus, Settings } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { ProductionLoaderData } from "./production";

export const EditActionSchema = z.object({
  type: z.string().min(1, "Le type est requis"),
  description: z.string().optional(),
  duration: z.coerce.number().min(1, "La durée doit être supérieure à 0"),
  needsPurchase: z.boolean().default(false),
});

export const action = async ({
  request,
  params,
  context,
}: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const actionId = params.actionId;

  if (!actionId) {
    throw new Error("Action ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Gestion de la suppression
  if (intent === "delete") {
    const production = await context.remixService.prisma.action.findUnique({
      where: { id: actionId, userId: user.id },
    });

    if (!production) {
      throw new Error("Action not found");
    }

    await context.remixService.prisma.action.delete({
      where: { id: actionId, userId: user.id },
    });

    return redirect(`/production`);
  }

  // Gestion de la modification
  const submission = await parseWithZod(formData, {
    async: true,
    schema: EditActionSchema.superRefine(async (data, ctx) => {
      const existingAction = await context.remixService.prisma.action.findFirst({
        where: {
          type: data.type,
          userId: user.id,
          id: { not: actionId },
        },
      });

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
    return submission.reply();
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

  const production = await context.remixService.prisma.action.findUnique({
    where: { id: actionId, userId: user.id },
  });

  if (!production) {
    throw new Error("Action not found");
  }

  // Supprimer tous les anciens consommables
  await context.remixService.prisma.consumable.deleteMany({
    where: { actionId: actionId },
  });

  // Mettre à jour l'action
  await context.remixService.prisma.action.update({
    where: { id: actionId },
    data: {
      type: submission.value.type,
      description: submission.value.description,
      duration: submission.value.duration,
      needsPurchase: submission.value.needsPurchase,
    },
  });

  // Créer les nouveaux consommables
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

  if (validConsumables.length > 0) {
    await Promise.all(
      validConsumables.map((consumable) =>
        context.remixService.prisma.consumable.create({
          data: {
            name: consumable.name.trim(),
            unit: consumable.unit.trim(),
            quantity: consumable.quantity,
            description: consumable.description?.trim() || null,
            actionId: actionId,
          },
        })
      )
    );
  }

  return redirect(`/production`);
};


export function EditActionDialog({
  production
}: {
  production: ProductionLoaderData['actions'][number]
}) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [consumables, setConsumables] = useState(
    production.consumables?.map(c => ({
      name: c.name,
      unit: c.unit,
      quantity: c.quantity,
      description: c.description || ""
    })) || [{ name: "", unit: "", quantity: 0, description: "" }]
  );

  const [form, fields] = useForm({
    id: "edit-action",
    constraint: getZodConstraint(EditActionSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditActionSchema });
    },
    lastResult: actionData,
    defaultValue: {
      type: production.type,
      description: production.description || "",
      duration: production.duration,
      needsPurchase: production.needsPurchase,
    },
    onSubmit() {
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier {production.type}</DialogTitle>
        </DialogHeader>

        <Form
          {...getFormProps(form)}
          method="POST"
          action={`/production/${production.id}/edit`}
          className="space-y-4"
        >
          <Field
            inputProps={getInputProps(fields.type, { type: "text" })}
            labelsProps={{ children: "Type" }}
            errors={fields.type.errors}
          />

          <Field
            inputProps={getInputProps(fields.description, { type: "text" })}
            labelsProps={{ children: "Description" }}
            errors={fields.description.errors}
          />

          <Field
            inputProps={getInputProps(fields.duration, { type: "number" })}
            labelsProps={{ children: "Durée" }}
            errors={fields.duration.errors}
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

          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              Supprimer
            </Button>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Modification..." : "Modifier"}
              </Button>
            </div>
          </div>
        </Form>

        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white rounded-lg p-6 flex flex-col justify-center">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Supprimer l&apos;action &quot;{production.type}&quot;
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Cette action est irréversible. Elle sera définitivement supprimée.
              </p>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </Button>
                <Form method="POST">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="actionId" value={production.id} />
                  <Button type="submit" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? "Suppression..." : "Supprimer définitivement"}
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
