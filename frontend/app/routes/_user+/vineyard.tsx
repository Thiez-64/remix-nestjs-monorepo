import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Plus, Sprout, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Pie, PieChart } from "recharts";
import { ActionButtons } from "../../components/action-buttons";
import { CreateDialog } from "../../components/create-dialog";
import { EmptyState } from "../../components/empty-state";
import { Field, SelectField } from "../../components/forms";
import { PageLayout } from "../../components/page-layout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import {
  ChartConfig, ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "../../components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { PlotSchema } from "../../lib/schemas";
import { grapeVarietyColors } from "../../lib/types";
import { grapeVariety } from "../../lib/utils";
import { requireUser } from "../../server/auth.server";
import { EditPlotDialog } from "./vineyard.$plotId.edit";


export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  const plots = await context.remixService.prisma.plot.findMany({
    where: {
      userId: user.id
    }
  });

  return { plots };
};

export type PlotLoaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();

  // Création d'un plot
  const submission = await parseWithZod(formData, {
    async: true,
    schema: PlotSchema.superRefine(async (data, ctx) => {
      const existingPlot = await context.remixService.prisma.plot.findFirst({
        where: { name: data.name, userId: user.id },
      });

      if (existingPlot) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Un batch avec ce nom existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  await context.remixService.prisma.plot.create({
    data: {
      name: submission.value.name,
      description: submission.value.description,
      surface: submission.value.surface,
      grapeVariety: submission.value.grapeVariety,
      userId: user.id,
    },
  });

  return { result: submission.reply() };


};

export const description = "Représentation du Vignoble"

const chartConfig = Object.fromEntries(
  Object.entries(grapeVarietyColors).map(([key, color]) => [
    key,
    {
      label: key,
      color: color
    }
  ])
) satisfies ChartConfig;

export default function Vineyard() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { plots } = useLoaderData<PlotLoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);
  const [form, fields] = useForm({
    id: "create-plot",
    constraint: getZodConstraint(PlotSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: PlotSchema });
    },
    lastResult: actionData?.result,
    onSubmit() {
      setOpen(false);
    },
    defaultValue: {
      name: "",
      description: "",
      surface: 0,
      grapeVariety: "CHARDONNAY"
    },
  });
  return <PageLayout
    title="Gestion de Vignobles"
    description="Gérez vos parcelles de vignes"
    actionButton={{
      label: "Nouvelle Parcelle",
      icon: <Plus className="w-4 h-4 mr-2" />,
      onClick: () => setOpen(true)
    }}
  >
    <CreateDialog
      trigger={<Button style={{ display: 'none' }} />} // Hidden trigger since we control via state
      title="Créer une nouvelle parcelle"
      formProps={getFormProps(form)}
      isOpen={open}
      onOpenChange={setOpen}
      isSubmitting={isSubmitting}
      submitLabel="Créer la parcelle"
    >
      <Field
        inputProps={getInputProps(fields.name, { type: "text" })}
        labelsProps={{ children: "Nom de la parcelle (ex: Chardonnay / Sauvignon Blanc)" }}
        errors={fields.name.errors}
      />
      <Field
        inputProps={getInputProps(fields.description, { type: "text" })}
        labelsProps={{ children: "Description (optionnel)" }}
        errors={fields.description.errors}
      />
      <Field
        inputProps={getInputProps(fields.surface, { type: "number" })}
        labelsProps={{ children: "Surface (en hectares)" }}
        errors={fields.surface.errors}
      />
      <SelectField
        name={fields.grapeVariety.name}
        defaultValue={fields.grapeVariety.value || "CHARDONNAY"}
        labelsProps={{ children: "Cépage" }}
        errors={fields.grapeVariety.errors}
        options={grapeVariety.map((variety) => ({
          id: variety.value,
          name: variety.label
        }))}
      />
    </CreateDialog>
    <div className="grid gap-4">

      {plots.length === 0 ? (
        <EmptyState
          icon={<Sprout className="mx-auto h-12 w-12" />}
          title="Aucune parcelle"
          description="Commencez par créer votre première parcelle"
        />
      ) :
        <>
          <Tabs defaultValue="list" className="w-full">
            <TabsList>
              <TabsTrigger value="list">Liste</TabsTrigger>
              <TabsTrigger value="graph">Graphique</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="flex flex-col gap-2">
              {plots.map((plot) => (
                <Card key={plot.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle>{plot.name}</CardTitle>
                        {plot.description && (
                          <CardDescription>{plot.description}</CardDescription>
                        )}
                      </div>
                      <ActionButtons>
                        <EditPlotDialog plot={plot as unknown as PlotLoaderData['plots'][number]} />
                      </ActionButtons>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-row items-center gap-4">
                      <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                        <p className="font-bold">Surface totale :</p>
                        <p> {plot.surface} ha</p>
                      </div>
                      <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                        <p className="font-bold">Cépage :</p>
                        <p> {plot.grapeVariety}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              }
            </TabsContent>
            <TabsContent value="graph">
              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle>Représentation du Vignoble</CardTitle>
                  <CardDescription>
                    <div className="flex flex-row gap-2">
                      <p className="font-bold">
                        Surface totale :
                      </p>
                      <p>
                        {plots.reduce((acc, plot) => acc + plot.surface, 0).toFixed(2)} ha, {plots.length} cépages
                      </p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[500px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={plots.map(plot => ({
                          browser: plot.grapeVariety,
                          visitors: plot.surface,
                          fill: grapeVarietyColors[plot.grapeVariety] || "#808080"
                        }))}
                        dataKey="visitors"
                        nameKey="browser"
                        stroke="0"
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 leading-none font-medium">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="text-muted-foreground leading-none">
                    Showing total visitors for the last 6 months
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

        </>
      }
    </div>
  </PageLayout>;

}
