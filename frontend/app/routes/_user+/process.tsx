import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs
} from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Circle, PlayCircle, Plus } from "lucide-react";
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
import { requireUser } from "../../server/auth.server";
import { CreateActionDialog } from "./process.$processId.actions";
import { EditProcessDialog } from "./process.$processId.edit";
import { ProcessSchema } from "./process.schema";



export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  const [processes, allActions] = await Promise.all([context.remixService.prisma.process.findMany({
    where: { userId: user.id },
    include: {
      actions: {
        include: {
          consumables: true, // Inclure les consommables
        },
        orderBy: { createdAt: 'asc' },
      },
      batch: {
        include: {
          tanks: true, // Inclure les tanks pour récupérer la capacité
        },
      },
    },
    orderBy: { name: "asc" },
  }),
  context.remixService.prisma.action.findMany({
    where: {
      userId: user.id,
      processId: null, // Seulement les actions template
    },
    orderBy: { type: "asc" },
  })]);

  return { processes, allActions };
};

export type ProcessLoaderData = Awaited<ReturnType<typeof loader>>;

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
  const { processes, allActions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [open, setOpen] = useState(false);

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
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Processus de Vinification</h1>
          <p className="text-gray-600">
            Créez et gérez vos processus de fabrication
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Processus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un nouveau processus</DialogTitle>
            </DialogHeader>

            <Form {...getFormProps(form)} method="POST" className="space-y-4">
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

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Création..." : "Créer le processus"}
                </Button>
              </div>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {processes.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <PlayCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun processus</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer votre premier processus de vinification
                </p>
              </div>
            </CardContent>
          </Card>
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
                  <div className="flex space-x-2">
                    {/* eslint-disable @typescript-eslint/no-explicit-any */}
                    <CreateActionDialog process={process as any} availableActions={allActions as any} />
                    <EditProcessDialog process={process as any} />
                    {/* eslint-enable @typescript-eslint/no-explicit-any */}

                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {process.startDate && (
                    <div className="text-sm text-gray-600">
                      <p>Début : {new Date(process.startDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  {/* Timeline des actions */}
                  {process.actions && process.actions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-600">Actions assignées</h4>
                      <div className="relative">
                        <div className="flex items-start space-x-6 overflow-x-auto pb-2">
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
                              const hasConsumables = action.consumables && action.consumables.length > 0;
                              const isReady = hasConsumables || !action.needsPurchase;

                              return (
                                <div key={action.id} className="flex flex-col items-center min-w-0 relative">
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
                                      ) : (
                                          <Badge variant="secondary" className="bg-orange-200 text-orange-800 flex items-center gap-1">
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
    </div>
  );
}
