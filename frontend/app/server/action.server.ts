import { AppLoadContext } from "@remix-run/node";

export const getActions = async ({
  context,
  userId,
}: {
  context: AppLoadContext;
  userId: string;
}) => {
  const actions = await context.remixService.prisma.action.findMany({
    where: {
      user: {
        id: userId,
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return actions;
};
