import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { z } from "zod";
import { Field, TextareaField } from "~/components/forms";
import { Timeline } from "~/components/Timeline";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { getActions } from "~/server/action.server";
import { getOptionalUser, requireRole } from "~/server/auth.server";

const actionSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit faire au moins 3 caractères")
    .max(100, "Le titre ne doit pas dépasser 100 caractères"),
  description: z
    .string()
    .min(10, "La description doit faire au moins 10 caractères")
    .max(500, "La description ne doit pas dépasser 500 caractères"),
  date: z.date().min(new Date(), "La date ne peut pas être dans le passé"),
  quantity: z
    .number()
    .min(1, "La quantité doit être supérieure à 0")
    .max(1000000, "La quantité ne peut pas dépasser 1000000"),
});

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  if (user?.role !== "USER") {
    return redirect("/unauthorized");
  }
  const actions = await getActions({ context, userId: user.id });
  return json({ user, actions });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireRole({ context, role: "USER" });
  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema: actionSchema });

  if (submission.status !== "success") {
    return json({ error: { fieldErrors: submission.reply() } });
  }

  const action = await context.remixService.createAction({
    ...submission.value,
    userId: user.id,
  });

  return json({ action });
};

export default function Actions() {
  const { actions } = useLoaderData<typeof loader>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  const [form, fields] = useForm({
    id: "action-form",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: actionSchema });
    },
    shouldValidate: "onBlur",
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Déclarer une action</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="flex flex-col gap-4 justify-center items-center">
          <h2 className="text-xl font-semibold mb-4">Sélectionner une date</h2>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
            }}
            locale={fr}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Form method="POST" {...getFormProps(form)} className="space-y-4">
            <input
              type="hidden"
              name="date"
              value={selectedDate?.toISOString() || ""}
            />

            <Field
              labelsProps={{ children: "Titre de l'action" }}
              inputProps={getInputProps(fields.title, {
                type: "text",
                placeholder: "Entrez le titre de l'action",
              })}
              errors={fields.title.errors}
            />

            <TextareaField
              labelProps={{ children: "Description" }}
              textareaProps={{
                ...getTextareaProps(fields.description),
                placeholder: "Décrivez l'action",
              }}
              errors={fields.description.errors}
            />

            <Field
              labelsProps={{ children: "Quantité" }}
              inputProps={getInputProps(fields.quantity, {
                type: "number",
                min: "1",
                max: "1000000",
                placeholder: "Entrez la quantité",
              })}
              errors={fields.quantity.errors}
            />

            <div>
              <p className="text-sm text-gray-500 mb-2">
                Date sélectionnée:
                {selectedDate
                  ? format(selectedDate, "PPP", { locale: fr })
                  : "Aucune date sélectionnée"}
              </p>
              {fields.date.errors && (
                <p className="mt-1 text-sm text-red-600">
                  {fields.date.errors.join(", ")}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Publier l&apos;action
            </Button>
          </Form>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Timeline des actions</h2>
        <Timeline actions={actions} />
      </div>
    </div>
  );
}
