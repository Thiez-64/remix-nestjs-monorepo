import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "../../server/auth.server";



export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const stockId = params.stockId;

  if (!stockId) {
    throw new Error("Stock ID is required");
  }

  await context.remixService.prisma.stock.delete({
    where: { id: stockId, userId: user.id },
  });

  return redirect("/stock");
}; 
