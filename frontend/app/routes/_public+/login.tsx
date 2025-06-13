import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { Chrome, LockKeyhole } from "lucide-react";
import { z } from "zod";
import { Field } from "../../components/forms";
import { Button } from "../../components/ui/button";
import {
  getOptionalUser
} from "../../server/auth.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  if (user) {
    return redirect("/");
  }
  return null;
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const submission = await parseWithZod(formData, {
    async: true,
    schema: LoginSchema.superRefine(async (data, ctx) => {
      const { email, password } = data;

      const existingUser = await context.remixService.auth.checkIfUserExists({
        email,
        withPassword: true,
        password,
      });

      if (existingUser.error) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: existingUser.message,
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return new Response(JSON.stringify({ result: submission.reply() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  // l'email et le mot de passe sont valides, et un compte utilisateur existe.
  // connecter l'utilisateur.
  const { email } = submission.value;

  const { sessionToken } = await context.remixService.auth.authenticateUser({
    email,
  });

  const urlParams = new URL(request.url).searchParams
  const redirectTo = urlParams.get('redirectTo') || '/';
  // Connecter l'utilisateur associé à l'email
  return redirect(`/authenticate?token=${sessionToken}&redirectTo=${redirectTo}`);
};

const LoginSchema = z.object({
  email: z
    .string({
      required_error: "L'email est obligatoire.",
    })
    .email({
      message: "Cet email est invalide.",
    }),
  password: z.string({ required_error: "Le mot de passe est obligatoire." }),
});

export default function Login() {
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    constraint: getZodConstraint(LoginSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: LoginSchema,
      });
    },
    lastResult: actionData?.result,
  });
  return (
    <div className="rounded-lg divide-y divide-gray-200 dark:divide-gray-800 ring-1 ring-gray-200 dark:ring-gray-800 shadow bg-white dark:bg-background max-w-sm mx-auto w-full mt-14">
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-2 items-center">
          <LockKeyhole className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Welcome back!</h1>
          <div className="flex items-center">
            <span>Don&apos;t have an account?</span>
            <Link to="/register">
              <Button variant="link" className="text-[#c50017]">
                Sign up
              </Button>
            </Link>
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

          <Field
            inputProps={getInputProps(fields.password, {
              type: "password",
            })}
            labelsProps={{
              children: "Password",
            }}
            errors={fields.password.errors}
          />
          <Link to="/forgot-password">
            <Button variant="link" className="text-[#c50017]">
              Forgot password?
            </Button>
          </Link>
          <Button className="w-full" type="submit">
            Continue
          </Button>
        </Form>
        <div className="flex items-center align-center text-center w-full flex-row">
          <div className="flex border-gray-200 dark:border-gray-800 w-full border-t border-solid"></div>
          <div className="font-medium text-gray-700 dark:text-gray-200 flex mx-3 whitespace-nowrap">
            <span className="text-sm">or</span>
          </div>
          <div className="flex border-gray-200 dark:border-gray-800 w-full border-t border-solid"></div>
        </div>
        <Button
          className="w-full flex items-center justify-center gap-x-2.5"
          type="submit"
        >
          <Chrome className="w-4 h-4" />
          Continue with Google
        </Button>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          <span>By signing in, you agree to our</span>
          <Link to="/terms" className="text-primary font-medium">
            <Button variant="link" className="text-[#c50017]">
              Terms of Service
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
