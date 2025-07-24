import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { EditDialog } from "../../components/edit-dialog";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { BatchSchema } from "../../lib/schemas";
import { requireUser } from "../../server/auth.server";
import { BatchLoaderData } from "./batch";

export const action = async ({
  request,
  params,
  context,
}: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const batchId = params.batchId;

  if (!batchId) {
    throw new Error("Batch ID is required");
  }

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: BatchSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await context.remixService.prisma.batch.update({
    where: { id: batchId, userId: user.id },
    data: {
      name: submission.value.name,
      description: submission.value.description,
      quantity: submission.value.quantity,
    },
  });

  return redirect(`/batch`);
};

export function EditBatchDialog({ batch }: { batch: BatchLoaderData['batches'][number] }) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    id: "edit-batch",
    constraint: getZodConstraint(BatchSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: BatchSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: batch.name,
      description: batch.description,
      quantity: batch.quantity,
    },
  });

  return (
    <EditDialog
      trigger={
        <Button variant="outline" size="icon" className="size-8">
          <Settings className="w-4 h-4" />
        </Button>
      }
      title={`Modifier ${batch.name}`}
      formProps={getFormProps(form)}
      isSubmitting={isSubmitting}
      editAction={`/batch/${batch.id}/edit`}
      deleteAction={`/batch/${batch.id}/delete`}
      itemName={batch.name}
      itemType="la cuvée"
    >
      <Field
        inputProps={getInputProps(fields.name, { type: "text" })}
        labelsProps={{ children: "Nom de la cuvée" }}
        errors={fields.name.errors}
      />
      <Field
        inputProps={getInputProps(fields.description, { type: "text" })}
        labelsProps={{ children: "Description" }}
        errors={fields.description.errors}
      />
      <Field
        inputProps={getInputProps(fields.quantity, { type: "number" })}
        labelsProps={{ children: "Quantité (en hL)" }}
        errors={fields.quantity.errors}
      />
    </EditDialog>
  );
}
