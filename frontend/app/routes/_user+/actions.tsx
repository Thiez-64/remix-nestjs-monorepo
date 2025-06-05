import { useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { columnsActions } from "~/components/ColumnsActions";
import { CreateActionDialog } from "~/components/CreateActionDialog";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { createAction } from "~/server/action.server";
import { requireUser } from "~/server/auth.server";

export const CreateActionSchema = z.object({
  wineType: z.enum(["ROUGE", "BLANC", "ROSE"]),
  type: z.string(),
  description: z.string(),
  duration: z.coerce.number().min(1),
});

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  const actions = await context.remixService.prisma.action.findMany({
    where: { userId: user.id },
    include: {
      consumables: {
        include: {
          consumable: true,
        },
      },
    },
  });

  return json({
    actions: actions.map((action) => ({
      id: action.id,
      type: action.type,
      description: action.description,
      estimatedDuration: action.estimatedDuration,
      wineType: action.wineType as "ROUGE" | "BLANC" | "ROSE",
      needsPurchase: action.needsPurchase,
      consumables: action.consumables.map((ac) => ({
        name: ac.consumable.name,
        quantity: ac.quantity,
        unit: ac.consumable.unit,
      })),
    })),
  });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    async: true,
    schema: CreateActionSchema.superRefine(async (data, ctx) => {
      const existingAction = await context.remixService.prisma.action.findFirst(
        {
          where: { type: data.type, userId: user.id },
        }
      );

      if (existingAction) {
        ctx.addIssue({
          code: "custom",
          path: ["type"],
          message: "Une action avec ce type existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return json(submission.reply());
  }

  await createAction(context.remixService, user.id, submission.value);

  return json(submission.reply());
};

export default function Actions() {
  const { actions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    id: "create-action",
    constraint: getZodConstraint(CreateActionSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreateActionSchema });
    },
    lastResult: actionData,
  });

  const redWineActions = actions.filter(
    (action) => action.wineType === "ROUGE"
  );
  const whiteWineActions = actions.filter(
    (action) => action.wineType === "BLANC"
  );
  const roseWineActions = actions.filter(
    (action) => action.wineType === "ROSE"
  );

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Actions</h1>
        <CreateActionDialog form={form} fields={fields}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Action
          </Button>
        </CreateActionDialog>
      </div>

      <Tabs defaultValue="red" className="space-y-4">
        <TabsList>
          <TabsTrigger value="red">Vins Rouges</TabsTrigger>
          <TabsTrigger value="white">Vins Blancs</TabsTrigger>
          <TabsTrigger value="rose">Vins Rosés</TabsTrigger>
        </TabsList>

        <TabsContent value="red">
          <DataTable columns={columnsActions} data={redWineActions} />
        </TabsContent>

        <TabsContent value="white">
          <DataTable columns={columnsActions} data={whiteWineActions} />
        </TabsContent>

        <TabsContent value="rose">
          <DataTable columns={columnsActions} data={roseWineActions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
