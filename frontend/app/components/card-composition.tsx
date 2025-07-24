import { GrapeCompositionDataTable } from "./grapeComposition-data-table";
import { Card, CardContent, CardHeader } from "./ui/card";

export function CardComposition({ tank }: { tank: any }) {
  const grapeCompoWithHarvest = tank.grapeComposition.map(grape => {
    return {
      ...grape,
    };
  });


  return (
    <Card className="h-full flex flex-col gap-4">
      <CardHeader>
        <h4 className="text-lg font-bold">Composition</h4>
      </CardHeader>
      <CardContent>
        <GrapeCompositionDataTable data={grapeCompoWithHarvest as any} />
      </CardContent>
    </Card >
  );
}
