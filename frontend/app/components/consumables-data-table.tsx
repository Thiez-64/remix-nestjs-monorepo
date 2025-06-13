import {
  ColumnDef
} from "@tanstack/react-table";
import { Check, EllipsisVertical, X } from "lucide-react";
import { useState } from "react";
import { CreatableComboboxField } from "./forms";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { DataTable } from "./ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type ConsumableData = {
  id: string;
  name: string;
  quantity: number;
  originalQuantity: number | null;
  unit: string;
  description: string | null;
  commodity?: string;
  status?: {
    hasEnough: boolean;
    available: number;
    missing: number;
  };
}

type StockData = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  consumables?: {
    commodity: string;
  }[];
}

const getStatusConfig = (missing: number) => {
  if (missing) {
    return {
      bgColor: 'bg-red-200 text-red-800',
      dotColor: 'bg-red-600',
      text: 'Rupture de stock'
    };
  }

  return {
    bgColor: 'bg-green-200 text-green-800',
    dotColor: 'bg-green-600',
    text: 'En stock'
  };
};

// Helper function to get the most common commodity for a stock
const getMostCommonCommodity = (stock: StockData): string => {
  if (!stock.consumables || stock.consumables.length === 0) {
    return "FERMENTATION_ADDITIVES";
  }

  // Count commodities
  const commodityCounts = stock.consumables.reduce((acc, c) => {
    acc[c.commodity] = (acc[c.commodity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Return the most common commodity
  let mostCommonCommodity = "FERMENTATION_ADDITIVES";
  let maxCount = 0;

  for (const [commodity, count] of Object.entries(commodityCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonCommodity = commodity;
    }
  }

  return mostCommonCommodity;
};

// Composant pour éditer le nom avec recherche dans les stocks
function EditableNameCell({
  value,
  onSave,
  stocks,
  onStockSelected
}: {
  value: string;
  onSave: (value: string) => void;
  stocks: StockData[];
  onStockSelected?: (stock: StockData) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleStockSelection = (stockName: string) => {
    setEditValue(stockName);
    const selectedStock = stocks.find(s => s.name === stockName);
    if (selectedStock && onStockSelected) {
      onStockSelected(selectedStock);
    }
  };

  if (!isEditing) {
    return (
      <div
        className="cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => setIsEditing(true)}
        onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
        role="button"
        tabIndex={0}
      >
        {value || <span className="text-gray-400">Click to edit</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <CreatableComboboxField
          labelsProps={{ children: "" }}
          value={editValue}
          onChange={handleStockSelection}
          options={stocks.map(s => ({ id: s.id, name: s.name }))}
          dropUp={true}
        />
      </div>
      <Button size="sm" variant="ghost" onClick={handleSave}>
        <Check className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={handleCancel}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Composant pour cellule éditable
function EditableCell({
  value,
  onSave,
  type = "text",
  options
}: {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div
        className="cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => setIsEditing(true)}
        onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
        role="button"
        tabIndex={0}
      >
        {value || <span className="text-gray-400">Click to edit</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {type === "select" && options ? (
        <Select value={editValue.toString()} onValueChange={setEditValue}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
          className="h-8 text-sm"
        />
      )}
      <Button size="icon" className="size-8" variant="ghost" onClick={handleSave}>
        <Check className="w-4 h-4" />
      </Button>
      <Button size="icon" className="size-8" variant="ghost" onClick={handleCancel}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

type ConsumablesDataTableProps = {
  consumables: Array<{
    id: string;
    name: string;
    quantity: number;
    originalQuantity: number | null;
    unit: string;
    description: string | null;
    commodity?: string;
  }>;
  stocks?: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
  editable?: boolean;
  onUpdateConsumable?: (id: string, field: string, value: string | number) => void;
  onDeleteConsumable?: (id: string) => void;
  onUpdateMultipleFields?: (id: string, updates: Record<string, string | number>) => void;
}

export const commodityOptions = [
  { value: "FERMENTATION_ADDITIVES", label: "Additifs de fermentation" },
  { value: "STABILIZATION_CLARIFICATION", label: "Stabilisation & Clarification" },
  { value: "ORGANOLEPTIC_CORRECTION", label: "Correction organoleptique" },
  { value: "ENERGY", label: "Énergie" },
  { value: "ANALYSIS_LAB", label: "Analyse & Laboratoire" },
  { value: "FILTRATION", label: "Filtration" },
  { value: "PACKAGING", label: "Conditionnement" },
];

export function ConsumablesDataTable({
  consumables,
  stocks = [],
  editable = false,
  onUpdateConsumable,
  onDeleteConsumable,
  onUpdateMultipleFields
}: ConsumablesDataTableProps) {

  const columns: ColumnDef<ConsumableData>[] = [
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
        if (editable && (onUpdateConsumable || onUpdateMultipleFields)) {
          return (
            <EditableNameCell
              value={row.getValue("name")}
              onSave={(value) => onUpdateConsumable && onUpdateConsumable(row.original.id, "name", value)}
              stocks={stocks}
              onStockSelected={(stock) => {
                if (onUpdateMultipleFields) {
                  onUpdateMultipleFields(row.original.id, {
                    name: stock.name,
                    unit: stock.unit,
                    commodity: getMostCommonCommodity(stock)
                  });
                }
              }}
            />
          );
        }
        return <div className="font-medium">{row.getValue("name")}</div>;
      },
      enableHiding: false,
    },
    {
      accessorKey: "quantity",
      header: "Quantité",
      cell: ({ row }) => {
        if (editable && onUpdateConsumable) {
          return (
            <div className="flex items-center gap-2">
              <EditableCell
                value={row.getValue("quantity")}
                onSave={(value) => onUpdateConsumable(row.original.id, "quantity", value)}
                type="number"
              />

            </div>
          );
        }
        const quantity = row.getValue("quantity") as number;
        const unit = row.original.unit;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {quantity} {unit}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "unit",
      header: "Unité",
      cell: ({ row }) => {
        if (editable && onUpdateConsumable) {
          return (
            <EditableCell
              value={row.getValue("unit")}
              onSave={(value) => onUpdateConsumable(row.original.id, "unit", value)}
            />
          );
        }
        return <div>{row.getValue("unit")}</div>;
      },
    },
    {
      accessorKey: "commodity",
      header: "Commodité",
      cell: ({ row }) => {
        if (editable && onUpdateConsumable && row.original.commodity) {
          return (
            <EditableCell
              value={row.original.commodity}
              onSave={(value) => onUpdateConsumable(row.original.id, "commodity", value)}
              type="select"
              options={commodityOptions}
            />
          );
        }
        return <div>{row.original.commodity || "—"}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        if (editable && onUpdateConsumable) {
          return (
            <EditableCell
              value={row.getValue("description") || ""}
              onSave={(value) => onUpdateConsumable(row.original.id, "description", value)}
            />
          );
        }
        const description = row.getValue("description") as string | null;
        return (
          <div className="text-gray-600 max-w-[200px] truncate">
            {description || "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="w-full text-center">Statut</div>,
      cell: ({ row }) => {
        const available = row.original.status?.available;
        const missing = row.original.status?.missing;
        const config = getStatusConfig(missing || 0);
        return (
          <div className="flex items-center justify-end">
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
            {editable && onDeleteConsumable && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDeleteConsumable(row.original.id)}
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
      <div className="text-center py-8 text-gray-500">
        Aucun consommable défini
      </div>
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
