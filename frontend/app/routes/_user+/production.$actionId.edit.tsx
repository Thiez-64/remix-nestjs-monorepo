import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Settings, Trash } from "lucide-react";
import { useState } from "react";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { ProductionLoaderData } from "./production";
import { ActionSchema } from "./production.schema";



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

  console.log("Consumables data:", consumablesData);

  const submission = await parseWithZod(formData, {
    async: true,
    schema: ActionSchema.superRefine(async (data, ctx) => {
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
    console.log("Validation failed:", submission.reply());
    return submission.reply();
  }

  const production = await context.remixService.prisma.action.findUnique({
    where: { id: actionId, userId: user.id },
    include: {
      consumables: true,
    },
  });

  if (!production) {
    throw new Error("Action not found");
  }

  // Filtrer les consommables valides
  const validConsumables = consumablesData.filter(
    (consumable) =>
      consumable &&
      consumable.quantity &&
      consumable.quantity > 0 &&
      // On accepte les consommables sans nom pour permettre l'ajout de nouveaux
      ((consumable.name && consumable.name.trim()) || !consumable.name)
  );

  console.log("Valid consumables:", validConsumables);

  // Vérifier et mettre à jour les stocks
  let hasInsufficientStock = false;
  for (const consumable of validConsumables) {
    console.log("Processing consumable:", consumable);

    // Si le consommable n'a pas de nom, on le saute car c'est un nouveau consommable vide
    if (!consumable.name || !consumable.name.trim()) {
      console.log("Skipping empty consumable");
      continue;
    }

    let stock = await context.remixService.prisma.stock.findFirst({
      where: {
        name: consumable.name,
        userId: user.id
      }
    });

    // Si le stock n'existe pas, on le crée avec une quantité de 0
    if (!stock) {
      console.log("Creating new stock for:", consumable.name);
      stock = await context.remixService.prisma.stock.create({
        data: {
          name: consumable.name,
          quantity: 0,
          unit: consumable.unit,
          userId: user.id,
          isOutOfStock: true
        }
      });
      hasInsufficientStock = true;
      continue;
    }

    // Récupérer l'ancienne quantité consommée
    const oldConsumable = production.consumables.find(c => c.name === consumable.name);
    const oldQuantity = oldConsumable ? oldConsumable.quantity : 0;

    // Calculer la différence de quantité
    const quantityDiff = consumable.quantity - oldQuantity;

    console.log("Stock check:", {
      stockName: stock.name,
      stockQuantity: stock.quantity,
      requiredQuantity: quantityDiff,
      hasInsufficientStock
    });

    // Vérifier si le stock est suffisant pour la différence
    if (stock.quantity < quantityDiff) {
      hasInsufficientStock = true;
      // Mettre à jour le statut du stock
      await context.remixService.prisma.stock.update({
        where: { id: stock.id },
        data: {
          isOutOfStock: true
        }
      });
      continue;
    }

    // Mettre à jour le stock en tenant compte de l'ancienne quantité
    await context.remixService.prisma.stock.update({
      where: { id: stock.id },
      data: {
        quantity: stock.quantity - quantityDiff,
        isOutOfStock: false
      }
    });
  }

  console.log("Stock check completed. hasInsufficientStock:", hasInsufficientStock);

  // Mettre à jour l'action
  await context.remixService.prisma.action.update({
    where: { id: actionId },
    data: {
      type: submission.value.type,
      description: submission.value.description,
      duration: submission.value.duration,
      needsPurchase: submission.value.needsPurchase,
      status: hasInsufficientStock ? "WAITING_STOCK" : "PENDING"
    },
  });

  // Mettre à jour les consommables
  const existingConsumables = await context.remixService.prisma.consumable.findMany({
    where: { actionId: actionId }
  });

  console.log("Existing consumables:", existingConsumables);

  // Mettre à jour ou créer les consommables
  for (const consumable of validConsumables) {
    // On ne crée pas de consommable sans nom
    if (!consumable.name || !consumable.name.trim()) {
      console.log("Skipping consumable creation - no name provided");
      continue;
    }

    const existingConsumable = existingConsumables.find(
      c => c.name === consumable.name && c.unit === consumable.unit
    );

    if (existingConsumable) {
      console.log("Updating existing consumable:", existingConsumable.id);
      // Mettre à jour le consommable existant
      await context.remixService.prisma.consumable.update({
        where: { id: existingConsumable.id },
        data: {
          quantity: consumable.quantity,
          description: consumable.description?.trim() || null,
        }
      });
    } else {
      console.log("Creating new consumable:", consumable.name);
      // Créer un nouveau consommable
      await context.remixService.prisma.consumable.create({
        data: {
          name: consumable.name.trim(),
          unit: consumable.unit.trim(),
          quantity: consumable.quantity,
          description: consumable.description?.trim() || null,
          actionId: actionId,
        }
      });
    }
  }

  // Supprimer les consommables qui ne sont plus utilisés
  const validConsumableNames = validConsumables.map(c => c.name);
  await context.remixService.prisma.consumable.deleteMany({
    where: {
      actionId: actionId,
      name: {
        notIn: validConsumableNames
      }
    }
  });

  return redirect(`/production`);
};


export function EditActionDialog({
  production,
}: {
    production: ProductionLoaderData['actions'][number],
}) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  const [form, fields] = useForm({
    id: "edit-action",
    constraint: getZodConstraint(ActionSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ActionSchema });
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


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="size-8">
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







          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
              className="size-8"
              size="icon"
            >
              <Trash className="w-4 h-4" />
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
