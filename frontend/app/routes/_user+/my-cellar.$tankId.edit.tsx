import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  redirect,
  type ActionFunctionArgs
} from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { requireUser } from "../../server/auth.server";
import { MyCellarLoaderData } from "./my-cellar";

export const EditTankSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  capacity: z.coerce.number().min(1, "La capacité doit être supérieure à 0"),
  material: z.enum(["INOX", "BETON", "BOIS", "PLASTIQUE"]),
  status: z.enum(["EMPTY", "IN_USE", "MAINTENANCE"]),
});



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
      status: submission.value.status,
    },
  });

  return redirect(`/my-cellar`);
};

export function EditTankDialog({ tank }: { tank: MyCellarLoaderData['tanks'][number] }) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      status: tank.status,
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
          <DialogTitle>Modifier {tank.name}</DialogTitle>
        </DialogHeader>

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
            <div className="flex justify-between gap-4">
              <div className="w-1/2 flex flex-col gap-2">
                <Label className="text-sm font-medium">Matériau</Label>
                <Select name={fields.material.name} defaultValue={tank.material}>
                  <SelectTrigger className="w-full">
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
              <div className="w-1/2 flex flex-col gap-2">
                <Label className="text-sm font-medium">Statut</Label>
                <Select name={fields.status.name} defaultValue={tank.status}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPTY">Vide</SelectItem>
                    <SelectItem value="IN_USE">En cours d&apos;utilisation</SelectItem>
                    <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {fields.status.errors && (
                  <p className="text-sm text-destructive">{fields.status.errors}</p>
                )}
              </div>
            </div>
          </div>

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
                Supprimer la cuve &quot;{tank.name}&quot;
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Cette action est irréversible. Cette cuve sera définitivement supprimé.
              </p>
              <div className="flex justify-center space-x-3 ">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </Button>
                <Form method="POST" action={`/my-cellar/${tank.id}/edit`}>
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
