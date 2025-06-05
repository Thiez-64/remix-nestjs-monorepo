import { type RemixService } from "@thiez-64/backend";
import { z } from "zod";
import { TankSchema } from "~/routes/_user+/my-cellar";

export async function getTanks(remixService: RemixService, userId: string) {
  return await remixService.prisma.tank.findMany({
    where: { userId },
  });
}

export async function createTank(
  remixService: RemixService,
  userId: string,
  data: z.infer<typeof TankSchema>
) {
  return remixService.prisma.tank.create({
    data: {
      ...data,
      userId,
      currentWine: 0,
      status: "EMPTY",
      wineType: null,
    },
  });
}

export async function editTank(
  remixService: RemixService,
  userId: string,
  tankId: string,
  data: z.infer<typeof TankSchema>
) {
  return remixService.prisma.tank.update({
    where: { id: tankId, userId },
    data,
  });
}

export async function deleteTank(
  remixService: RemixService,
  userId: string,
  tankId: string
) {
  return remixService.prisma.tank.delete({
    where: { id: tankId, userId },
  });
}
