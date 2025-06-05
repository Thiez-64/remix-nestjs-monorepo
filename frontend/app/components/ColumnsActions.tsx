import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import EditActionForm from "~/routes/_user+/actions.$actionId.edit";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export type Action = {
  id: string;
  type: string;
  description: string;
  estimatedDuration: number;
  wineType: "ROUGE" | "BLANC" | "ROSE";
  needsPurchase: boolean;
  consumables: {
    name: string;
    quantity: number;
    unit: string;
    description?: string;
  }[];
};

export const columnsActions: ColumnDef<Action>[] = [
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "estimatedDuration",
    header: "Durée estimée (jours)",
  },
  {
    id: "consumables",
    header: "Nombre de consommables",
    cell: ({ row }) => row.original.consumables.length,
  },
  {
    id: "rowActions",
    cell: ({ row }) => {
      const action = row.original;

      return (
        <div className="flex items-center justify-end">
          <ActionDialog action={action}>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </ActionDialog>
        </div>
      );
    },
  },
];

export const ActionDialog = ({
  action,
  children,
}: {
  action: Action;
  children: React.ReactNode;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion de {action.type}</DialogTitle>
        </DialogHeader>
        <EditActionForm actionJob={action} />
      </DialogContent>
    </Dialog>
  );
};
