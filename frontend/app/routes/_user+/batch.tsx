import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Hourglass, Plus, Square, SquareCheck, Wine } from "lucide-react";
import { useState } from "react";
import { Field } from "../../components/forms";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { EditBatchDialog } from "./batch.$batchId.edit";
import { CreateBatchProcessDialog } from "./batch.$batchId.process";
import { BatchSchema } from "./batch.schema";



export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  const [batches, assignedProcessIds, tanks] = await Promise.all([
    context.remixService.prisma.batch.findMany({
      where: { userId: user.id },
    }),
    context.remixService.prisma.batch.findMany({
      where: {
        processId: { not: null },
        userId: user.id
      },
      select: { processId: true }
    }),
    // Récupérer les tanks pour calculer les allocations
    context.remixService.prisma.tank.findMany({
      where: { userId: user.id },
      select: { batchId: true, allocatedVolume: true }
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
    allocationPercentage: Math.round(((batchAllocations.get(batch.id) || 0) / batch.quantity) * 100),
    isFullyAllocated: (batchAllocations.get(batch.id) || 0) >= batch.quantity,
  }));

  // Récupérer seulement les processus non assignés
  const excludedIds = assignedProcessIds.map(b => b.processId).filter(Boolean) as string[];

  const [processesExcludedIds, processes] = await Promise.all([
    context.remixService.prisma.process.findMany({
      where: {
        userId: user.id,
        id: {
          notIn: excludedIds
        }
      },
    }),
    context.remixService.prisma.process.findMany({
      where: {
        userId: user.id,
      },
    })]);

  return { batches: batchesWithAllocation, processesExcludedIds, processes };
};

export type BatchLoaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Suppression d'un processus
  if (intent === "delete") {
    const batchId = formData.get("batchId");
    if (!batchId) {
      throw new Error("Batch ID is required");
    }

    await context.remixService.prisma.batch.delete({
      where: { id: batchId.toString(), userId: user.id },
    });

    return new Response(null, { status: 200 });
  }

  // Création d'un processus
  const submission = await parseWithZod(formData, {
    async: true,
    schema: BatchSchema.superRefine(async (data, ctx) => {
      const existingBatch = await context.remixService.prisma.batch.findFirst({
        where: { name: data.name, userId: user.id },
      });

      if (existingBatch) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Un batch avec ce nom existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  await context.remixService.prisma.batch.create({
    data: {
      name: submission.value.name,
      description: submission.value.description,
      quantity: submission.value.quantity,
      userId: user.id,
    },
  });

  return { result: submission.reply() };
};

export default function Batch() {
  const { batches, processesExcludedIds, processes } = useLoaderData<BatchLoaderData>();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);

  const [form, fields] = useForm({
    id: "create-batch",
    constraint: getZodConstraint(BatchSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: BatchSchema });
    },
    lastResult: actionData?.result,
    onSubmit() {
      setOpen(false);
    },
    defaultValue: {
      name: "",
      description: "",
      quantity: 0
    },
  });

  console.log('fields.name', fields.name)
  return <div className="container mx-auto py-10">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Cuvée de Vinification</h1>
        <p className="text-gray-600">
          Créez et gérez vos cuvée de vinification
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Cuvée
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle cuvée</DialogTitle>
          </DialogHeader>

          <Form {...getFormProps(form)} method="POST" className="space-y-4">
            <Field
              inputProps={getInputProps(fields.name, { type: "text" })}
              labelsProps={{ children: "Nom de la cuvée (ex: Cuvée Chateau)" }}
              errors={fields.name.errors}
            />

            <Field
              inputProps={getInputProps(fields.description, { type: "text" })}
              labelsProps={{ children: "Description (optionnel)" }}
              errors={fields.description.errors}
            />

            <Field
              inputProps={getInputProps(fields.quantity, { type: "number" })}
              labelsProps={{ children: "Quantité (en litres)" }}
              errors={fields.quantity.errors}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer la cuvée"}
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>

    <div className="grid gap-4">
      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Wine className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune cuvée</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par créer votre première cuvée de vinification
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        batches.map((batch) => (
          <Card key={batch.id} className={`${batch.isFullyAllocated
            ? 'border-green-300 bg-green-50'
            : batch.totalAllocated > 0
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-300'
            }`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{batch.name}</CardTitle>
                    <Badge variant="secondary" className={batch.isFullyAllocated
                      ? 'bg-green-200 text-green-800'
                      : batch.totalAllocated > 0
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-800'
                    }>{batch.allocationPercentage}% en cuve</Badge>

                  </div>
                  {batch.description && (
                    <CardDescription>{batch.description}</CardDescription>
                  )}
                </div>
                <div className="flex space-x-2">
                  {/* eslint-disable @typescript-eslint/no-explicit-any */}
                  <CreateBatchProcessDialog
                    batch={batch as any}
                    processes={processes as any}
                    processesExcludedIds={processesExcludedIds as any}
                  />
                  <EditBatchDialog batch={batch as any} />
                  {/* eslint-enable @typescript-eslint/no-explicit-any */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 flex flex-row gap-2 items-center">
                  <p className="font-bold">Quantité totale :</p>
                  <p> {batch.quantity} litres</p>
                  {batch.totalAllocated > 0 && (
                    <>
                      <p className="font-bold">Volume en cuve :</p>
                      <p> {batch.totalAllocated}L</p>
                      <p className="font-bold">Volume restant :</p>
                      <p> {batch.remainingVolume}L</p>
                    </>
                  )}
                </div>

                {/* Barre de progression */}
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Mise en cuve</span>
                    <span>{batch.totalAllocated}L / {batch.quantity}L</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${batch.isFullyAllocated ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                      style={{ width: `${batch.allocationPercentage}%` }}
                    ></div>
                  </div>

                  {/* Status */}
                  <div className="mt-2">
                    {batch.isFullyAllocated ? (
                      <div className="flex items-center gap-2">
                        <SquareCheck className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">
                          Entièrement mise en cuve
                        </p>
                      </div>
                    ) : batch.totalAllocated > 0 ? (
                      <div className="flex items-center gap-2">
                        <Square className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">
                          Partiellement mise en cuve
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Hourglass className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500">
                          En attente de mise en cuve
                        </p>
                      </div>

                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  </div>;
}
