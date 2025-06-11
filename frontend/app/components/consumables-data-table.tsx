import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./ui/data-table";

interface ConsumableData {
  id: string;
  name: string;
  quantity: number;
  originalQuantity: number | null;
  unit: string;
  description: string | null;
}

const columns: ColumnDef<ConsumableData>[] = [
  {
    accessorKey: "name",
    header: "Nom",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantité",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      // const originalQuantity = row.original.originalQuantity;
      const unit = row.original.unit;

      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {quantity} {unit}
          </span>
          {/* {originalQuantity && originalQuantity !== quantity && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              base: {originalQuantity} {unit}
            </span>
          )} */}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      console.log('row', row)
      const status = row.getValue("status") as string;
      return <div className="text-gray-600">{status}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return (
        <div className="text-gray-600 max-w-[200px] truncate">
          {description || "—"}
        </div>
      );
    },
  },
];

interface ConsumablesDataTableProps {
  consumables: Array<{
    id: string;
    name: string;
    quantity: number;
    originalQuantity: number | null;
    unit: string;
    description: string | null;
  }>;
}

export function ConsumablesDataTable({ consumables }: ConsumablesDataTableProps) {
  if (consumables.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun consommable défini
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={consumables} />
    </div>
  );
} 
