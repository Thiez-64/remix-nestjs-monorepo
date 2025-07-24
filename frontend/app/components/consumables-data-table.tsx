import {
  ColumnDef
} from "@tanstack/react-table";
import { EllipsisVertical, Package } from "lucide-react";
import { CommodityType, Consumable, Stock } from "../lib/types";
import { getConsumableStatusConfig } from "../lib/utils";
import { CreatableComboboxField, Field } from "./forms";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { DataTable } from "./ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";


export function ConsumablesDataTable({
  consumables,
  stocks = [],
  fields,
  editable,
  onUpdateConsumable,
  onDeleteConsumable,
}: {
  consumables: any[];
  stocks: Stock[];
  fields: any;
  editable: boolean;
  onUpdateConsumable?: (consumableId: string, field: string, value: any) => void;
  onDeleteConsumable?: (consumableId: string) => void;
}) {

  const columns: ColumnDef<Consumable>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => {
        return (
          <CreatableComboboxField
            value={row.getValue("name")}
            onChange={(value) => {
              // Seulement déclencher si c'est une sélection d'option (pas de la frappe)
              const isExistingOption = stocks.some(s => s.name === value);
              if (isExistingOption || value.length >= 3) {
                onUpdateConsumable?.(row.original.id, "name", value);
              }
            }}
            options={stocks.map(s => ({ id: s.id, name: s.name }))}
            dropUp={true}
            className="gap-0"
          />
        )
      },
      enableHiding: false,
    },
    {
      accessorKey: "quantity",
      header: "Quantité",
      cell: ({ row }) => {
        return (
          <Field
            inputProps={{
              type: "number",
              defaultValue: row.getValue("quantity"),
              onChange: (e) => onUpdateConsumable?.(row.original.id, "quantity", e.target.value)
            }}
            labelsProps={{ children: "" }}
            className="gap-0"
          />
        )
      },
    },
    {
      accessorKey: "unit",
      header: "Unité",
      cell: ({ row }) => {
        return (
          <Field
            inputProps={{
              type: "text",
              defaultValue: row.getValue("unit"),
              onChange: (e) => onUpdateConsumable?.(row.original.id, "unit", e.target.value)
            }}
            labelsProps={{ children: "" }}
            className="gap-0"
          />
        )
      },
    },
    {
      accessorKey: "commodity",
      header: "Commodité",
      cell: ({ row }) => {
        return (
          <select
            name={`commodity-${row.original.id}`}
            defaultValue={row.getValue("commodity") || "ANALYSIS_LAB"}
            onChange={(e) => onUpdateConsumable?.(row.original.id, "commodity", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {Object.values(CommodityType).map((commodity) => (
              <option key={commodity} value={commodity}>
                {commodity}
              </option>
            ))}
          </select>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        return (
          <Field
            inputProps={{
              type: "text",
              defaultValue: row.getValue("description"),
              onChange: (e) => onUpdateConsumable?.(row.original.id, "description", e.target.value)
            }}
            labelsProps={{ children: "" }}
            className="gap-0"
          />
        )
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="w-full text-center">Statut</div>,
      cell: ({ row }) => {
        const available = row.original.status?.available;
        const missing = row.original.status?.missing;
        const config = getConsumableStatusConfig(missing || 0);
        return (
          <div className="flex items-center justify-end w-max">
            <Badge variant='secondary' className={`${config.bgColor}`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${config.dotColor}`}></div>
              {available ? (
                <span>{available} {row.original.unit} disponible</span>
              ) : (
                <span>-{missing} {row.original.unit} manquant</span>
              )}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <EllipsisVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Dupliquer</DropdownMenuItem>
            <DropdownMenuItem>Favoris</DropdownMenuItem>
            <DropdownMenuSeparator />
            {editable && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  if (row.getIsSelected()) {
                    onDeleteConsumable?.(row.original.id);
                  }
                }}
                disabled={!row.getIsSelected()}
              >
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (consumables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-0.5 mb-2 w-full" >
        <div className="mx-auto h-6 w-6 text-gray-300">
          <Package className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-gray-300">Aucun consommable défini</p>
        <p className="text-sm text-gray-300">Ajoutez un consommable pour commencer</p>
      </div >
    );
  }

  const consumablesWithStatus = consumables.map(consumable => {
    const stock = stocks.find(s => s.name === consumable.name);
    const available = stock?.quantity || 0;
    const missing = Math.max(0, consumable.quantity - available);
    const hasEnough = available >= consumable.quantity;

    return {
      ...consumable,
      status: {
        hasEnough,
        available,
        missing
      }
    };
  });

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={consumablesWithStatus} />
    </div>
  );
} 
