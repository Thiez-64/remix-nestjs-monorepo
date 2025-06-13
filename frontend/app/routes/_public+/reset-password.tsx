import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { LockKeyhole } from "lucide-react";
import { z } from "zod";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import { getOptionalUser, resetPassword } from "../../server/auth.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  if (user) {
    return redirect("/");
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/forgot-password");
  }

  // Valider le token
  const validation = await context.remixService.auth.validatePasswordResetToken(
    {
      token,
    }
  );

  if (validation.error) {
    return redirect(`/forgot-password?error=${validation.message}`);
  }

  return { token };
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/forgot-password");
  }

  const submission = await parseWithZod(formData, {
    async: true,
    schema: ResetPasswordSchema,
  });

  if (submission.status !== "success") {
    return new Response(JSON.stringify({ result: submission.reply() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { password } = submission.value;

  const result = await resetPassword({
    context,
    token,
    newPassword: password,
  });

  if (result.error) {
    return new Response(JSON.stringify({ result: submission.reply() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return redirect("/login?message=Your password has been reset");
};

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    constraint: getZodConstraint(ResetPasswordSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: ResetPasswordSchema,
      });
    },
    lastResult: actionData?.result,
  });

  return (
    <div className="rounded-lg divide-y divide-gray-200 dark:divide-gray-800 ring-1 ring-gray-200 dark:ring-gray-800 shadow bg-white dark:bg-background max-w-sm mx-auto w-full mt-14">
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-2 items-center">
          <LockKeyhole className="w-10 h-10" />
          <h1 className="text-4xl font-bold">New password</h1>
          <div className="flex items-center">
            <span>Enter your new password below.</span>
          </div>
        </div>
        <Form
          {...getFormProps(form)}
          method="POST"
          reloadDocument
          className="space-y-6"
        >
          <Field
            inputProps={getInputProps(fields.password, {
              type: "password",
            })}
            labelsProps={{
              children: "New password",
            }}
            errors={fields.password.errors}
          />

          <Field
            inputProps={getInputProps(fields.confirmPassword, {
              type: "password",
            })}
            labelsProps={{
              children: "Confirm password",
            }}
            errors={fields.confirmPassword.errors}
          />

          <Button className="w-full" type="submit">
            Reset password
          </Button>
        </Form>
      </div>
    </div>
  );
}
