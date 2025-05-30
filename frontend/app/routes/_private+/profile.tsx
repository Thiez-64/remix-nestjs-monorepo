import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { ShieldUser, User } from "lucide-react";
import { z } from "zod";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import {
  changePassword,
  checkIfUserExists,
  requireUser,
} from "~/server/auth.server";
import { editProfile } from "~/server/profile.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  return { user };
};

export const EditProfileSchema = z.object({
  email: z
    .string({
      required_error: "L'email est obligatoire.",
    })
    .email({
      message: "Cet email est invalide.",
    }),
  name: z.string({ required_error: "Le prénom est obligatoire." }),
});

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  if (!user) {
    throw new Error("User not found");
  }
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "password") {
    const submission = await parseWithZod(formData, {
      async: true,
      schema: ChangePasswordSchema,
    });

    if (submission.status !== "success") {
      return new Response(JSON.stringify({ result: submission.reply() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { currentPassword, newPassword } = submission.value;

    if (!context.user) {
      throw new Error("User not found");
    }

    const result = await changePassword({
      context,
      userId: context.user.id,
      currentPassword,
      newPassword,
    });

    if (result.error) {
      return new Response(JSON.stringify({ result: submission.reply() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        result: submission.reply(),
        message: "Password changed successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!context.user) {
    throw new Error("User not found");
  }

  const submission = await parseWithZod(formData, {
    async: true,
    schema: EditProfileSchema.superRefine(async (data, ctx) => {
      const { email } = data;

      if (email !== user.email) {
        const existingUser = await checkIfUserExists({
          context,
          email,
          withPassword: false,
          password: "",
        });

        if (existingUser.error === false) {
          ctx.addIssue({
            code: "custom",
            path: ["email"],
            message: existingUser.message,
          });
          return false;
        }
      }
    }),
  });

  if (submission.status !== "success") {
    return new Response(JSON.stringify({ result: submission.reply() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await editProfile({
    context,
    profileData: submission.value,
    userId: context.user.id,
  });

  return new Response(
    JSON.stringify({
      result: submission.reply(),
      message: "Profile updated successfully",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    constraint: getZodConstraint(EditProfileSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditProfileSchema });
    },
    lastResult: actionData?.result,
    defaultValue: {
      email: user.email,
      name: user.name,
    },
  });

  const [passwordForm, passwordFields] = useForm({
    constraint: getZodConstraint(ChangePasswordSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangePasswordSchema });
    },
    lastResult: actionData?.result,
  });
  return (
    <div className="bg-white dark:bg-background max-w-sm mx-auto w-full mt-14 flex flex-col gap-4">
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-2 items-center">
          <User className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Profile</h1>
          <span className="text-center">{user.email}</span>
        </div>
        <Form
          {...getFormProps(form)}
          method="POST"
          reloadDocument
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="intent" value="profile" />
          <Field
            inputProps={getInputProps(fields.name, {
              type: "text",
            })}
            labelsProps={{
              children: "Name",
            }}
            errors={fields.name.errors}
          />
          <Field
            inputProps={getInputProps(fields.email, {
              type: "email",
            })}
            labelsProps={{
              children: "Email",
            }}
            errors={fields.email.errors}
          />
          <Button className="w-full" type="submit">
            Update
          </Button>
        </Form>
      </div>
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-2 items-center">
          <ShieldUser className="w-10 h-10" />
          <h1 className="text-4xl font-bold text-center">
            Change your password
          </h1>
          <span className="text-center">
            Enter your current password and choose a new one.
          </span>
        </div>
        <Form
          {...getFormProps(passwordForm)}
          method="POST"
          className="space-y-4"
        >
          <input type="hidden" name="intent" value="password" />
          <Field
            inputProps={getInputProps(passwordFields.currentPassword, {
              type: "password",
            })}
            labelsProps={{
              children: "Current Password",
            }}
            errors={passwordFields.currentPassword.errors}
          />
          <Field
            inputProps={getInputProps(passwordFields.newPassword, {
              type: "password",
            })}
            labelsProps={{
              children: "New Password",
            }}
            errors={passwordFields.newPassword.errors}
          />
          <Field
            inputProps={getInputProps(passwordFields.confirmPassword, {
              type: "password",
            })}
            labelsProps={{
              children: "Confirm New Password",
            }}
            errors={passwordFields.confirmPassword.errors}
          />

          {actionData?.message && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {actionData.message}
            </div>
          )}

          <Button className="w-full" type="submit">
            Change Password
          </Button>
        </Form>
      </div>
    </div>
  );
}
