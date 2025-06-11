import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Database, Grape, Plus, Settings, Wine } from "lucide-react";
import { useState } from "react";
import { Field } from "../../components/forms";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { requireUser } from "../../server/auth.server";
import { CreateMyCellarBatchDialog } from "./my-cellar.$tankId.batch";
import { EditTankDialog } from "./my-cellar.$tankId.edit";
import { TankSchema } from "./my-cellar.schema";



export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  const [tanks, batches] = await Promise.all([
    context.remixService.prisma.tank.findMany({
      where: { userId: user.id },
      include: {
        batch: {
          include: {
            process: true
          }
        }
      },
      orderBy: { name: 'asc' },
    }),
    context.remixService.prisma.batch.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })
  ]);

  // Calculer le volume total alloué pour chaque batch
  const batchAllocations = new Map<string, number>();

  tanks.forEach(tank => {
    if (tank.batchId && tank.allocatedVolume > 0) {
      const currentAllocation = batchAllocations.get(tank.batchId) || 0;
      batchAllocations.set(tank.batchId, currentAllocation + tank.allocatedVolume);
    }
  });

  // Enrichir les batches avec leurs informations d'allocation
  const batchesWithAllocation = batches.map(batch => ({
    ...batch,
    totalAllocated: batchAllocations.get(batch.id) || 0,
    remainingVolume: batch.quantity - (batchAllocations.get(batch.id) || 0),
    isFullyAllocated: (batchAllocations.get(batch.id) || 0) >= batch.quantity,
  }));

  return { tanks, batches: batchesWithAllocation };
};

export type MyCellarLoaderData = Awaited<ReturnType<typeof loader>>;

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

  await context.remixService.prisma.tank.create({
    data: {
      ...submission.value,
      userId: user.id,
      status: "EMPTY",
    },
  });

  return { result: submission.reply() };
};

const materialLabels = {
  INOX: "Inox",
  BETON: "Béton",
  BOIS: "Bois",
  PLASTIQUE: "Plastique",
};
const materialColors = {
  INOX: "bg-gray-200 text-gray-800",
  BETON: "bg-neutral-400 text-neutral-800",
  BOIS: "bg-yellow-200 text-yellow-800",
  PLASTIQUE: "bg-blue-200 text-blue-800",
};

const statusLabels = {
  EMPTY: "Vide",
  IN_USE: "En cours d'utilisation",
  MAINTENANCE: "En maintenance",
};

const statusColors = {
  EMPTY: "bg-gray-200 text-gray-800",
  IN_USE: "bg-green-200 text-green-800",
  MAINTENANCE: "bg-orange-200 text-orange-800",
};

export default function MyCellar() {
  const { tanks, batches } = useLoaderData<MyCellarLoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);
  const [form, fields] = useForm({
    id: "create-tank",
    constraint: getZodConstraint(TankSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TankSchema });
    },
    lastResult: actionData?.result,
    defaultValue: {
      name: "",
      description: "",
      capacity: 0,
      material: "INOX",
      status: "EMPTY",
    },
  });

  const totalCapacity = tanks.reduce((acc, tank) => acc + tank.capacity, 0);
  const totalWine = tanks.reduce((acc, tank) => acc + tank.allocatedVolume, 0);
  const fillRate = totalCapacity > 0 ? (totalWine / totalCapacity) * 100 : 0;
  const availableTanks = tanks.filter((tank) => tank.allocatedVolume === 0).length;
  const fullTanks = tanks.filter(
    (tank) => tank.allocatedVolume === tank.capacity
  ).length;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mon Chai</h1>
          <p className="text-gray-600">
            Créez et gérez vos cuves spécifiques (ex: &quot;Cuve 1&quot;, &quot;Cuve 2&quot;)
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Cuve
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle cuve</DialogTitle>
            </DialogHeader>

            <Form {...getFormProps(form)} method="POST" className="space-y-4">
              <Field
                inputProps={getInputProps(fields.name, { type: "text" })}
                labelsProps={{ children: "Nom de la cuve (ex: Cuve 1)" }}
                errors={fields.name.errors}
              />

              <Field
                inputProps={getInputProps(fields.description, { type: "text" })}
                labelsProps={{ children: "Description (optionnel)" }}
                errors={fields.description.errors}
              />

              <Field
                inputProps={getInputProps(fields.capacity, { type: "number", step: "0.1" })}
                labelsProps={{ children: "Capacité (L)" }}
                errors={fields.capacity.errors}
              />

              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <div className="w-1/2 flex flex-col gap-2">
                    <Label className="text-sm font-medium">Matériau</Label>
                    <Select name={fields.material.name} defaultValue={fields.material.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un matériau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INOX">Inox</SelectItem>
                        <SelectItem value="BETON">Béton</SelectItem>
                        <SelectItem value="BOIS">Bois</SelectItem>
                        <SelectItem value="PLASTIQUE">Plastique</SelectItem>
                      </SelectContent>
                    </Select>
                    {fields.material.errors && (
                      <p className="text-sm text-destructive">{fields.material.errors}</p>
                    )}
                  </div>
                  <div className="w-1/2 flex flex-col gap-2">
                    <Label className="text-sm font-medium">Statut</Label>
                    <Select name={fields.status.name} defaultValue={fields.status.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPTY">Vide</SelectItem>
                        <SelectItem value="IN_USE">En cours d&apos;utilisation</SelectItem>
                        <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    {fields.status.errors && (
                      <p className="text-sm text-destructive">{fields.status.errors}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Création..." : "Créer la cuve"}
                </Button>
              </div>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {tanks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Capacité totale</p>
                  <p className="text-2xl font-bold">{totalCapacity.toLocaleString()}L</p>
                </div>
                <Wine className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vin stocké</p>
                  <p className="text-2xl font-bold">{totalWine.toLocaleString()}L</p>
                </div>
                <Grape className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de remplissage</p>
                  <p className="text-2xl font-bold">{fillRate.toFixed(1)}%</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-green-600"></div>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(fillRate, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cuves disponibles</p>
                  <p className="text-2xl font-bold">{availableTanks}/{tanks.length}</p>
                </div>
                <Settings className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {fullTanks} cuves pleines
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        {tanks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune cuve</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer votre première cuve spécifique
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          tanks.map((tank) => (
            <Card key={tank.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{tank.name}</CardTitle>
                      <Badge variant="secondary" className={statusColors[tank.status]}>
                        {statusLabels[tank.status]}
                      </Badge>
                      <Badge variant="secondary" className={materialColors[tank.material]}>
                        {materialLabels[tank.material]}
                      </Badge>
                    </div>
                    {tank.description && (
                      <CardDescription>{tank.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {/* eslint-disable @typescript-eslint/no-explicit-any */}
                    <CreateMyCellarBatchDialog tank={tank as any} batches={batches as any} />
                    <EditTankDialog tank={tank as any} />
                    {/* eslint-disable @typescript-eslint/no-explicit-any */}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row items-center justify-between text-sm text-gray-600">
                  <div className="flex flex-row gap-2 items-center">
                    <p className=" font-bold">Capacité :</p>
                    <p>{tank.capacity}L</p>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <p className=" font-bold">Contenu actuel :</p>
                    <p>{tank.allocatedVolume ?? 0}L</p>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <p className=" font-bold">Processus :</p>
                    <p>{tank.batch?.process ? tank.batch.process.name : "Aucun"}</p>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <p className=" font-bold">Cuvée :</p>
                    <p>{tank.batch ? tank.batch.name : "Aucune"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
