import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { TrendingUp, Wine } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { ActionButtons } from "../../components/action-buttons";
import { EmptyState } from "../../components/empty-state";
import { PageLayout } from "../../components/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import {
  ChartConfig, ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "../../components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { grapeVarietyColors } from "../../lib/types";
import { requireUser } from "../../server/auth.server";
import { PlotLoaderData } from "./vineyard";
import { EditPlotDialog } from "./vineyard.$plotId.edit";


export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  const batches = await context.remixService.prisma.batch.findMany({
    where: {
      userId: user.id
    }
  });

  const tanks = await context.remixService.prisma.tank.findMany({
    where: {
      userId: user.id
    },
    include: {
      grapeComposition: true
    }
  });

  return { batches, tanks };
};

export type BatchLoaderData = Awaited<ReturnType<typeof loader>>;

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

export default function MyStorage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { batches, tanks } = useLoaderData<BatchLoaderData>();


  return <PageLayout
    title="Gestion des Cuvées"
    description="Liste de vos cuvées disponibles dans votre cave de stockage"
  >
    <div className="grid gap-4">
      {batches.length === 0 ? (
        <EmptyState
          icon={<Wine className="mx-auto h-12 w-12" />}
          title="Aucune cuvée"
          description="Commencez par créer votre première cuvée"
        />
      ) :
        <>
          <Tabs defaultValue="list" className="w-full">
            <TabsList>
              <TabsTrigger value="list">Liste</TabsTrigger>
              <TabsTrigger value="graph">Graphique</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="flex flex-col gap-2">
              {batches.map((batch) => (
                <Card key={batch.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle>{batch.name}</CardTitle>
                        {batch.description && (
                          <CardDescription>{batch.description}</CardDescription>
                        )}
                      </div>
                      <ActionButtons>
                        <EditPlotDialog plot={batch as unknown as PlotLoaderData['plots'][number]} />
                      </ActionButtons>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-row items-center gap-4">
                      <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                        <p className="font-bold">Volume totale :</p>
                        <p> {batch.volume} hL</p>
                      </div>
                      <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                        <p className="font-bold">Cépage :</p>
                        <p>{tanks.filter(tank => tank.id === batch.tankId).map(tank => tank.grapeComposition.filter(grape => grape.tankId === batch.tankId).map(grape => {
                          return `${grape.grapeVariety} (${grape.percentage} %)`
                        }).join(', ')).join(', ')}</p>
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
                  <CardTitle>Représentation des cuvées</CardTitle>
                  <CardDescription>
                    <div className="flex flex-row gap-2">
                      <p className="font-bold">
                        Volume total :
                      </p>
                      <p>
                        {batches.reduce((acc, batch) => acc + batch.volume, 0).toFixed(2)} hL, {batches.length} cuvée(s)
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
                        data={batches.map(batch => ({
                          browser: batch.name,
                          visitors: batch.volume,
                          fill: grapeVarietyColors[batch.name] || "#808080"
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
