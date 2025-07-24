import { getTankContentVolume, getTankDetailedComposition, getTankFillPercentage, grapeVariety } from "../lib/utils";
import { Card } from "./ui/card";

export function CardBarreCuve({ tank }: { tank: any }) {
  return (
    <Card className="h-full w-full flex flex-col py-4 px-2 items-stretch gap-2">
      <div className="w-fit">
        {/* Informations générales */}
        <div className="flex flex-col text-sm ">
          <div className="flex flex-row gap-2 items-center">
            <p className="font-bold">Capacité :</p>
            <p>{tank.volume} hL</p>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <p className="font-bold">Contenu :</p>
            <p>{getTankContentVolume(tank as any).toFixed(1)} hL</p>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <p className="font-bold">Disponible :</p>
            <p>
              {(tank.volume - getTankContentVolume(tank as any)).toFixed(1)} hL</p>
          </div>
        </div>
      </div>
      <div className="w-50 flex-1">
        {/* Barre de progression avec composition par cépage */}
        <div className="flex gap-2 h-full">
          {/* Barre de progression verticale */}
          <div className="flex flex-col items-stretch">
            <div className="ml-3 h-32 w-3 bg-gray-200 rounded-full overflow-hidden flex flex-col-reverse flex-1">
              {getTankDetailedComposition(tank as any)?.map((comp, index) => {
                const height = (comp.volume / tank.volume) * 100;
                const colors = [
                  'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
                  'bg-purple-500', 'bg-red-500', 'bg-indigo-500'
                ];
                return (
                  <div
                    key={comp.grapeVariety}
                    className={`w-full ${colors[index % colors.length]}`}
                    style={{ height: `${height}%` }}
                    title={`${comp.grapeVariety}: ${comp.volume.toFixed(1)} hL (${comp.percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {getTankFillPercentage(tank as any).toFixed(1)}%
            </div>
          </div>

          {/* Légende des cépages */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <p className="text-xs font-bold">Composition</p>
            <div className="flex flex-col gap-1">
              {getTankDetailedComposition(tank as any)?.map((comp, index) => {
                const colors = [
                  'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
                  'bg-purple-500', 'bg-red-500', 'bg-indigo-500'
                ];
                const varietyLabel = grapeVariety.find(v => v.value === comp.grapeVariety)?.label || comp.grapeVariety;
                return (
                  <div key={comp.grapeVariety} className="flex flex-row items-center gap-2">
                    <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                    <span className="text-xs text-gray-600">
                      {varietyLabel} {comp.volume.toFixed(0)} hL
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Message si cuve vide */}
        {getTankContentVolume(tank as any) === 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-500">Cuve vide</p>
          </div>
        )}
      </div>
    </Card >
  );
}
