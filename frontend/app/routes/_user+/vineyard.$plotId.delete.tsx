import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "../../server/auth.server";



export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const plotId = params.plotId;

  if (!plotId) {
    throw new Error("Plot ID is required");
  }

  await context.remixService.prisma.plot.delete({
    where: { id: plotId, userId: user.id },
  });

  return redirect("/vineyard");
}; 
