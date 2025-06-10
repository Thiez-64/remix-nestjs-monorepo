import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "../../server/auth.server";



export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const actionId = params.actionId;

  if (!actionId) {
    throw new Error("Action ID is required");
  }

  await context.remixService.prisma.action.delete({
    where: { id: actionId, userId: user.id },
  });

  return redirect("/production");
}; 
