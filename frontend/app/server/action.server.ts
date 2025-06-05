import { type RemixService } from "@thiez-64/backend";
import { z } from "zod";
import { CreateActionSchema } from "~/routes/_user+/actions";

export async function createAction(
  remixService: RemixService,
  userId: string,
  data: z.infer<typeof CreateActionSchema>
) {
  const { duration, ...rest } = data;
  return remixService.prisma.action.create({
    data: {
      ...rest,
      userId,
      estimatedDuration: duration,
    },
  });
}

export async function deleteAction(
  remixService: RemixService,
  userId: string,
  actionId: string
) {
  return remixService.prisma.action.delete({
    where: { id: actionId, userId },
  });
}
