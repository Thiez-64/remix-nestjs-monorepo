import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs
} from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Plus, SquareArrowRight } from "lucide-react";
import { useState } from "react";
import { ActionButtons } from "../../components/action-buttons";
import { ActionsDataTable } from "../../components/actions-data-table";
import { CreateDialog } from "../../components/create-dialog";
import { EmptyState } from "../../components/empty-state";
import { Field } from "../../components/forms";
import { PageLayout } from "../../components/page-layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ActionTypeSchema } from "../../lib/schemas";
import { CommodityType, Tank, type ActionType, type Stock } from "../../lib/types";
import { requireUser } from "../../server/auth.server";
import { EditActionDialog } from "./production.$actionId.edit";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  if (!["USER"].includes(user.role)) {
    return redirect("/unauthorized");
  }

  const [actionTypes, stocks, tanks] = await Promise.all([
    context.remixService.prisma.actionType.findMany({
      include: {
        actions: {
          include: {
            consumables: true,
          },
        },
      },
    }),

    context.remixService.prisma.stock.findMany({
      where: { userId: user.id },
      include: {
        consumables: {
          select: {
            commodity: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),

    context.remixService.prisma.tank.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      include: {
        grapeComposition: true,
      },
    }),
  ]);

  return { actionTypes, stocks, tanks };
};

export type ProductionLoaderData = {
  actionTypes: (ActionType & {
    actions: {
      id: string;
      consumables: {
        id: string;
        name: string;
        quantity: number;
        originalQuantity: number | null;
        unit: string;
        description: string | null;
        commodity: CommodityType;
      }[];
    }[];
  })[];
  stocks: (Stock & {
    consumables: {
      commodity: CommodityType;
    }[];
  })[];
  tanks: Tank[];
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  await requireUser({ context });
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const actionTypeId = formData.get("actionTypeId");
    if (!actionTypeId) throw new Error("ActionType ID is required");

    await context.remixService.prisma.actionType.delete({
      where: { id: actionTypeId as string },
    });
    return new Response(null, { status: 200 });
  }

  // Validation Zod pour créer un ActionType
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ActionTypeSchema.superRefine(async (data, ctx) => {
      const existing = await context.remixService.prisma.actionType.findFirst({
        where: { name: data.name },
      });
      if (existing) {
        ctx.addIssue({ code: "custom", path: ["name"], message: "Une action avec ce nom existe déjà" });
      }
    }),
  });
  if (submission.status !== "success") return { result: submission.reply() };

  // Créer le template ActionType
  await context.remixService.prisma.actionType.create({
    data: {
      name: submission.value.name,
      description: submission.value.description ?? null,
    },
  });

  return { result: submission.reply() };
};

export default function Production() {
  const { actionTypes, tanks } = useLoaderData<ProductionLoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);

  const [form, fields] = useForm({
    id: "create-action",
    constraint: getZodConstraint(ActionTypeSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ActionTypeSchema });
    },
    lastResult: actionData?.result,
    onSubmit() {
      setOpen(false);
    },
    defaultValue: {
      name: "",
      description: "",
    },
  });


  return (
    <PageLayout
      title="Production à venir"
      description="Effectuez vos actions pour votre production"
      actionButton={{
        label: "Nouveau type d'action",
        icon: <Plus className="w-4 h-4 mr-2" />,
        onClick: () => setOpen(true)
      }}
    >
      <CreateDialog
        trigger={<Button style={{ display: 'none' }} />}
        title="Créer un nouveau type d'action"
        formProps={getFormProps(form)}
        isOpen={open}
        onOpenChange={setOpen}
        isSubmitting={isSubmitting}
        submitLabel="Créer le type d'action"
      >
        <Field
          inputProps={getInputProps(fields.name, { type: "text" })}
          labelsProps={{ children: "Nom du type d'action (ex: Fermentation, Clarification)" }}
          errors={fields.name.errors}
        />
        <Field
          inputProps={getInputProps(fields.description, { type: "text" })}
          labelsProps={{ children: "Description (optionnel)" }}
          errors={fields.description.errors}
        />
      </CreateDialog>
      <div className="grid gap-4">
        {actionTypes.length === 0 ? (
          <EmptyState
            icon={<SquareArrowRight className="mx-auto h-12 w-12" />}
            title="Aucun type d'action"
            description="Commencez par créer votre premier type d'action"
          />
        ) : (
            actionTypes.map((actionType, index) => (
              <Card key={actionType.id} >
                <Accordion type="single" collapsible>
                  <AccordionItem value={actionType.id}>
                    <CardHeader className="flex flex-row justify-between items-center">
                      <div className="flex flex-col gap-1 items-start">
                        <CardTitle>{actionType.name}</CardTitle>
                        {actionType.description && (
                          <CardDescription>{actionType.description}</CardDescription>
                        )}
                      </div>
                      <ActionButtons>
                        <EditActionDialog production={actionType} />
                        <AccordionTrigger className="flex justify-center items-center transition-colors shadow-sm bg-background border-input border hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-md p-0">
                        </AccordionTrigger>
                      </ActionButtons>
                    </CardHeader>

                    <AccordionContent>
                      <CardContent>
                        <ActionsDataTable data={actionType.actions.map((action) => ({
                          ...action,
                          tankId: tanks.find((tank) => tank.id === action.tankId)?.name,
                          name: actionType.name,
                          description: actionType.description,
                        }))} />
                      </CardContent>

                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
            </Card>
          ))
        )}
      </div>
    </PageLayout >
  );
}
