import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { z } from "zod";
import { Field, TextareaField } from "../../components/forms";
import { Timeline } from "../../components/Timeline";
import { Button } from "../../components/ui/button";
import { Calendar } from "../../components/ui/calendar";
import { createAction, getActionsByUser } from "../../server/action.server";
import { getOptionalUser, requireRole } from "../../server/auth.server";
import ActionItem from "~/components/ActionItem";

// Fonction pour vérifier si le titre est unique
async function checkTitleUniqueness(title: string): Promise<boolean> {
  // Simule une vérification dans la base de données
  const existingTitles = ["Action 1", "Action 2"]; // Titres existants
  return !existingTitles.includes(title); // Retourne true si le titre est unique
}

// Fonction pour vérifier si une date est un jour ouvrable
async function checkIfBusinessDay(date: Date): Promise<boolean> {
  // Vérifie si la date est un jour ouvrable (lundi à vendredi)
  const day = date.getDay(); // 0 = Dimanche, 6 = Samedi
  return day !== 0 && day !== 6; // Retourne true si ce n'est pas un week-end
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  if (user?.role !== "USER") {
    return redirect("/unauthorized");
  }
  const actions = await getActionsByUser({ context, userId: user.id });

  return json({ user, actions });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const submission = await parseWithZod(formData, {
    async: true,
    schema: actionSchema.superRefine(async (data, ctx) => {
      // Exemple de validation asynchrone : vérifier si le titre est unique
      const { date, title } = data;

      const isTitleUnique = await checkTitleUniqueness(title);
      if (!isTitleUnique) {
        ctx.addIssue({
          code: "custom",
          path: ["title"],
          message: "Le titre doit être unique.",
        });
      }

      const isBusinessDay = await checkIfBusinessDay(date);
      if (!isBusinessDay) {
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: "La date doit être un jour ouvrable.",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return json({ result: submission.reply() }, { status: 400 });
  }

  const user = await requireRole({ context, role: "USER" });

  const action = await createAction({
    context,
    data: {
      title: submission.value.title,
      description: submission.value.description,
      date: submission.value.date,
      quantity: submission.value.quantity,
      userId: user.id,
    },
  });

  return json({ action });
};

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

export default function Actions() {
  const data = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  const [form, fields] = useForm({
    constraint: getZodConstraint(actionSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: actionSchema });
    },
    lastResult:
      actionData && "result" in actionData ? actionData.result : undefined,
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Déclarer une action</h1>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-4">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold mb-6">Sélectionner une date</h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
              }}
              locale={fr}
            />
          </div>

          <div className="flex flex-col gap-4 min-w-80">
            <h2 className="text-2xl font-bold mb-6">Déclarer une action</h2>
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

              <TextareaField
                labelProps={{ children: "Description" }}
                textareaProps={{
                  ...getTextareaProps(fields.description),
                  placeholder: "Décrivez l'action",
                }}
                errors={fields.description.errors}
              />

              <div>
                <p className="text-sm text-gray-500">
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

        <div className="">
          <h2 className="text-2xl font-bold mb-6">Timeline des actions</h2>
          {data.actions.map((action, index) => (
            <ActionItem action={action} key={index} />
          ))}
          {/* <Timeline
            actions={data.actions.map((action) => ({
              ...action,
              date: new Date(action.date),
            }))}
          /> */}
        </div>
      </div>
    </div>
  );
}
