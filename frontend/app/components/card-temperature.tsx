import { Thermometer } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
const chartData = [
  { month: "Jan", desktop: 100 },
  { month: "Feb", desktop: 200 },
  { month: "Mar", desktop: 150 },
  { month: "Apr", desktop: 250 },
  { month: "May", desktop: 220 },
  { month: "Jun", desktop: 280 },
];

const chartConfig = {
  desktop: {
    label: "Température",
    color: "#2563eb",
  },
} satisfies ChartConfig

export function CardTemperature() {
  return (

    <Card className="rounded-xl border bg-card text-card-foreground shadow w-full py-4 px-2 ">
      <CardHeader className="flex flex-row items-end justify-between p-0 space-y-0">
        <h5 className="font-bold text-sm">Température</h5>
        <div className="h-6 w-6 bg-background border border-input rounded-md flex items-center justify-center">
          <Thermometer className="w-3 h-3" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-center text-lg font-bold text-[#2563eb]">21 °C</div>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
