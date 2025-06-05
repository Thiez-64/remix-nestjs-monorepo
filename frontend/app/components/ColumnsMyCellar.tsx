import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ActionTankForm from "~/routes/_user+/my-cellar.$tankId.action";
import DeleteTankForm from "~/routes/_user+/my-cellar.$tankId.delete";
import EditTankForm from "~/routes/_user+/my-cellar.$tankId.edit";

export type Tank = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  currentWine: number;
  wineType: "ROSE" | "ROUGE" | "BLANC" | null;
  material: "INOX" | "BETON" | "BOIS" | "PLASTIQUE";
  status: "EMPTY" | "IN_USE" | "MAINTENANCE";
  actions: {
    id: string;
    type:
      | "RECEPTIONNER_MOUT"
      | "RECEPTIONNER_VIN"
      | "FERMENTATION_ALCOOLIQUE"
      | "FERMENTATION_MALO_LACTIQUE"
      | "SOUTIRER"
      | "OUILLER"
      | "CLARIFIER"
      | "STABILISER"
      | "AJUSTER"
      | "MELANGER"
      | "ANALYSER"
      | "DEGUSTER"
      | "TRANSFERER"
      | "VIDER"
      | "ASSEMBLER"
      | "FILTRER"
      | "METTRE_EN_BOUTEILLE"
      | "METTRE_EN_BIB"
      | "NETTOYER"
      | "DESINFECTER"
      | "MAINTENANCE"
      | "INVENTORIER";
    description: string;
    startDate: Date | null;
    endDate: Date | null;
  }[];
};

export const columnsMyCellar = [
  {
    accessorKey: "name",
    header: "Nom",
  },
  {
    accessorKey: "capacity",
    header: "Capacité (L)",
  },
  {
    accessorKey: "currentWine",
    header: "Contenance (L)",
  },
  {
    accessorKey: "wineType",
    header: "Type de vin",
  },
  {
    accessorKey: "status",
    header: "Statut",
  },
  {
    accessorKey: "actions",
    header: "Dernière action",
    cell: ({ row }) => {
      const actions = row.original.actions;

      if (!Array.isArray(actions) || actions.length === 0) return "-";

      const lastAction = actions[0];

      if (!lastAction?.startDate) return `${lastAction.type} - date manquante`;

      const date = new Date(lastAction.startDate);
      if (isNaN(date.getTime())) return `${lastAction.type} - date invalide`;

      return `${lastAction.type} - ${format(date, "dd/MM/yyyy", { locale: fr })}`;
    },
  },
  {
    id: "rowActions",
    cell: ({ row }) => {
      const tank = row.original;

      return (
        <div className="flex items-center justify-end">
          <TankDialog tank={tank}>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </TankDialog>
        </div>
      );
    },
  },
];

export const TankDialog = ({
  tank,
  children,
}: {
  tank: Tank;
  children: React.ReactNode;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion de {tank.name}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="action">Action</TabsTrigger>
            <TabsTrigger value="edit">Modifier</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Détails de la cuve</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p>{tank.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacité</p>
                  <p>{tank.capacity}L</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contenance</p>
                  <p>{tank.currentWine}L</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type de vin</p>
                  <p>{tank.wineType || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Matériau</p>
                  <p>{tank.material}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p>{tank.status}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Historique des actions</h3>
              <div className="space-y-2">
                {tank.actions?.map((action) => (
                  <div key={action.id} className="flex items-center gap-2">
                    <p className="text-sm">{action.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {action.startDate &&
                        format(new Date(action.startDate), "dd/MM/yyyy", {
                          locale: fr,
                        })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="action">
            <div className="space-y-6">
              <ActionTankForm tank={tank} />
            </div>
          </TabsContent>
          <TabsContent value="edit">
            <div className="space-y-4">
              <EditTankForm tank={tank} />
              <DeleteTankForm tank={tank} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
