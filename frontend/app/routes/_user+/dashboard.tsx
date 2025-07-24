import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Droplet,
  Package,
  TrendingUp,
  Wine,
  Zap
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { requireUser } from "../../server/auth.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  const [
    actions,
    processes,
    batches,
    stocks,
    // actionsStats,

  ] = await Promise.all([
    // Actions récentes
    context.remixService.prisma.action.findMany({
      where: { userId: user.id },
      include: {
        consumables: true,
        type: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),


    // Cuves récentes
    context.remixService.prisma.batch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // Stocks critiques
    context.remixService.prisma.stock.findMany({
      where: {
        userId: user.id,
        OR: [
          { isOutOfStock: true },
          { quantity: { lte: 10 } }
        ]
      },
      orderBy: { quantity: 'asc' },
      take: 10,
    }),

    // Statistiques des actions
    // context.remixService.prisma.action.groupBy({
    //   by: ['typeId'],
    //   where: { userId: user.id },
    //   _count: {
    //     id: true,
    //   },
    // }),

    // Statistiques des stocks
    // context.remixService.prisma.stock.aggregate({
    //   where: { userId: user.id },
    //   _count: {
    //     id: true,
    //   },
    //   _sum: {
    //     quantity: true,
    //   },
    // }),
  ]);

  // Calculs des métriques
  // const totalActions = actionsStats._count.id || 0;
  // const pendingActions = actionsStats.find(s => s.typeId === 'PENDING')?._count.id || 0;
  // const waitingStockActions = actionsStats.find(s => s.typeId === 'WAITING_STOCK')?._count.id || 0;
  // const completedActions = actionsStats.find(s => s.typeId === 'COMPLETED')?._count.id || 0;

  // const criticalStocks = stocks.filter(s => s.isOutOfStock).length;
  // const lowStocks = stocks.filter(s => !s.isOutOfStock && s.quantity <= 10).length;

  return {
    user,
    actions,
    processes,
    batches,
    stocks,
    // metrics: {
    //   totalActions,
    //   pendingActions,
    //   waitingStockActions,
    //   completedActions,
    //   totalStocks: stocksStats._count.id || 0,
    //   totalStockValue: stocksStats._sum.quantity || 0,
    //   criticalStocks,
    //   lowStocks,
    //   activeProcesses: processes.length,
    //   totalBatches: batches.length,
    // }
  };
};

type DashboardData = Awaited<ReturnType<typeof loader>>;

export default function Dashboard() {
  // const { user, actions, processes, batches, stocks, metrics } = useLoaderData<DashboardData>();
  const { user, actions, processes, batches } = useLoaderData<DashboardData>();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>;
      case 'WAITING_STOCK':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Attente stock</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Terminé</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En cours</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStockStatus = (stock: typeof stocks[0]) => {
    if (stock.isOutOfStock) {
      return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, label: 'Rupture' };
    }
    if (stock.quantity <= 10) {
      return { color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle, label: 'Faible' };
    }
    return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'OK' };
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Bonjour {user.name}, voici un aperçu de votre production
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions totales</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {/* <div className="text-2xl font-bold">{metrics.totalActions}</div> */}
              {/* <p className="text-xs text-muted-foreground">
                {metrics.pendingActions} en attente
              </p> */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processus actifs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {/* <div className="text-2xl font-bold">{metrics.activeProcesses}</div> */}
              <p className="text-xs text-muted-foreground">
                En cours de production
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stocks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {/* <div className="text-2xl font-bold">{metrics.totalStocks}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.criticalStocks} en rupture
              </p> */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuves</CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {/* <div className="text-2xl font-bold">{metrics.totalBatches}</div> */}
              <p className="text-xs text-muted-foreground">
                Volume total traité
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {
        // (metrics.criticalStocks > 0 || metrics.waitingStockActions > 0) && (
        //   <Card className="border-red-200 bg-red-50">
        //     <CardHeader>
        //       <CardTitle className="text-red-800 flex items-center gap-2">
        //         <AlertTriangle className="h-5 w-5" />
        //         Alertes importantes
        //       </CardTitle>
        //     </CardHeader>
        //     <CardContent className="space-y-2">
        //       {metrics.criticalStocks > 0 && (
        //         <div className="flex items-center justify-between p-3 bg-white rounded-md border border-red-200">
        //           <div className="flex items-center gap-2">
        //             <Package className="h-4 w-4 text-red-600" />
        //             <span className="text-red-800">
        //               {metrics.criticalStocks} stock(s) en rupture
        //             </span>
        //           </div>
        //           <Button variant="outline" size="sm" className="text-red-700 border-red-300">
        //             Voir les stocks
        //           </Button>
        //         </div>
        //       )}
        //       {metrics.waitingStockActions > 0 && (
        //         <div className="flex items-center justify-between p-3 bg-white rounded-md border border-red-200">
        //           <div className="flex items-center gap-2">
        //             <Clock className="h-4 w-4 text-red-600" />
        //             <span className="text-red-800">
        //               {metrics.waitingStockActions} action(s) en attente de stock
        //             </span>
        //           </div>
        //           <Button variant="outline" size="sm" className="text-red-700 border-red-300">
        //             Voir les actions
        //           </Button>
        //         </div>
        //       )}
        //     </CardContent>
        //   </Card>
        // )
      }

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Actions récentes
            </CardTitle>
            <CardDescription>
              Dernières actions créées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Aucune action créée</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{action.type.name}</p>
                      <p className="text-sm text-gray-600">
                        {action.consumables.length} consommable(s) • {action.duration}j
                      </p>
                    </div>
                    {getStatusBadge(action.type.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processus actifs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Processus en cours
            </CardTitle>
            <CardDescription>
              Processus nécessitant une attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Aucun processus actif</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                  {/* {processes.map((process) => {
                  const daysSinceStart = Math.ceil((new Date().getTime() - new Date(process.startDate || new Date()).getTime()) / (1000 * 60 * 60 * 24));
                  const progress = Math.min(100, (daysSinceStart / 30) * 100);

                  return (
                    <div key={process.id} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{process.name}</p>
                        <span className="text-sm text-gray-600">
                          {daysSinceStart >= 0 ? `${daysSinceStart}j depuis début` : 'Pas commencé'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Wine className="h-4 w-4" />
                        <span>{process.batch?.name || 'Aucune cuvée'}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })} */}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stocks critiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stocks critiques
            </CardTitle>
            <CardDescription>
              Stocks nécessitant un réapprovisionnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* {stocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto h-12 w-12 text-green-300 mb-4" />
                <p>Tous les stocks sont OK</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                  {/* {stocks.map((stock) => {
                  const status = getStockStatus(stock);
                  const StatusIcon = status.icon;

                  return (
                    <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${status.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{stock.name}</p>
                          <p className="text-sm text-gray-600">
                            {stock.quantity} {stock.unit}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                  );
                })} */}
            {/* </div> */}
            {/* )} */}
          </CardContent>
        </Card>

        {/* Cuves récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5" />
              Cuves récentes
            </CardTitle>
            <CardDescription>
              Dernières cuves créées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wine className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Aucune cuvée créée</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {batches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-50">
                        <Droplet className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{batch.name}</p>
                        <p className="text-sm text-gray-600">
                          {batch.quantity ? `${batch.quantity}L` : 'Volume non défini'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(batch.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Actions rapides
          </CardTitle>
          <CardDescription>
            Raccourcis vers les tâches courantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Zap className="h-6 w-6" />
              <span className="text-sm">Nouvelle action</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Nouveau processus</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Package className="h-6 w-6" />
              <span className="text-sm">Gérer les stocks</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Wine className="h-6 w-6" />
              <span className="text-sm">Nouvelle cuvée</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
