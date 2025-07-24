import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
const maxValue = 15
const unit = "°Baumé"
export function CardDensity() {
  const segments = 30;
  const percentage = (5.4 / maxValue) * 100;
  const filledSegments = Math.round((percentage / 100) * segments);
  return (
    <Card className="rounded-xl border bg-card text-card-foreground shadow w-full py-4 px-2">
      <CardHeader className="flex flex-row items-end justify-between p-0 space-y-0 mb-6">
        <h5 className="font-bold text-sm">Densité</h5>
        <div className="h-6 w-6 bg-background border border-input rounded-md flex items-center justify-center">
          <Scale className="w-3 h-3" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-2 ">

          {/* Value */}
          <div className="text-xl font-bold text-center w-full">{5.4.toFixed(1)}{unit}</div>
          {/* Progress semi-circular */}
          <div className="relative w-full h-10 overflow-hidden">
            <div className="absolute inset-0 flex justify-center items-end">
              <div className="flex space-x-1 origin-bottom">
                {Array.from({ length: segments }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-1 h-5 rounded-full transition-all duration-300 ${index < filledSegments ? "bg-emerald-500" : "bg-gray-200"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

  )
}
