import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { ProcessLoaderData } from "./process";

export const EditProcessSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  startDate: z.date().optional(),
});



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
    schema: EditProcessSchema.superRefine(async (data, ctx) => {
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
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, fields] = useForm({
    id: "edit-process",
    constraint: getZodConstraint(EditProcessSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditProcessSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: process.name,
      description: process.description || "",
      startDate: process.startDate ? new Date(process.startDate).toLocaleTimeString("fr-FR") : "",
    },
    onSubmit() {
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier {process.name}</DialogTitle>
        </DialogHeader>

        <Form
          {...getFormProps(form)}
          method="POST"
          action={`/process/${process.id}/edit`}
          className="space-y-4"
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
                Supprimer le processus &quot;{process.name}&quot;
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Cette action est irréversible. Ce processus sera définitivement supprimé.
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
                  <input type="hidden" name="processId" value={process.id} />
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
