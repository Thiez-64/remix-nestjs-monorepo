import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { Settings } from "lucide-react";
import { EditDialog } from "../../components/edit-dialog";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { StockSchema } from "../../lib/schemas";
import { requireUser } from "../../server/auth.server";
import { StockLoaderData } from "./stock";

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
      isOutOfStock: submission.value.quantity <= submission.value.minimumQty,
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
    },
  });

  return (
    <EditDialog
      trigger={
        <Button variant="outline" size="icon" className="size-8">
          <Settings className="w-4 h-4" />
        </Button>
      }
      title={`Modifier ${stock.name}`}
      formProps={getFormProps(form)}
      isSubmitting={isSubmitting}
      editAction={`/stock/${stock.id}/edit`}
      deleteAction={`/stock/${stock.id}/edit`}
      itemName={stock.name}
      itemType="le stock"
      deleteInputs={[{ name: "intent", value: "delete" }]}
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
    </EditDialog>
  );
}
