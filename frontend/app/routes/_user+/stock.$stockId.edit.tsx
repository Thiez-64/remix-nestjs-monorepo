import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { useState } from "react";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { StockLoaderData } from "./stock";
import { StockSchema } from "./stock.schema";



export const action = async ({
  request,
  params,
  context,
}: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const stockId = params.stockId;

  if (!stockId) {
    throw new Error("Stock ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Gestion de la suppression
  if (intent === "delete") {
    const stock = await context.remixService.prisma.stock.findUnique({
      where: { id: stockId, userId: user.id },
    });

    if (!stock) {
      throw new Error("Stock not found");
    }

    await context.remixService.prisma.stock.delete({
      where: { id: stockId, userId: user.id },
    });

    return redirect(`/stock`);
  }

  // Gestion de la modification
  const submission = await parseWithZod(formData, {
    async: true,
    schema: StockSchema.superRefine(async (data, ctx) => {
      const existingStock = await context.remixService.prisma.stock.findFirst({
        where: {
          name: data.name,
          unit: data.unit,
          quantity: data.quantity,
          minimumQty: data.minimumQty,
          description: data.description,
          userId: user.id,
          id: { not: stockId },
        },
      });

      if (existingStock) {
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



  const stock = await context.remixService.prisma.stock.findUnique({
    where: { id: stockId, userId: user.id },
  });

  if (!stock) {
    throw new Error("Stock not found");
  }

  await context.remixService.prisma.stock.update({
    where: { id: stockId },
    data: {
      name: submission.value.name,
      unit: submission.value.unit,
      quantity: submission.value.quantity,
      minimumQty: submission.value.minimumQty,
      description: submission.value.description,
    },
  });

  return redirect(`/stock`);
};


export function EditStockDialog({
  stock
}: {
  stock: StockLoaderData['stocks'][number]
}) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, fields] = useForm({
    id: "edit-stock",
    constraint: getZodConstraint(StockSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: StockSchema });
    },
    lastResult: actionData,
    defaultValue: {
      name: stock.name,
      unit: stock.unit,
      quantity: stock.quantity,
      minimumQty: stock.minimumQty,
      description: stock.description || "",
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
          <DialogTitle>Modifier {stock.name}</DialogTitle>
        </DialogHeader>

        <Form
          {...getFormProps(form)}
          method="POST"
          action={`/stock/${stock.id}/edit`}
          className="space-y-4"
        >
          <Field
            inputProps={getInputProps(fields.name, { type: "text" })}
            labelsProps={{ children: "Nom du produit" }}
            errors={fields.name.errors}
          />

          <Field
            inputProps={getInputProps(fields.unit, { type: "text" })}
            labelsProps={{ children: "Unité" }}
            errors={fields.unit.errors}
          />
          <Field
            inputProps={getInputProps(fields.quantity, { type: "number" })}
            labelsProps={{ children: "Quantité" }}
            errors={fields.quantity.errors}
          />
          <Field
            inputProps={getInputProps(fields.minimumQty, { type: "number" })}
            labelsProps={{ children: "Quantité minimum" }}
            errors={fields.minimumQty.errors}
          />

          <Field
            inputProps={getInputProps(fields.description, { type: "text" })}
            labelsProps={{ children: "Description" }}
            errors={fields.description.errors}
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
                Supprimer le stock &quot;{stock.name}&quot;
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Cette action est irréversible. Elle sera définitivement supprimée.
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
                  <input type="hidden" name="stockId" value={stock.id} />
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
