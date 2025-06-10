import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "../../server/auth.server";


export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const batchId = params.batchId;

  if (!batchId) {
    throw new Error("Batch ID is required");
  }

  await context.remixService.prisma.batch.delete({
    where: { id: batchId, userId: user.id },
  });

  return redirect("/batch");
}; 
