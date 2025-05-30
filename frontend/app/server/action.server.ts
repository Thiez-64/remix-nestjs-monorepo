import { type AppLoadContext } from "@remix-run/node";

export const getActionsByUser = async ({
  context,
  userId,
}: {
  context: AppLoadContext;
  userId: string;
}) => {
  return await context.remixService.prisma.action.findMany({
    where: {
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });
};

export const createAction = async ({
  context,
  data,
}: {
  context: AppLoadContext;
  data: {
    title: string;
    description: string;
    quantity: number;
    date: Date;
    userId: string;
  };
}) => {
  return await context.remixService.prisma.action.create({
    data: {
      title: data.title,
      description: data.description,
      date: data.date,
      quantity: data.quantity,
      user: {
        connect: { id: data.userId }, // relation explicite avec l'utilisateur
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};
