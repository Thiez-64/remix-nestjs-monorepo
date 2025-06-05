import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tank } from "./ColumnsMyCellar";
import { SelectScrollable } from "./SelectScrollable";

interface DataTableProps<TValue> {
  columns: ColumnDef<Tank, TValue>[];
  data: Tank[];
}

export function DataTable<TValue>({ columns, data }: DataTableProps<TValue>) {
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRowClick = (tank: Tank) => {
    console.log("Row clicked:", tank);
    setSelectedTank(tank);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    handleRowClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} sur{" "}
          {table.getPageCount()}
        </div>
      </div>
      {selectedTank && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gestion de la cuve {selectedTank.name}</DialogTitle>
              <DialogDescription>
                Modifiez les informations de la cuve ou ajoutez une action.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Ajouter du vin</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="wineType" className="text-sm font-medium">
                      Type de vin
                    </label>
                    <Select
                      name="wineType"
                      defaultValue={selectedTank.wineType || undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROSE">Rosé</SelectItem>
                        <SelectItem value="ROUGE">Rouge</SelectItem>
                        <SelectItem value="BLANC">Blanc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="wineAmount" className="text-sm font-medium">
                      Quantité (L)
                    </label>
                    <input
                      id="wineAmount"
                      name="wineAmount"
                      type="number"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Changer le statut</h3>
                <Select name="status" defaultValue={selectedTank.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPTY">Vide</SelectItem>
                    <SelectItem value="IN_USE">En utilisation</SelectItem>
                    <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Ajouter une action</h3>
                <SelectScrollable name="actionType" />
                <div className="space-y-2">
                  <label
                    htmlFor="actionDescription"
                    className="text-sm font-medium"
                  >
                    Description
                  </label>
                  <textarea
                    id="actionDescription"
                    name="actionDescription"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit" variant="default">
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
