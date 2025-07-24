import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { AlertTriangle, Package } from "lucide-react";
import { EmptyState } from "../../components/empty-state";
import { PageLayout } from "../../components/page-layout";
import { StocksDataTable } from "../../components/stocks-data-table";
import { StockSchema } from "../../lib/schemas";
import { requireUser } from "../../server/auth.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  const stocks = await context.remixService.prisma.stock.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  });

  return { stocks, user };
};

export type StockLoaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const stockId = formData.get("stockId");
    if (!stockId) {
      throw new Error("Stock ID is required");
    }

    await context.remixService.prisma.stock.delete({
      where: { id: stockId as string, userId: user.id },
    });

    return new Response(null, { status: 200 });
  }

  // Création d'un nouveau stock uniquement
  const submission = await parseWithZod(formData, {
    async: true,
    schema: StockSchema.superRefine(async (data, ctx) => {
      const existingStock = await context.remixService.prisma.stock.findFirst({
        where: {
          name: data.name,
          unit: data.unit,
          userId: user.id
        },
      });

      if (existingStock) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Un stock avec ce nom et cette unité existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  await context.remixService.prisma.stock.create({
    data: {
      name: submission.value.name,
      unit: submission.value.unit,
      quantity: submission.value.quantity,
      minimumQty: submission.value.minimumQty || 0,
      userId: user.id,
    },
  });

  return { result: submission.reply() };
};

export default function Stock() {
  const { stocks } = useLoaderData<StockLoaderData>();

  // Calculer les stocks en alerte
  const lowStockItems = stocks.filter(stock => stock.quantity <= stock.minimumQty);

  return (
    <PageLayout
      title="Gestion des Stocks"
      description="Gérez vos stocks de consommables et produits"
      alertMessage={lowStockItems.length > 0 ? {
        message: `${lowStockItems.length} produit(s) en stock faible`,
        icon: <AlertTriangle className="w-4 h-4" />,
        variant: "warning"
      } : undefined}
    >
      <div className="space-y-4">
        {stocks.length === 0 ? (
          <EmptyState
            icon={<Package className="mx-auto h-12 w-12" />}
            title="Aucun stock"
            description="Commencez par ajouter vos premiers produits en stock"
          />
        ) : (
          <StocksDataTable stocks={stocks as unknown as StockLoaderData['stocks']} />
        )}
      </div>
    </PageLayout>
  );
} 
