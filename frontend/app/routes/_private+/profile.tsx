import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { ShieldUser, User } from "lucide-react";
import z from "zod";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { requireUser } from "~/server/auth.server";
import { editProfile } from "~/server/profile.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  return json({ user });
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

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();

  const submission = await parseWithZod(formData, {
    async: true,
    schema: EditProfileSchema.superRefine(async (data, ctx) => {
      const { email } = data;

      if (email !== user.email) {
        const existingUser = await context.remixService.auth.checkIfUserExists({
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
    return json({ result: submission.reply() }, { status: 400 });
  }

  await editProfile({
    context,
    profileData: submission.value,
    userId: user.id,
  });

  return json({ result: submission.reply() });
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
          // action='/auth/login'
          reloadDocument
          className="flex flex-col gap-4"
        >
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
            Reset your password
          </h1>
          <span className="text-center">
            We are going to send you an email to change your password.
          </span>
        </div>
        <Button className="w-full">Reset</Button>
      </div>
    </div>
  );
}
