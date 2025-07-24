import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { EditDialog } from "../../components/edit-dialog";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { ActionTypeSchema } from "../../lib/schemas";
import { requireUser } from "../../server/auth.server";
import { ProductionLoaderData } from "./production";

export const action = async ({
  request,
  params,
  context,
}: ActionFunctionArgs) => {
  await requireUser({ context });
  const actionTypeId = params.actionId;

  if (!actionTypeId) {
    throw new Error("ActionType ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Gestion de la suppression
  if (intent === "delete") {
    const actionType = await context.remixService.prisma.actionType.findUnique({
      where: { id: actionTypeId },
    });

    if (!actionType) {
      throw new Error("ActionType not found");
    }

    await context.remixService.prisma.actionType.delete({
      where: { id: actionTypeId },
    });

    return redirect(`/production`);
  }

  const submission = await parseWithZod(formData, {
    async: true,
    schema: ActionTypeSchema.superRefine(async (data, ctx) => {
      const existingActionType = await context.remixService.prisma.actionType.findFirst({
        where: {
          name: data.name,
          id: { not: actionTypeId },
        },
      });

      if (existingActionType) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Un type d'action avec ce nom existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const actionType = await context.remixService.prisma.actionType.findUnique({
    where: { id: actionTypeId },
  });

  if (!actionType) {
    throw new Error("ActionType not found");
  }

  // Mettre à jour le template ActionType
  await context.remixService.prisma.actionType.update({
    where: { id: actionTypeId },
    data: {
      name: submission.value.name,
      description: submission.value.description ?? null,
    },
  });

  return redirect(`/production`);
};

export function EditActionDialog({
  production,
}: {
    production: ProductionLoaderData['actionTypes'][number],
}) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    id: "edit-action-type",
    constraint: getZodConstraint(ActionTypeSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ActionTypeSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: production.name,
      description: production.description || "",
    },
  });

  return (
    <EditDialog
      trigger={
        <Button variant="outline" size="icon" className="size-8">
          <Settings className="w-4 h-4" />
        </Button>
      }
      title={`Modifier ${production.name}`}
      formProps={getFormProps(form)}
      isSubmitting={isSubmitting}
      editAction={`/production/${production.id}/edit`}
      deleteAction={`/production/${production.id}/edit`}
      itemName={production.name}
      itemType="le type d'action"
      deleteInputs={[{ name: "intent", value: "delete" }]}
    >
      <Field
        inputProps={getInputProps(fields.name, { type: "text" })}
        labelsProps={{ children: "Nom du type d'action" }}
        errors={fields.name.errors}
      />

      <Field
        inputProps={getInputProps(fields.description, { type: "text" })}
        labelsProps={{ children: "Description (optionnel)" }}
        errors={fields.description.errors}
      />
    </EditDialog>
  );
}
