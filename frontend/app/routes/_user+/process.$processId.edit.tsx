import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { useState } from "react";
import { EditDialog } from "../../components/edit-dialog";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { ProcessSchema } from "../../lib/schemas";
import { requireUser } from "../../server/auth.server";
import { ProcessLoaderData } from "./process";

export const action = async ({
  request,
  params,
  context,
}: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const processId = params.processId;

  if (!processId) {
    throw new Error("Process ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Gestion de la suppression
  if (intent === "delete") {
    const process = await context.remixService.prisma.process.findUnique({
      where: { id: processId, userId: user.id },
    });

    if (!process) {
      throw new Error("Process not found");
    }

    await context.remixService.prisma.process.delete({
      where: { id: processId, userId: user.id },
    });

    return redirect(`/process`);
  }

  // Gestion de la modification
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ProcessSchema.superRefine(async (data, ctx) => {
      const existingProcess = await context.remixService.prisma.process.findFirst({
        where: {
          name: data.name,
          userId: user.id,
          id: { not: processId },
        },
      });

      if (existingProcess) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Un processus avec ce nom existe déjà",
        });
      }

    }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const process = await context.remixService.prisma.process.findUnique({
    where: { id: processId, userId: user.id },
  });

  if (!process) {
    throw new Error("Process not found");
  }

  await context.remixService.prisma.process.update({
    where: { id: processId },
    data: {
      name: submission.value.name,
      description: submission.value.description,
      startDate: submission.value.startDate ? new Date(submission.value.startDate) : null,
    },
  });

  return redirect(`/process`);
};

export function EditProcessDialog({
  process
}: {
  process: ProcessLoaderData['processes'][number]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    id: "edit-process",
    constraint: getZodConstraint(ProcessSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ProcessSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: process.name,
      description: process.description || "",
      startDate: process.startDate ? new Date(process.startDate).toISOString().split('T')[0] : "",
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
      title={`Modifier ${process.name}`}
      formProps={getFormProps(form)}
      isSubmitting={isSubmitting}
      editAction={`/process/${process.id}/edit`}
      deleteAction={`/process/${process.id}/edit`}
      itemName={process.name}
      itemType="le processus"
      deleteInputs={[{ name: "intent", value: "delete" }]}
      isOpen={isOpen}
      onOpenChange={setIsOpen}

    >
      <Field
        inputProps={getInputProps(fields.name, { type: "text" })}
        labelsProps={{ children: "Nom du processus" }}
        errors={fields.name.errors}
      />

      <Field
        inputProps={getInputProps(fields.description, { type: "text" })}
        labelsProps={{ children: "Description" }}
        errors={fields.description.errors}
      />

      <Field
        inputProps={getInputProps(fields.startDate, { type: "date" })}
        labelsProps={{ children: "Date de début" }}
        errors={fields.startDate.errors}
      />
    </EditDialog>
  );
}
