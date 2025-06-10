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
import { BatchLoaderData } from "./batch";

export const EditBatchSchema = z.object({
  name: z.string().min(1, "Le nom de la cuvée est requis"),
  description: z.string().optional(),
  quantity: z.number().min(1, "La quantité doit être supérieure à 0"),
});


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
    schema: EditBatchSchema,
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
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, fields] = useForm({
    id: "edit-batch",
    constraint: getZodConstraint(EditBatchSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditBatchSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: batch.name,
      description: batch.description,
      quantity: batch.quantity,
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
          <DialogTitle>Modifier {batch.name}</DialogTitle>
        </DialogHeader>

        <Form
          {...getFormProps(form)}
          method="POST"
          action={`/batch/${batch.id}/edit`}
          className="space-y-4"
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
            labelsProps={{ children: "Quantité" }}
            errors={fields.quantity.errors}
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
                Supprimer la cuvée &quot;{batch.name}&quot;
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Cette action est irréversible. Cette cuvée sera définitivement supprimé.
              </p>
              <div className="flex justify-center space-x-3 ">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </Button>
                <Form method="POST" action={`/batch/${batch.id}/delete`}>
                  <input type="hidden" name="intent" value="delete" />
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
