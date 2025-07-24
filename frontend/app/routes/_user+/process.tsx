import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { type Action, type Process, type Stock } from "../../lib/types";

import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs
} from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Circle, PlayCircle, Plus } from "lucide-react";
import { useState } from "react";
import { ActionButtons } from "../../components/action-buttons";
import { CreateDialog } from "../../components/create-dialog";
import { EmptyState } from "../../components/empty-state";
import { Field } from "../../components/forms";
import { PageLayout } from "../../components/page-layout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ProcessSchema } from "../../lib/schemas";
import { requireUser } from "../../server/auth.server";
import { CreateActionDialog } from "./process.$processId.actions";
import { EditProcessDialog } from "./process.$processId.edit";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });  
  if (!["USER"].includes(user.role)) {
    return redirect("/unauthorized");
  }
  const [processes, allActions, stocks] = await Promise.all([
    context.remixService.prisma.process.findMany({
      where: { userId: user.id },
      include: {
        actions: {
          include: {
            consumables: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        batch: {
          include: {
            tanks: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    context.remixService.prisma.action.findMany({
      where: {
        userId: user.id,
        processId: null,
      },
      orderBy: { type: "asc" },
    }),
    context.remixService.prisma.stock.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })
  ]);

  return { processes, allActions, stocks };
};

export type ProcessLoaderData = {
  processes: (Process & {
    actions: (Action & {
      consumables: {
        name: string;
        quantity: number;
        unit: string;
      }[];
    })[];
    batch?: {
      tanks: {
        id: string;
        allocatedVolume: number;
      }[];
    } | null;
  })[];
  allActions: Action[];
  stocks: Stock[];
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Suppression d'un processus
  if (intent === "delete") {
    const processId = formData.get("processId");
    if (!processId) {
      throw new Error("Process ID is required");
    }

    await context.remixService.prisma.process.delete({
      where: { id: processId.toString(), userId: user.id },
    });

    return new Response(null, { status: 200 });
  }

  // Création d'un processus
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ProcessSchema.superRefine(async (data, ctx) => {
      const existingProcess = await context.remixService.prisma.process.findFirst({
        where: { name: data.name, userId: user.id },
      });

      if (existingProcess) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Un processus avec ce nom existe déjà",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  await context.remixService.prisma.process.create({
    data: {
      name: submission.value.name,
      description: submission.value.description,
      startDate: submission.value.startDate ? new Date(submission.value.startDate) : null,
      userId: user.id,
    },
  });

  return { result: submission.reply() };
};

export default function Process() {
  const { processes, allActions, stocks } = useLoaderData<ProcessLoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);

  // Fonction helper pour calculer la date de fin d'un processus
  const calculateProcessEndDate = (process: typeof processes[0]): Date | null => {
    if (!process.startDate || !process.actions?.length) {
      return null;
    }

    const totalDuration = process.actions.reduce((sum, action) => sum + action.duration, 0);
    const endDate = new Date(process.startDate);
    endDate.setDate(endDate.getDate() + totalDuration);

    return endDate;
  };

  const [form, fields] = useForm({
    id: "create-process",
    constraint: getZodConstraint(ProcessSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ProcessSchema });
    },
    lastResult: actionData?.result,
    onSubmit() {
      setOpen(false);
    },
  });

  return (
    <PageLayout
      title="Processus de Vinification"
      description="Créez et gérez vos processus de fabrication"
      actionButton={{
        label: "Nouveau Processus",
        icon: <Plus className="w-4 h-4 mr-2" />,
        onClick: () => setOpen(true)
      }}
    >
      <CreateDialog
        trigger={<Button style={{ display: 'none' }} />} // Hidden trigger since we control via state
        title="Créer un nouveau processus"
        formProps={getFormProps(form)}
        isOpen={open}
        onOpenChange={setOpen}
        isSubmitting={isSubmitting}
        submitLabel="Créer le processus"
      >
        <Field
          inputProps={getInputProps(fields.name, { type: "text" })}
          labelsProps={{ children: "Nom du processus (ex: Vinification Rouge)" }}
          errors={fields.name.errors}
        />
        <Field
          inputProps={getInputProps(fields.description, { type: "text" })}
          labelsProps={{ children: "Description (optionnel)" }}
          errors={fields.description.errors}
        />
        <Field
          inputProps={getInputProps(fields.startDate, { type: "date" })}
          labelsProps={{ children: "Date de début (optionnel)" }}
          errors={fields.startDate.errors}
        />
      </CreateDialog>

      <div className="grid gap-4">
        {processes.length === 0 ? (
          <EmptyState
            icon={<PlayCircle className="mx-auto h-12 w-12" />}
            title="Aucun processus"
            description="Commencez par créer votre premier processus de vinification"
          />
        ) : (
          processes.map((process) => (
            <Card key={process.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{process.name}</CardTitle>
                    {process.description && (
                      <CardDescription>{process.description}</CardDescription>
                    )}
                  </div>
                  <ActionButtons>
                    <CreateActionDialog process={process as unknown as ProcessLoaderData['processes'][number]} availableActions={allActions as unknown as ProcessLoaderData['allActions']} />
                    <EditProcessDialog process={process as unknown as ProcessLoaderData['processes'][number]} />
                  </ActionButtons>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {process.startDate && (
                    <div className="flex flex-row gap-2 items-center text-sm text-gray-600">
                      <p className="font-bold">Début :</p>
                      <p>{new Date(process.startDate).toLocaleDateString()}</p>
                      <p className="font-bold">Fin :</p>
                      <p>{calculateProcessEndDate(process)?.toLocaleDateString() || "Non calculable"}</p>
                    </div>
                  )}

                  {/* Timeline des actions */}
                  {process.actions && process.actions.length > 0 && (
                    <div className="space-y-3 space-x-2">
                      <h4 className="text-sm font-bold text-gray-600">Actions assignées</h4>
                      <div className="space-x-2 overflow-x-auto max-w-[55vw]">
                        <div className="space-x-6 flex pb-2">
                          {process.actions
                            .sort((a, b) => {
                              // Actions avec date d'abord, triées par date
                              if (a.assignedDate && b.assignedDate) {
                                return new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime();
                              }
                              // Actions avec date avant celles sans date
                              if (a.assignedDate && !b.assignedDate) return -1;
                              if (!a.assignedDate && b.assignedDate) return 1;
                              // Actions sans date triées par création
                              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                            })
                            .map((action, index) => {
                              // Déterminer le statut de l'action
                              const now = new Date();
                              const actionDate = action.assignedDate ? new Date(action.assignedDate) : null;

                              let status: 'upcoming' | 'current' | 'completed';
                              let statusColor: string;
                              let statusBg: string;

                              if (actionDate) {
                                const daysDiff = actionDate ? Math.ceil((actionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                                if (daysDiff > 0) {
                                  status = 'upcoming';
                                  statusColor = 'text-gray-500';
                                  statusBg = 'bg-gray-300';
                                } else if (daysDiff <= 0 && daysDiff > -action.duration) {
                                  status = 'current';
                                  statusColor = 'text-blue-600';
                                  statusBg = 'bg-blue-500';
                                } else {
                                  status = 'completed';
                                  statusColor = 'text-green-600';
                                  statusBg = 'bg-green-500';
                                }
                              } else {
                                status = 'upcoming';
                                statusColor = 'text-gray-500';
                                statusBg = 'bg-gray-300';
                              }

                              // Vérifier si l'action est prête à démarrer
                              const hasValidConsumables = action.consumables?.every(c =>
                                c.name && c.quantity > 0 && c.unit
                              );

                              // Vérifier si les stocks sont suffisants pour les consommables
                              const hasEnoughStock = action.consumables?.every(consumable => {
                                if (!consumable.name || !consumable.quantity) return false;
                                const stock = stocks.find(s => s.name === consumable.name);
                                return stock && stock.quantity >= consumable.quantity;
                              });

                              const isReady = action.needsPurchase ? (hasValidConsumables && hasEnoughStock) : true;

                              return (
                                <div key={action.id} className="flex flex-col items-center min-w-52 relative">
                                  {/* Ligne de connexion */}
                                  {index !== process.actions.length - 1 && (
                                    <div className="absolute top-3 left-full w-6 h-px bg-gray-200 z-0" />
                                  )}

                                  {/* Point de la timeline avec statut */}
                                  <div className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${statusBg} z-10 shadow-sm`}>
                                    <div className="h-3 w-3 rounded-full bg-white" />
                                  </div>

                                  {/* Contenu de l'action */}
                                  <div className="mt-3 text-center min-w-[140px] max-w-[160px]">
                                    <p className={`text-sm font-medium ${statusColor} truncate`}>
                                      {action.type}
                                    </p>

                                    {/* Date si assignée */}
                                    {action.assignedDate && (
                                      <p className={`text-xs ${statusColor} mt-1`}>
                                        {new Date(action.assignedDate).toLocaleDateString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit'
                                        })}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {action.duration} jour{action.duration > 1 ? 's' : ''}
                                    </p>

                                    {/* Indicateur de statut */}
                                    <div className="mt-2 flex items-center justify-center">
                                      {isReady ? (
                                        <Badge variant="secondary" className="bg-green-200 text-green-800 flex items-center gap-1">
                                          <Circle className="w-2 h-2" />
                                          Prêt
                                        </Badge>
                                      ) : action.needsPurchase ? (
                                        <Badge variant="secondary" className="bg-orange-200 text-orange-800 flex items-center gap-1">
                                            <Circle className="w-2 h-2" />
                                            {hasValidConsumables ? "Stock insuffisant" : "Consommables requis"}
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-gray-200 text-gray-800 flex items-center gap-1">
                                              <Circle className="w-2 h-2" />
                                          En attente
                                            </Badge>
                                      )}
                                    </div>

                                    {/* Badge de statut temporel */}
                                    <div className="mt-1">
                                      {status === 'upcoming' && (
                                        <span className="text-xs text-gray-600">À venir</span>
                                      )}
                                      {status === 'current' && (
                                        <span className="text-xs text-blue-600 font-medium">En cours</span>
                                      )}
                                      {status === 'completed' && (
                                        <span className="text-xs text-green-600 font-medium">Terminé</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {process.actions && process.actions.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Aucune action assignée</p>
                      <p className="text-xs text-gray-400">Cliquez sur &quot;Actions&quot; pour en ajouter</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageLayout>
  );
}
