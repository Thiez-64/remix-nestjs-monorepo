import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { ShieldUser } from "lucide-react";
import { z } from "zod";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import {
  generatePasswordResetToken,
  getOptionalUser
} from "../../server/auth.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  if (user) {
    return redirect("/");
  }
  return null;
};

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const submission = await parseWithZod(formData, {
    async: true,
    schema: ForgotPasswordSchema.superRefine(async (data) => {
      const { email } = data;

      const existingUser = await context.remixService.auth.checkIfUserExists({
        email,
        withPassword: false,
        password: "",
      });

      // On ne veut pas révéler si l'email existe ou non
      if (existingUser.error === false) {
        // L'utilisateur existe, on génère un token
        const resetToken = await generatePasswordResetToken({
          context,
          email,
        });

        // TODO: Envoyer l'email avec le token
        console.log("Reset token:", resetToken);
      }
    }),
  });

  if (submission.status !== "success") {
    return new Response(
      JSON.stringify({
        result: submission.reply(),
        message:
          "If an account exists with this email, a reset link has been sent.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // On retourne toujours un succès avec le même message
  return new Response(
    JSON.stringify({
      result: submission.reply(),
      message:
        "If an account exists with this email, a reset link has been sent.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    constraint: getZodConstraint(ForgotPasswordSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: ForgotPasswordSchema,
      });
    },
    lastResult: actionData?.result,
  });

  return (
    <div className="rounded-lg divide-y divide-gray-200 dark:divide-gray-800 ring-1 ring-gray-200 dark:ring-gray-800 shadow bg-white dark:bg-background max-w-sm mx-auto w-full mt-14">
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-2 items-center">
          <ShieldUser className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Reset your password</h1>
          <div className="flex items-center">
            <span>
              Enter your email below and we&apos;ll send you a link to reset
              your password.
            </span>
          </div>
        </div>
        <Form
          {...getFormProps(form)}
          method="POST"
          reloadDocument
          className="space-y-6"
        >
          <Field
            inputProps={getInputProps(fields.email, {
              type: "email",
            })}
            labelsProps={{
              children: "Email",
            }}
            errors={fields.email.errors}
          />

          {actionData?.message && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {actionData.message}
            </div>
          )}

          <Button className="w-full" type="submit">
            Continue
          </Button>
        </Form>
      </div>
    </div>
  );
}
