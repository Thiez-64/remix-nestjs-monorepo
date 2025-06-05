import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Action } from "~/components/ColumnsActions";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { requireUser } from "~/server/auth.server";

export const EditActionSchema = z.object({
  description: z.string().optional(),
  duration: z.coerce.number().min(1),
  consumables: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number(),
      unit: z.string(),
    })
  ),
});

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  const actionId = params.actionId;

  if (!actionId) {
    throw new Error("Action ID is required");
  }

  const action = await context.remixService.prisma.action.findUnique({
    where: { id: actionId, userId: user.id },
    include: {
      consumables: {
        include: {
          consumable: true,
        },
      },
    },
  });

  return { action, user, actionId };
};

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
  const submission = await parseWithZod(formData, {
    schema: EditActionSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await context.remixService.prisma.action.update({
    where: { id: actionId, userId: user.id },
    data: {
      description: submission.value.description,
      estimatedDuration: submission.value.duration,
    },
  });

  // On supprime les anciens consommables
  await context.remixService.prisma.actionConsumable.deleteMany({
    where: { actionId },
  });

  // On crée les nouveaux consommables
  for (const c of submission.value.consumables) {
    let consumable = await context.remixService.prisma.consumable.findFirst({
      where: { name: c.name, unit: c.unit },
    });
    if (!consumable) {
      consumable = await context.remixService.prisma.consumable.create({
        data: { name: c.name, unit: c.unit },
      });
    }
    await context.remixService.prisma.actionConsumable.create({
      data: {
        actionId,
        consumableId: consumable.id,
        quantity: c.quantity,
      },
    });
  }

  return redirect(`/actions`);
};

export default function EditActionForm({ actionJob }: { actionJob: Action }) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [consumables, setConsumables] = useState(actionJob.consumables);

  const [form, fields] = useForm({
    id: "edit-action",
    constraint: getZodConstraint(EditActionSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditActionSchema });
    },
    lastResult: actionData,
    defaultValue: {
      description: actionJob.description,
      duration: actionJob.estimatedDuration,
      consumables: consumables.map((c) => ({
        name: c.name,
        quantity: c.quantity,
        unit: c.unit,
        description: c.description || "",
      })),
    },
  });

  const addConsumable = () => {
    setConsumables([
      ...consumables,
      { name: "", quantity: 0, unit: "", description: "" },
    ]);
  };

  const removeConsumable = (index: number) => {
    setConsumables(consumables.filter((_, i) => i !== index));
  };

  return (
    <Form
      {...getFormProps(form)}
      method="POST"
      action={`/actions/${actionJob.id}/edit`}
      className="space-y-4"
    >
      <Field
        inputProps={getInputProps(fields.description, { type: "text" })}
        labelsProps={{ children: "Description" }}
        errors={fields.description.errors}
      />
      <Field
        inputProps={getInputProps(fields.duration, {
          type: "number",
          min: 1,
        })}
        labelsProps={{ children: "Durée estimée (jours)" }}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Consommables nécessaires</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addConsumable}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un consommable
          </Button>
        </div>

        {consumables.map((consumable, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <input
                type="hidden"
                name={`consumables[${index}].name`}
                value={consumable.name}
              />
              <Field
                inputProps={{
                  type: "text",
                  value: consumable.name,
                  onChange: (e) => {
                    const newConsumables = [...consumables];
                    newConsumables[index] = {
                      ...newConsumables[index],
                      name: e.target.value,
                    };
                    setConsumables(newConsumables);
                  },
                }}
                labelsProps={{ children: "Nom" }}
              />
            </div>
            <div className="flex-1">
              <input
                type="hidden"
                name={`consumables[${index}].quantity`}
                value={consumable.quantity}
              />
              <Field
                inputProps={{
                  type: "number",
                  min: 0,
                  value: consumable.quantity,
                  onChange: (e) => {
                    const newConsumables = [...consumables];
                    newConsumables[index] = {
                      ...newConsumables[index],
                      quantity: Number(e.target.value),
                    };
                    setConsumables(newConsumables);
                  },
                }}
                labelsProps={{ children: "Quantité" }}
              />
            </div>
            <div className="flex-1">
              <input
                type="hidden"
                name={`consumables[${index}].unit`}
                value={consumable.unit}
              />
              <Field
                inputProps={{
                  type: "text",
                  value: consumable.unit,
                  onChange: (e) => {
                    const newConsumables = [...consumables];
                    newConsumables[index] = {
                      ...newConsumables[index],
                      unit: e.target.value,
                    };
                    setConsumables(newConsumables);
                  },
                }}
                labelsProps={{ children: "Unité" }}
              />
            </div>
            <div className="flex-1">
              <input
                type="hidden"
                name={`consumables[${index}].description`}
                value={consumable.description || ""}
              />
              <Field
                inputProps={{
                  type: "text",
                  value: consumable.description || "",
                  onChange: (e) => {
                    const newConsumables = [...consumables];
                    newConsumables[index] = {
                      ...newConsumables[index],
                      description: e.target.value,
                    };
                    setConsumables(newConsumables);
                  },
                }}
                labelsProps={{ children: "Description" }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeConsumable(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => {}}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </Form>
  );
}
