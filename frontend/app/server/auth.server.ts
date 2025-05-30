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

export const resetPassword = async ({
  context,
  token,
  newPassword,
}: {
  context: AppLoadContext;
  token: string;
  newPassword: string;
}) => {
  return await context.remixService.auth.resetPassword({
    token,
    newPassword,
  });
};

export const authenticateUser = async ({
  context,
  email,
}: {
  context: AppLoadContext;
  email: string;
}) => {
  return await context.remixService.auth.authenticateUser({
    email,
  });
};

export const checkIfUserExists = async ({
  context,
  email,
  withPassword,
  password,
}: {
  context: AppLoadContext;
  email: string;
  withPassword: boolean;
  password: string;
}) => {
  return await context.remixService.auth.checkIfUserExists({
    email,
    withPassword,
    password,
  });
};

export const createUserAndAuthenticate = async ({
  context,
  email,
  name,
  password,
}: {
  context: AppLoadContext;
  email: string;
  name: string;
  password: string;
}) => {
  const { email: createdUserEmail } =
    await context.remixService.auth.createUser({
      email,
      name,
      password,
    });

  const { sessionToken } = await authenticateUser({
    context,
    email: createdUserEmail,
  });

  return { sessionToken };
};

export const generatePasswordResetToken = async ({
  context,
  email,
}: {
  context: AppLoadContext;
  email: string;
}) => {
  return await context.remixService.auth.generatePasswordResetToken({ email });
};

export const changePassword = async ({
  context,
  userId,
  currentPassword,
  newPassword,
}: {
  context: AppLoadContext;
  userId: string;
  currentPassword: string;
  newPassword: string;
}) => {
  return await context.remixService.auth.changePassword({
    userId,
    currentPassword,
    newPassword,
  });
};
