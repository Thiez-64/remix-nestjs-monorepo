import { useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { AlertTriangle, Database, Droplet, Plus, Wine } from "lucide-react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { requireUser } from "~/server/auth.server";
import { createTank, getTanks } from "~/server/mycellar.server";

import { columnsMyCellar } from "~/components/ColumnsMyCellar";
import { CreateTankDialog } from "~/components/CreateTankDialog";
import { DataTable } from "~/components/ui/data-table";

export type Tank = {
  id: string;
  name: string;
  description?: string;
  material: "INOX" | "BETON" | "BOIS" | "PLASTIQUE";
  capacity: number;
  currentWine: number;
  wineType?: "ROUGE" | "BLANC" | "ROSE";
  status: "EMPTY" | "IN_USE" | "MAINTENANCE";
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const TankSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  capacity: z.coerce.number().min(1, "La capacité est obligatoire"),
  material: z.enum(["INOX", "BETON", "BOIS", "PLASTIQUE"]),
});

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  const tanks = await getTanks(context.remixService, user.id);
  return { user, tanks };
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    async: true,
    schema: TankSchema.superRefine(async (data, ctx) => {
      const existingTank = await context.remixService.prisma.tank.findFirst({
        where: { name: data.name, userId: user.id },
      });

      if (existingTank) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Un tank avec ce nom existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  await createTank(context.remixService, user.id, submission.value);

  return { result: submission.reply() };
};

export default function MyCellar() {
  const { tanks } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    id: "create-tank",
    constraint: getZodConstraint(TankSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TankSchema });
    },
    lastResult: actionData?.result,
  });

  const totalCapacity = tanks.reduce((acc, tank) => acc + tank.capacity, 0);
  const totalWine = tanks.reduce((acc, tank) => acc + tank.currentWine, 0);
  const fillRate = (totalWine / totalCapacity) * 100;
  const availableTanks = tanks.filter((tank) => tank.currentWine === 0).length;
  const fullTanks = tanks.filter(
    (tank) => tank.currentWine === tank.capacity
  ).length;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ma Cave</h1>
        <CreateTankDialog form={form} fields={fields}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une cuve
          </Button>
        </CreateTankDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Taux de remplissage</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isNaN(fillRate) ? "0" : fillRate.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {totalWine}L / {totalCapacity}L
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Cuves disponibles</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{availableTanks}</p>
          <p className="text-sm text-muted-foreground">
            sur {tanks.length} cuves
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Cuves pleines</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{fullTanks}</p>
          <p className="text-sm text-muted-foreground">
            {((fullTanks / tanks.length) * 100).toFixed(1)}% des cuves
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center gap-2">
            <Wine className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Capacité totale</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{totalCapacity} L</p>
          <p className="text-sm text-muted-foreground">{tanks.length} cuves</p>
        </div>
      </div>

      <DataTable columns={columnsMyCellar} data={tanks} />
    </div>
  );
}
