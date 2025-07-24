import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Database, Grape, Plus, RefreshCcw, Settings, Wine } from "lucide-react";
import { useState } from "react";
import { CardBarreCuve } from "../../components/card-barre-cuve";
import { CardComposition } from "../../components/card-composition";
import { CardDensity } from "../../components/card-density";
import { CardPh } from "../../components/card-ph";
import { CardTemperature } from "../../components/card-temperature";
import { CreateDialog } from "../../components/create-dialog";
import { EmptyState } from "../../components/empty-state";
import { Field, SelectField } from "../../components/forms";
import { PageLayout } from "../../components/page-layout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent
} from "../../components/ui/card";
import { ActionSchema, TankSchema, TransferSchema } from "../../lib/schemas";
import { TankMaterial, TankStatus, type GrapeVarietyType } from "../../lib/types";
import {
  getTankContentVolume,
  materialVariety,
  tankMaterialColors,
  tankMaterialLabels,
  tankStateVariety,
  tankStatusColors,
  tankStatusLabels
} from "../../lib/utils";
import { requireUser } from "../../server/auth.server";
import { ActionPlan } from "./my-cellar.$tankId.actionConsumable";
import { ActionTankDialog } from "./my-cellar.$tankId.actionTank";
import { AddPlotDialog } from "./my-cellar.$tankId.addPlot";
import { EditTankDialog } from "./my-cellar.$tankId.edit";
import { RemoveWineDialog } from "./my-cellar.$tankId.removeWine";


export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });

  const [tanks, plots, batches, actionTypes, stocks] = await Promise.all([
    context.remixService.prisma.tank.findMany({
      where: { userId: user.id },
      include: {
        plotTanks: {
          include: {
            plot: true
          }
        },
        grapeComposition: true,
        actions: {
          include: {
            type: true,
            consumables: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        batches: true
      },
      orderBy: { name: 'asc' },
    }),
    context.remixService.prisma.plot.findMany({
      where: { userId: user.id },
      include: {
        plotTanks: true
      },
      orderBy: { name: 'asc' },
    }),
    context.remixService.prisma.batch.findMany({
      where: { userId: user.id },
      include: {
        products: true
      },
    }),
    context.remixService.prisma.actionType.findMany({
      orderBy: { name: 'asc' },
    }),
    context.remixService.prisma.stock.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { tanks, plots, batches, actionTypes, stocks };
};

export type MyCellarLoaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const intent = formData.get("intent");
  // Création d'une instance d'action pour une cuve
  if (intent === "create-action") {
    const submission = await parseWithZod(formData, {
      async: true,
      schema: ActionSchema,
    });

    if (submission.status !== "success") {
      return { result: submission.reply() };
    }

    const newAction = await context.remixService.prisma.action.create({
      data: {
        tankId: submission.value.tankId,
        typeId: submission.value.typeId,
        userId: user.id,
        duration: submission.value.duration,
        needsPurchase: false, // Sera calculé plus tard selon les consommables
        isCompleted: false,
      },
    });

    return { result: submission.reply(), actionId: newAction.id };
  }

  if (intent === "transfer-tank") {
    // --- VALIDATION ---
    // On valide d'abord le formulaire avec superRefine (vérifie source ≠ cible, volume dispo, place dispo)
    const submission = await parseWithZod(formData, {
      async: true,
      schema: TransferSchema.superRefine(async (data, ctx) => {
        // 1. Source et cible doivent être différentes
        if (data.sourceTank === data.targetTank) {
          ctx.addIssue({
            code: "custom",
            path: ["targetTank"],
            message: "La cuve source et la cuve cible doivent être différentes",
          });
        }
        // 2. On récupère les deux cuves avec leur composition
        const [source, target] = await Promise.all([
          context.remixService.prisma.tank.findUnique({
            where: { id: data.sourceTank },
            include: { grapeComposition: true },
          }),
          context.remixService.prisma.tank.findUnique({
            where: { id: data.targetTank },
            include: { grapeComposition: true },
          }),
        ]);
        // 3. Vérifie que les deux cuves existent
        if (!source) {
          ctx.addIssue({
            code: "custom",
            path: ["sourceTank"],
            message: "Cuve source introuvable",
          });
        }
        if (!target) {
          ctx.addIssue({
            code: "custom",
            path: ["targetTank"],
            message: "Cuve cible introuvable",
          });
        }
        // 4. Vérifie que la source a assez de volume
        const sourceVolume = source?.grapeComposition.reduce((sum, comp) => sum + comp.volume, 0) ?? 0;

        if (data.volume > sourceVolume) {
          ctx.addIssue({
            code: "custom",
            path: ["volume"],
            message: "Pas assez de volume dans la cuve source",
          });
        }

        // 5. Vérifie que la cible a assez de place
        const targetVolume = target?.grapeComposition.reduce((sum, comp) => sum + comp.volume, 0) ?? 0;
        const targetAvailable = (target?.volume ?? 0) - targetVolume;
        if (data.volume > targetAvailable) {
          ctx.addIssue({
            code: "custom",
            path: ["volume"],
            message: "Pas assez de place dans la cuve cible",
          });
        }
      }),
    });

    if (submission.status !== "success") {
      return { result: submission.reply() };
    }

    // --- MUTATION ---
    // On applique le transfert (deleteMany + createMany sur TankGrapeComposition)
    const { sourceTank, targetTank, volume } = submission.value;
    // 1. On récupère à nouveau les deux cuves (pour avoir la composition à jour)
    const [source, target] = await Promise.all([
      context.remixService.prisma.tank.findUnique({
        where: { id: sourceTank },
        include: { grapeComposition: true },
      }),
      context.remixService.prisma.tank.findUnique({
        where: { id: targetTank },
        include: { grapeComposition: true },
      }),
    ]);
    if (!source || !target) {
      return { result: { error: "Cuve source ou cible introuvable" } };
    }
    // 2. Calcul de la répartition à transférer (par cépage)
    const sourceVolume = source.grapeComposition.reduce((sum, comp) => sum + comp.volume, 0);
    const transferRatios = source.grapeComposition.map(comp => ({
      grapeVariety: comp.grapeVariety,
      volume: (comp.volume / sourceVolume) * volume,
      addedAt: comp.addedAt,
      percentage: comp.percentage
    }));
    // 3. Mise à jour de la composition de la cuve source (on retire le volume transféré)
    const updatedSourceCompo = source.grapeComposition
      .map(comp => {
        const toRemove = transferRatios.find(r => r.grapeVariety === comp.grapeVariety)?.volume ?? 0;
        return {
          grapeVariety: comp.grapeVariety,
          volume: Math.max(comp.volume - toRemove, 0),
          addedAt: comp.addedAt,
          percentage: comp.percentage
        };
      })
      .filter(comp => comp.volume > 0);
    // 4. Mise à jour de la composition de la cuve cible (on ajoute le volume transféré)
    const targetCompoMap = new Map<string, { volume: number; addedAt: Date; percentage: number | null }>();
    for (const comp of target.grapeComposition) {
      targetCompoMap.set(comp.grapeVariety, {
        volume: comp.volume,
        addedAt: comp.addedAt,
        percentage: comp.percentage,
      });
    }
    for (const ratio of transferRatios) {
      const existing = targetCompoMap.get(ratio.grapeVariety);
      targetCompoMap.set(ratio.grapeVariety, {
        volume: (existing?.volume ?? 0) + ratio.volume,
        addedAt: ratio.addedAt,
        percentage: ratio.percentage,
      });
    }
    const updatedTargetCompo = Array.from(targetCompoMap.entries()).map(
      ([grapeVariety, { volume, addedAt, percentage }]) => ({
        grapeVariety: grapeVariety as GrapeVarietyType,
        volume,
        addedAt,
        percentage,
      })
    );
    // 5. Transaction Prisma :
    //    - On supprime toute la composition de la source puis on recrée la nouvelle
    //    - On supprime toute la composition de la cible puis on recrée la nouvelle
    await context.remixService.prisma.$transaction([
      context.remixService.prisma.grapeComposition.deleteMany({
        where: { tankId: source.id },
      }),
      ...(updatedSourceCompo.length > 0
        ? [context.remixService.prisma.grapeComposition.createMany({
          data: updatedSourceCompo.map(comp => ({
            tankId: source.id,
            grapeVariety: comp.grapeVariety, // cast pour Prisma (enum)
            volume: comp.volume,
            addedAt: comp.addedAt,
            percentage: comp.percentage
          })),
        })]
        : []),
      context.remixService.prisma.grapeComposition.deleteMany({
        where: { tankId: target.id },
      }),
      ...(updatedTargetCompo.length > 0
        ? [context.remixService.prisma.grapeComposition.createMany({
          data: updatedTargetCompo.map(comp => ({
            tankId: target.id,
            grapeVariety: comp.grapeVariety as any,
            volume: comp.volume,
            addedAt: comp.addedAt,
            percentage: comp.percentage,
          })),
        })]
        : []),
    ]);

    // --- Mettre à jour le statut des cuves si besoin ---
    // Si la cuve source est vide après transfert, passe à EMPTY
    if (updatedSourceCompo.length === 0 && source.status !== 'EMPTY') {
      await context.remixService.prisma.tank.update({
        where: { id: source.id },
        data: { status: 'EMPTY' },
      });
    }
    // Si la cuve cible était vide et reçoit du volume, passe à IN_USE
    if (target.grapeComposition.length === 0 && updatedTargetCompo.length > 0 && target.status === 'EMPTY') {
      await context.remixService.prisma.tank.update({
        where: { id: target.id },
        data: { status: 'IN_USE' },
      });
    }

    // --- Créer une Action de type TRANSFERT pour chaque cuve ---
    const transferActionType = await context.remixService.prisma.actionType.findFirst({
      where: { name: { contains: 'TRANSFERT', mode: 'insensitive' } },
    });
    if (transferActionType) {
      await Promise.all([
        context.remixService.prisma.action.create({
          data: {
            tankId: source.id,
            userId: user.id,
            typeId: transferActionType.id,
            duration: 1,
            needsPurchase: false,
            isCompleted: true,
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        }),
        context.remixService.prisma.action.create({
          data: {
            tankId: target.id,
            userId: user.id,
            typeId: transferActionType.id,
            duration: 1,
            needsPurchase: false,
            isCompleted: true,
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        }),
      ]);
    }
    // 7. Succès
    return { result: { success: true } };
  }

  // Création d'une cuve
  if (intent === 'create-tank') {
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

    return { result: submission.reply(), status: 400 };
  }
  return null
};

export default function MyCellar() {
  const { tanks, plots, actionTypes, batches, stocks } = useLoaderData<MyCellarLoaderData>();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);


  const [formCreate, fieldsCreate] = useForm({
    id: "create-tank",
    constraint: getZodConstraint(TankSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TankSchema });
    },
    lastResult: actionData?.result as any,
    defaultValue: {
      name: "",
      description: "",
      volume: 0,
      material: TankMaterial.INOX,
      status: TankStatus.EMPTY,
    },
    onSubmit() {
      setIsCreateOpen(false)
    }
  });

  const [formTransfer, fieldsTransfer] = useForm({
    id: "transfer-tank",
    constraint: getZodConstraint(TransferSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: TransferSchema });
    },
    lastResult: actionData?.result as any,
    defaultValue: {
      volume: 0,
      sourceTank: "Sélectionner une cuve",
      targetTank: "Sélectionner une cuve",
      duration: 0,
    },
    onSubmit() {
      setIsTransferOpen(false)
    }
  });

  // Calculs avec les nouvelles fonctions utilitaires
  const totalCapacity = tanks.reduce((acc, tank) => acc + tank.volume, 0);
  const totalWine = tanks.reduce((acc, tank) => acc + getTankContentVolume(tank as any), 0);
  const fillRate = totalCapacity > 0 ? (totalWine / totalCapacity) * 100 : 0;
  const availableTanks = tanks.filter((tank) => getTankContentVolume(tank as any) === 0).length;
  const fullTanks = tanks.filter((tank) => getTankContentVolume(tank as any) >= tank.volume).length;

  return (
    <PageLayout
      title="Mon Chai"
      description="Créez et gérez vos cuves spécifiques (ex: &quot;Cuve 1&quot;, &quot;Cuve 2&quot;)"
      action={
        <div className="flex flex-col gap-2">
          <CreateDialog
            method="POST"
            trigger={
              <Button type="submit" name="action" value="create-tank">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Cuve
            </Button>
          }
            title="Créer une nouvelle cuve"
            formProps={getFormProps(formCreate)}
            isOpen={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            isSubmitting={isSubmitting}
            submitLabel="Créer la cuve"
          >
            <input type="hidden" name="intent" value="create-tank" />
            <Field
              inputProps={getInputProps(fieldsCreate.name, { type: "text" })}
              labelsProps={{ children: "Nom de la cuve (ex: Cuve 1)" }}
              errors={fieldsCreate.name.errors}
            />

            <Field
              inputProps={getInputProps(fieldsCreate.description, { type: "text" })}
              labelsProps={{ children: "Description (optionnel)" }}
              errors={fieldsCreate.description.errors}
            />

            <Field
              inputProps={getInputProps(fieldsCreate.volume, { type: "number", step: "0.1" })}
              labelsProps={{ children: "Capacité (hL)" }}
              errors={fieldsCreate.volume.errors}
            />

            <div className="space-y-2">
              <div className="flex justify-between gap-4">
                <div className="w-1/2">
                  <SelectField labelsProps={{ children: "Matériau" }} name={fieldsCreate.material.name} defaultValue={fieldsCreate.material.value || "INOX"} options={materialVariety.map((material) => ({
                    id: material.value,
                    name: material.label
                  }))} />
                </div>
                <div className="w-1/2">
                  <SelectField labelsProps={{ children: "Statut" }} name={fieldsCreate.status.name} defaultValue={fieldsCreate.status.value || "EMPTY"} options={tankStateVariety.map((status) => ({
                    id: status.value,
                    name: status.label
                  }))} />
                </div>
              </div>
            </div>
          </CreateDialog>
          <CreateDialog
            method="POST"
            trigger={
              <Button type="submit" name="action" value="transfer-tank" disabled={tanks.length < 2}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Transférer
              </Button>
            }
            title="Transférer d'une cuve à une autre"
            isOpen={isTransferOpen}
            onOpenChange={setIsTransferOpen}
            isSubmitting={isSubmitting}
            submitLabel="Valider le transfert"
            formProps={getFormProps(formTransfer)}
          >
            <input type="hidden" name="intent" value="transfer-tank" />
            <SelectField
              labelsProps={{ children: "Cuve Émettrice" }}
              name={fieldsTransfer.sourceTank.name}
              defaultValue={fieldsTransfer.sourceTank.value || "Cuve"}
              options={tanks.map((tank) => ({
                id: tank.id,
                name: tank.name
              }))}
            />
            <SelectField
              labelsProps={{ children: "Cuve Réceptrice" }}
              name={fieldsTransfer.targetTank.name}
              defaultValue={fieldsTransfer.targetTank.value || "Cuve"}
              options={tanks.map((tank) => ({
                id: tank.id,
                name: tank.name
              }))}
            />
            <Field
              inputProps={getInputProps(fieldsTransfer.volume, { type: 'number', step: "0.1" })}
              labelsProps={{ children: "Volume à transférer (hL)" }}
              errors={fieldsTransfer.volume.errors}
            />
            <Field
              inputProps={getInputProps(fieldsTransfer.duration, { type: 'number', step: "0.1" })}
              labelsProps={{ children: "Durée du transfert (h)" }}
              errors={fieldsTransfer.duration.errors}
            />
          </CreateDialog>
        </div>
      }
    >

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Capacité totale</p>
                <p className="text-2xl font-bold">{totalCapacity} hL</p>
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
                <p className="text-2xl font-bold">{totalWine} hL</p>
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
                <p className="text-2xl font-bold">{fillRate.toFixed(1)} %</p>
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


        {tanks.length === 0 ? (
        <EmptyState
          icon={<Database className="mx-auto w-12 h-12" />}
          title="Aucune cuve"
          description="Commencez par créer votre première cuve spécifique"
        />
        ) : (
          tanks.map((tank) => (
            <Card key={tank.id} className="h-full flex flex-col w-full mb-4">
              <div className="flex flex-row gap-4 justify-between items-center p-6 pb-0">
                <div className="flex flex-row gap-4 justify-start items-center">
                  <h4 className="font-bold text-lg">{tank.name}</h4>
                  <p className="text-sm text-gray-500">{tank.description}</p>
                  <p >{tank.volume}hL</p>
                  <Badge variant="secondary" className={`w-fit ${tankMaterialColors[tank.material]}`}>
                    {tankMaterialLabels[tank.material]}
                  </Badge>
                  <Badge variant="secondary" className={`w-fit ${tankStatusColors[tank.status]}`}>
                    {tankStatusLabels[tank.status]}
                  </Badge>
                </div>
                <EditTankDialog
                  tank={tank as any}
                />
              </div>
              <div className="flex flex-row gap-2 items-stretch p-6 h-full w-full">
                <div className="flex flex-col gap-2 w-2/5 items-stretch">
                  <div className="flex flex-row gap-2 w-full items-stretch">
                    <div className="w-1/3 flex-1">
                      <CardPh tank={tank as any} />
                    </div>
                    <div className="w-1/3 flex-1">
                      <CardTemperature tank={tank as any} />
                    </div>
                    <div className="w-1/3 flex-1">
                      <CardDensity tank={tank as any} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardComposition tank={tank as any} />
                  </div>
                </div>
                <div className="w-1/5">
                  <CardBarreCuve tank={tank as any} />
                </div>
                <div className="flex flex-col gap-2 justify-between flex-1">
                  <div className="h-2/3">
                    <ActionPlan tank={tank as any} stocks={stocks} />
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <AddPlotDialog tank={tank as any} plots={plots as any} />
                    <RemoveWineDialog tank={tank as any} batches={batches as any} />
                    <ActionTankDialog />
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
    </PageLayout >
  );
}
