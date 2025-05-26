import { redirect, type AppLoadContext } from "@remix-run/node";
import { z } from "zod";

const authenticatedUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
});

export const getOptionalUser = async ({
  context,
}: {
  context: AppLoadContext;
}) => {
  const user = authenticatedUserSchema
    .optional()
    .nullable()
    .parse(context.user);
  if (user) {
    return await context.remixService.getUser({ userId: user.id });
  }
  return null;
};

export const requireUser = async ({ context }: { context: AppLoadContext }) => {
  const user = await getOptionalUser({ context });
  if (!user) {
    throw redirect("/login");
  }
  return user;
};

export const requireRole = async ({
  context,
  role,
}: {
  context: AppLoadContext;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
}) => {
  const user = await requireUser({ context });

  if (role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
    throw redirect("/unauthorized");
  }

  if (role === "ADMIN" && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    throw redirect("/unauthorized");
  }

  if (
    role === "USER" &&
    !["USER", "ADMIN", "SUPER_ADMIN"].includes(user.role)
  ) {
    throw redirect("/unauthorized");
  }

  return user;
};
