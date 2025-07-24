import {
  ColumnDef
} from "@tanstack/react-table";
import { DataTable } from "./ui/data-table";

type GrapeCompoRow = {
  id: string;
  grapeVariety: string;
  quantity: number;
  unit: string;
  percentage: number;
  harvestDate: Date;

}
export function GrapeCompositionDataTable({ data }: { data: GrapeCompoRow[] }) {
  const columns: ColumnDef<GrapeCompoRow>[] = [

    {
      accessorKey: "grapeVariety",
      header: "Variété",
      cell: ({ row }) => {
        return <div className="font-bold">{row.getValue("grapeVariety")}</div>;
      },
      enableHiding: false,
    },
    {
      accessorKey: "volume",
      header: "Volume",
      cell: ({ row }) => {
        const volume = row.getValue("volume") as number;
        return <div className="font-bold">{volume.toFixed(1)}</div>;
      },
    },
    {
      accessorKey: "unit",
      header: "Unité",
      cell: () => {
        return <div className="font-bold">hL</div>;
      },
    },
    {
      accessorKey: "addedAt",
      header: "Date de récolte",
      cell: ({ row }) => {
        const harvestDate = row.getValue("addedAt") as Date;
        return <div className="font-bold">{harvestDate.toLocaleDateString('fr-FR')}</div>;
      },
    },
    {
      accessorKey: "percentage",
      header: "Pourcentage",
      cell: ({ row }) => {
        const percentage = row.getValue("percentage") as number;
        return <div className="font-bold">{percentage.toFixed(1)}%</div>;
      },
    },

  ];



  const grapeCompositionWithStatus = data.map(grape => {
    return {
      ...grape,
    };
  });

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={grapeCompositionWithStatus} pagination={false} emptyMessage="Aucun cépage dans cette cuve." />
    </div>
  );
} 
