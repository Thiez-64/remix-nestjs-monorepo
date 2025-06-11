import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useState } from "react";
import { Field } from "../../components/forms";
import { StocksDataTable } from "../../components/stocks-data-table";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { StockSchema } from "./stock.schema";



export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  const stocks = await context.remixService.prisma.stock.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  });

  return { stocks, user };
};

export type StockLoaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request, context }: ActionFunctionArgs) => {

  const user = await requireUser({ context });
  const formData = await request.formData();

  const intent = formData.get("intent");

  if (intent === "delete") {
    const stockId = formData.get("stockId");
    if (!stockId) {
      throw new Error("Stock ID is required");
    }

    await context.remixService.prisma.stock.delete({
      where: { id: stockId as string, userId: user.id },
    });

    return new Response(null, { status: 200 });
  }

  // Création d'un nouveau stock uniquement
  const submission = await parseWithZod(formData, {
    async: true,
    schema: StockSchema.superRefine(async (data, ctx) => {
      const existingStock = await context.remixService.prisma.stock.findFirst({
        where: {
          name: data.name,
          unit: data.unit,
          userId: user.id
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
    return { result: submission.reply() };
  }

  await context.remixService.prisma.stock.create({
    data: {
      name: submission.value.name,
      unit: submission.value.unit,
      quantity: submission.value.quantity,
      minimumQty: submission.value.minimumQty || 0,
      description: submission.value.description,
      userId: user.id,
    },
  });

  return { result: submission.reply() };
};

export default function Stock() {
  const { stocks } = useLoaderData<StockLoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);

  const [form, fields] = useForm({
    id: "create-stock",
    constraint: getZodConstraint(StockSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: StockSchema });
    },
    lastResult: actionData?.result,
    onSubmit() {
      setOpen(false);
    },
    defaultValue: {
      name: "",
      unit: "",
      description: "",
      quantity: 0,
      minimumQty: 0,
    },
  });

  // Calculer les stocks en alerte
  const lowStockItems = stocks.filter(stock => stock.quantity <= stock.minimumQty);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
          <p className="text-gray-600">
            Gérez vos stocks de consommables et produits
          </p>
          {lowStockItems.length > 0 && (
            <div className="p-2 mt-2 bg-orange-100 text-orange-800 rounded-md text-sm flex items-center gap-2 w-fit">
              <AlertTriangle className="w-4 h-4" />
              {lowStockItems.length} produit(s) en stock faible
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau produit</DialogTitle>
            </DialogHeader>

            <Form {...getFormProps(form)} method="POST" className="space-y-4">
              <Field
                inputProps={getInputProps(fields.name, { type: "text" })}
                labelsProps={{ children: "Nom du produit (ex: Levure, Sulfite)" }}
                errors={fields.name.errors}
              />

              <div className="grid grid-cols-2 gap-4">
                <Field
                  inputProps={getInputProps(fields.quantity, { type: "number", step: "0.1" })}
                  labelsProps={{ children: "Quantité en stock" }}
                  errors={fields.quantity.errors}
                />

                <Field
                  inputProps={getInputProps(fields.unit, { type: "text" })}
                  labelsProps={{ children: "Unité (g, ml, L)" }}
                  errors={fields.unit.errors}
                />
              </div>

              <Field
                inputProps={getInputProps(fields.minimumQty, { type: "number", step: "0.1" })}
                labelsProps={{ children: "Seuil d'alerte (optionnel)" }}
                errors={fields.minimumQty.errors}
              />

              <Field
                inputProps={getInputProps(fields.description, { type: "text" })}
                labelsProps={{ children: "Description (optionnel)" }}
                errors={fields.description.errors}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Ajout..." : "Ajouter au stock"}
                </Button>
              </div>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {stocks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun stock</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par ajouter vos premiers produits en stock
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <StocksDataTable stocks={stocks as unknown as StockLoaderData['stocks']} />
        )}
      </div>
    </div>
  );
} 
