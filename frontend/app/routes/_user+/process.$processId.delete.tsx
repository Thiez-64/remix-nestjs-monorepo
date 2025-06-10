import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "../../server/auth.server";



export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const processId = params.processId;

  if (!processId) {
    throw new Error("Process ID is required");
  }

  await context.remixService.prisma.process.delete({
    where: { id: processId, userId: user.id },
  });

  return redirect("/process");
}; 
