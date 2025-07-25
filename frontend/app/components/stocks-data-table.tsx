import { ColumnDef } from "@tanstack/react-table";
import { Boxes } from "lucide-react";
import { getCommodityStatusConfig, getStockStatusConfig } from "../lib/utils";
import { StockLoaderData } from "../routes/_user+/stock";
import { EditStockDialog } from "../routes/_user+/stock.$stockId.edit";
import { RestockDialog } from "./restock-dialog";
import { Badge } from "./ui/badge";
import { DataTable } from "./ui/data-table";

const columns: ColumnDef<StockLoaderData['stocks'][number]>[] = [
  {
    accessorKey: "name",
    header: "Produit",
    cell: ({ row }) => (
      <div>
        <div className="bg-font-medium">{row.getValue("name")}</div>
      </div>
    ),
  }, {
    id: "status",
    header: "Statut",
    cell: ({ row }) => {
      const quantity = row.original.quantity;
      const minimumQty = row.original.minimumQty;
      const isOutOfStock = quantity === 0;
      const isLowStock = quantity > 0 && quantity <= minimumQty;

      const config = getStockStatusConfig(isOutOfStock, isLowStock);

      return (
        <Badge variant='secondary' className={`${config.bgColor}`}>
          <div className={`w-1.5 h-1.5 rounded-full mr-1 ${config.dotColor}`}></div>
          {config.text}
        </Badge >
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Stock",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      const unit = row.original.unit;
      const minimumQty = row.original.minimumQty;
      const isOutOfStock = quantity === 0;
      const isLowStock = quantity > 0 && quantity <= minimumQty;

      return (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isOutOfStock
            ? 'text-red-600'
            : isLowStock
              ? 'text-orange-600'
              : 'text-gray-900'
            }`}>
            {quantity} {unit}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "minimumQty",
    header: "Seuil d'alerte",
    cell: ({ row }) => {
      const minimumQty = row.getValue("minimumQty") as number;
      const unit = row.original.unit;

      return (
        <span className="text-gray-600">
          {minimumQty} {unit}
        </span>
      );
    },
  },

  {
    accessorKey: "commodity",
    header: "Commodité",
    cell: ({ row }) => {
      const commodity = row.original.consumables[0].commodity;
      const config = getCommodityStatusConfig(commodity);
      return <Badge variant='secondary' className={`${config?.bgColor}`}>{config?.text}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        {/* eslint-disable @typescript-eslint/no-explicit-any */}
        <EditStockDialog stock={row.original as any} />
        <RestockDialog stock={row.original} />
        {/* eslint-enable @typescript-eslint/no-explicit-any */}
      </div>
    )
    ,
  },
];

export function StocksDataTable({ stocks }: { stocks: StockLoaderData['stocks'] }) {
  if (stocks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Boxes className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun stock</h3>
        <p className="text-gray-500">
          Commencez par ajouter vos premiers produits en stock
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={stocks} />
    </div>
  );
} 
