import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  redirect,
  type ActionFunctionArgs
} from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { useState } from "react";
import { EditDialog } from "../../components/edit-dialog";
import { Field, SelectField } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { TankSchema } from "../../lib/schemas";
import { materialVariety, tankStateVariety } from "../../lib/utils";
import { requireUser } from "../../server/auth.server";
import { MyCellarLoaderData } from "./my-cellar";

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
  const intent = formData.get("intent");

  // Gestion de la suppression
  if (intent === "delete") {
    const tank = await context.remixService.prisma.tank.findUnique({
      where: { id: tankId, userId: user.id },
    });

    if (!tank) {
      throw new Error("Tank not found");
    }

    await context.remixService.prisma.tank.delete({
      where: { id: tankId, userId: user.id },
    });

    return redirect(`/my-cellar`);
  }

  // Gestion de la modification
  const submission = await parseWithZod(formData, {
    async: true,
    schema: TankSchema.superRefine(async (data, ctx) => {
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
      volume: submission.value.volume,
      status: submission.value.status,
    },
  });

  return redirect(`/my-cellar`);
};

export function EditTankDialog({ tank }: { tank: MyCellarLoaderData['tanks'][number] }) {
  const [isOpen, setIsOpen] = useState(false)
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    id: "edit-tank",
    constraint: getZodConstraint(TankSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TankSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: tank.name,
      description: tank.description || "",
      material: tank.material,
      volume: tank.volume,
      status: tank.status,
    },
    onSubmit() {
      setIsOpen(false)
    }
  });

  return (
    <EditDialog
      trigger={
        <Button variant="outline" size="icon" className="size-8">
          <Settings className="w-4 h-4" />
        </Button>
      }
      title={`Modifier ${tank.name}`}
      formProps={getFormProps(form)}
      isSubmitting={isSubmitting}
      editAction={`/my-cellar/${tank.id}/edit`}
      deleteAction={`/my-cellar/${tank.id}/edit`}
      itemName={tank.name}
      itemType="la cuve"
      deleteInputs={[{ name: "intent", value: "delete" }]}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
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
        inputProps={getInputProps(fields.volume, { type: "number", step: "0.1" })}
        labelsProps={{ children: "Capacité (hL)" }}
        errors={fields.volume.errors}
      />

      <div className="space-y-2">
        <div className="flex justify-between gap-4">
          <div className="w-1/2">
            <SelectField labelsProps={{ children: "Matériau" }} name={fields.material.name} defaultValue={fields.material.value || "INOX"} options={materialVariety.map((material) => ({
              id: material.value,
              name: material.label
            }))} />
          </div>
          <div className="w-1/2">
            <SelectField labelsProps={{ children: "Statut" }} name={fields.status.name} defaultValue={fields.status.value || "EMPTY"} options={tankStateVariety.map((status) => ({
              id: status.value,
              name: status.label
            }))} />
          </div>
        </div>
      </div>
    </EditDialog>
  );
}
