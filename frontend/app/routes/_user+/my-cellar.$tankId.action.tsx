import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { Tank } from "~/components/ColumnsMyCellar";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { requireUser } from "~/server/auth.server";

export const ActionTankSchema = z.object({
  type: z.enum(["ROUGE", "BLANC", "ROSE"]),
  status: z.enum(["EMPTY", "IN_USE", "MAINTENANCE"]),
  currentWine: z.coerce.number().min(1, "La quantité doit être supérieure à 0"),
});

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  const tankId = params.tankId;

  if (!tankId) {
    throw new Error("Tank ID is required");
  }

  const tank = await context.remixService.prisma.tank.findUnique({
    where: { id: tankId, userId: user.id },
  });

  if (!tank) {
    throw new Error("Tank not found");
  }

  return { tank, user, tankId };
};

export const action = async ({
  request,
  params,
  context,
}: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const tankId = params.tankId;
  const tank = await context.remixService.prisma.tank.findUnique({
    where: { id: tankId, userId: user.id },
  });

  if (!tankId) {
    throw new Error("Tank ID is required");
  }

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ActionTankSchema.superRefine(async (data, ctx) => {
      if (!tank) {
        throw new Error("Tank not found");
      }
      if (data.currentWine > tank.capacity) {
        ctx.addIssue({
          code: "custom",
          path: ["currentWine"],
          message: "La quantité ne peut pas dépasser la capacité de la cuve",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  // MAJ Tank
  await context.remixService.prisma.tank.update({
    where: { id: tankId },
    data: {
      wineType: submission.value.type,
      status: submission.value.status,
      currentWine: submission.value.currentWine,
    },
  });

  return redirect(`/my-cellar`);
};

export default function ActionTankForm({ tank }: { tank: Tank }) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    id: "action-tank",
    constraint: getZodConstraint(ActionTankSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ActionTankSchema });
    },
    lastResult: actionData,
    defaultValue: {
      type: tank.wineType || undefined,
      status: tank.status,
      currentWine: tank.currentWine,
    },
  });

  return (
    <Form
      {...getFormProps(form)}
      method="POST"
      action={`/my-cellar/${tank.id}/action`}
    >
      <div className="space-y-4">
        <h3 className="font-medium">Changer le statut</h3>
        <Select name={fields.status.name} defaultValue={tank.status}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMPTY">Vide</SelectItem>
            <SelectItem value="IN_USE">En utilisation</SelectItem>
            <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
          </SelectContent>
        </Select>
        {fields.status.errors && (
          <p className="text-sm text-destructive">{fields.status.errors}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Ajouter du vin</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="wineType" className="text-sm font-medium">
              Type de vin
            </label>
            <Select
              name={fields.type.name}
              defaultValue={tank.wineType || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROSE">Rosé</SelectItem>
                <SelectItem value="ROUGE">Rouge</SelectItem>
                <SelectItem value="BLANC">Blanc</SelectItem>
              </SelectContent>
            </Select>
            {fields.type.errors && (
              <p className="text-sm text-destructive">{fields.type.errors}</p>
            )}
          </div>
          <Field
            inputProps={getInputProps(fields.currentWine, { type: "number" })}
            labelsProps={{ children: "Quantité (L)" }}
            errors={fields.currentWine.errors}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </Form>
  );
}
