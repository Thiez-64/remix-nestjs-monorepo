import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { useState } from "react";
import { EditDialog } from "../../components/edit-dialog";
import { Field, SelectField } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { PlotSchema } from "../../lib/schemas";
import { grapeVariety } from "../../lib/utils";
import { requireUser } from "../../server/auth.server";
import { PlotLoaderData } from "./vineyard";

export const action = async ({
  request,
  params,
  context,
}: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const plotId = params.plotId;

  if (!plotId) {
    throw new Error("Plot ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Gestion de la suppression
  if (intent === "delete") {
    const plot = await context.remixService.prisma.plot.findUnique({
      where: { id: plotId, userId: user.id },
    });

    if (!plot) {
      throw new Error("Plot not found");
    }

    await context.remixService.prisma.plot.delete({
      where: { id: plotId, userId: user.id },
    });

    return redirect(`/vineyard`);
  }

  // Gestion de la modification
  const submission = await parseWithZod(formData, {
    async: true,
    schema: PlotSchema.superRefine(async (data, ctx) => {

      const existingPlot = await context.remixService.prisma.plot.findFirst({
        where: {
          name: data.name,
          userId: user.id,
          id: { not: plotId },
        },
      });

      if (existingPlot) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Un stock avec ce nom et cette unité existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const plot = await context.remixService.prisma.plot.findUnique({
    where: { id: plotId, userId: user.id },
  });

  if (!plot) {
    throw new Error("Plot not found");
  }

  await context.remixService.prisma.plot.update({
    where: { id: plotId },
    data: {
      name: submission.value.name,
      description: submission.value.description,
      grapeVariety: submission.value.grapeVariety,
      surface: submission.value.surface,
    },
  });

  return redirect(`/vineyard`);
};

export function EditPlotDialog({
  plot
}: {
  plot: PlotLoaderData['plots'][number]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    id: "edit-plot",
    constraint: getZodConstraint(PlotSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: PlotSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: plot.name,
      description: plot.description,
      grapeVariety: plot.grapeVariety,
      surface: plot.surface,
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
      title={`Modifier ${plot.name}`}
      formProps={getFormProps(form)}
      isSubmitting={isSubmitting}
      editAction={`/vineyard/${plot.id}/edit`}
      deleteAction={`/vineyard/${plot.id}/edit`}
      itemName={plot.name}
      itemType="la parcelle"
      deleteInputs={[{ name: "intent", value: "delete" }]}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Field
        inputProps={getInputProps(fields.name, { type: "text" })}
        labelsProps={{ children: "Nom de la parcelle" }}
        errors={fields.name.errors}
      />
      <Field
        inputProps={getInputProps(fields.description, { type: "text" })}
        labelsProps={{ children: "Description" }}
        errors={fields.description.errors}
      />
      <Field
        inputProps={getInputProps(fields.surface, { type: "number" })}
        labelsProps={{ children: "Surface" }}
        errors={fields.surface.errors}
      />
      <SelectField
        name={fields.grapeVariety.name}
        defaultValue={fields.grapeVariety.value || "CHARDONNAY"}
        labelsProps={{ children: "Cépage" }}
        errors={fields.grapeVariety.errors}
        options={grapeVariety.map((variety) => ({
          id: variety.value,
          name: variety.label
        }))}
      />
    </EditDialog>
  );
}
