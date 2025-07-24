import { TestTubeDiagonal } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
const phColors = [
  "#ff151e", // 1 - très acide
  "#FF5319", // 2
  "#FFA502", // 3
  "#FFCE00", // 5
  "#FFFA00", // 5
  "#DCDF03", // 4
  "#6ED700", // 6
  "#6ED700", // 7 neutre
  "#00B900", // 8
  "#00C0B9", // 9
  "#008ACB", // 10
  "#044BCC", // 11
  "#341FB8", // 12
  "#490AA7", // 13
  "#3F0592", // 14 très basique
];

export function CardPh() {
  const phIndex = Math.min(Math.max(Math.round(3.4) - 1, 0), 13);
  return (
    <Card className="rounded-xl border bg-card text-card-foreground shadow w-full py-4 px-2 ">
      <CardHeader className="flex flex-row items-end justify-between p-0 space-y-0 mb-6">
        <h5 className="font-bold text-sm">pH</h5>
        <div className="h-6 w-6 bg-background border border-input rounded-md flex items-center justify-center">
          <TestTubeDiagonal className="w-3 h-3" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-4 ">
          {/* Valeur numérique */}
          <div className="text-4xl font-bold text-center w-full">{3.4.toFixed(1)}</div>
          {/* Echelle 14 cases */}
          <div className="flex w-full flex-row justify-between items-center">
            {phColors.map((color, index) => (
              <div key={index} className="flex flex-col items-center gap-0.5">
                <div className={`w-1 h-2 rounded ${index === phIndex ? "ring-2 ring-black scale-110 transition-transform duration-300" : ""}`} style={{ backgroundColor: color }}></div>
                <div className="w-2 h-2 text-xs text-muted-foreground">{index === phIndex ? index : ""}</div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>

  )
}
