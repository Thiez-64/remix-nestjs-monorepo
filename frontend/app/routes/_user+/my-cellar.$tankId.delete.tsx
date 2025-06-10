import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "../../server/auth.server";



export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const tankId = params.tankId;

  if (!tankId) {
    throw new Error("Tank ID is required");
  }

  await context.remixService.prisma.tank.delete({
    where: { id: tankId, userId: user.id },
  });

  return redirect("/my-cellar");
}; 
