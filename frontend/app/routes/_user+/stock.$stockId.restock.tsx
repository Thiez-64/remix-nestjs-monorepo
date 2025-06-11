import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "../../server/auth.server";

const RestockSchema = z.object({
  quantity: z.coerce.number().min(0.1, "La quantité doit être positive"),
});

export const action = async ({ params, request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const stockId = params.stockId;

  if (!stockId) {
    throw new Error("Stock ID is required");
  }

  const formData = await request.formData();

  const submission = parseWithZod(formData, {
    schema: RestockSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  // Récupérer le stock actuel
  const stock = await context.remixService.prisma.stock.findUnique({
    where: { id: stockId, userId: user.id },
  });

  if (!stock) {
    throw new Error("Stock not found");
  }

  // Mettre à jour le stock
  const newQuantity = stock.quantity + submission.value.quantity;

  await context.remixService.prisma.stock.update({
    where: { id: stockId },
    data: {
      quantity: newQuantity,
      isOutOfStock: false, // Remettre en stock normal
    },
  });

  console.log(`✅ Restocked ${submission.value.quantity} ${stock.unit} of ${stock.name}. New quantity: ${newQuantity}`);

  return redirect("/stock");
}; 
