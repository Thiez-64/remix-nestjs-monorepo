import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import type { Tank } from "~/components/ColumnsMyCellar";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { requireUser } from "~/server/auth.server";

export const EditTankSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  capacity: z.coerce.number().min(1, "La capacité doit être supérieure à 0"),
  material: z.enum(["INOX", "BETON", "BOIS", "PLASTIQUE"]),
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

  if (!tankId) {
    throw new Error("Tank ID is required");
  }

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    async: true,
    schema: EditTankSchema.superRefine(async (data, ctx) => {
      const existingTank = await context.remixService.prisma.tank.findFirst({
        where: {
          name: data.name,
          userId: user.id,
          id: { not: tankId },
        },
      });

      if (existingTank) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Une cuve avec ce nom existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const tank = await context.remixService.prisma.tank.findUnique({
    where: { id: tankId, userId: user.id },
  });

  if (!tank) {
    throw new Error("Tank not found");
  }

  await context.remixService.prisma.tank.update({
    where: { id: tankId },
    data: {
      name: submission.value.name,
      description: submission.value.description,
      material: submission.value.material,
      capacity: submission.value.capacity,
    },
  });

  return redirect(`/my-cellar`);
};

export default function EditTankForm({ tank }: { tank: Tank }) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    id: "edit-tank",
    constraint: getZodConstraint(EditTankSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditTankSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: tank.name,
      description: tank.description || "",
      material: tank.material,
      capacity: tank.capacity,
    },
  });

  return (
    <Form
      {...getFormProps(form)}
      method="POST"
      action={`/my-cellar/${tank.id}/edit`}
      className="space-y-4"
    >
      <Field
        inputProps={getInputProps(fields.name, { type: "text" })}
        labelsProps={{ children: "Nom" }}
        errors={fields.name.errors}
      />

      <Field
        inputProps={getInputProps(fields.description, { type: "text" })}
        labelsProps={{ children: "Description" }}
        errors={fields.description.errors}
      />

      <Field
        inputProps={getInputProps(fields.capacity, { type: "number" })}
        labelsProps={{ children: "Capacité (L)" }}
        errors={fields.capacity.errors}
      />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Matériau</Label>
        <Select name={fields.material.name} defaultValue={tank.material}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un matériau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INOX">Inox</SelectItem>
            <SelectItem value="BETON">Béton</SelectItem>
            <SelectItem value="BOIS">Bois</SelectItem>
            <SelectItem value="PLASTIQUE">Plastique</SelectItem>
          </SelectContent>
        </Select>
        {fields.material.errors && (
          <p className="text-sm text-destructive">{fields.material.errors}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Modification..." : "Modifier"}
      </Button>
    </Form>
  );
}
