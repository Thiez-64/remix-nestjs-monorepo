import { type AppLoadContext } from "@remix-run/node";
import { type z } from "zod";
import { EditProfileSchema } from "~/routes/_private+/profile";

export const editProfile = async ({
  context,
  profileData,
  userId,
}: {
  context: AppLoadContext;
  profileData: z.infer<typeof EditProfileSchema>;
  userId: string;
}) => {
  return await context.remixService.prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      email: profileData.email,
      name: profileData.name,
    },
    select: {
      id: true,
    },
  });
};
