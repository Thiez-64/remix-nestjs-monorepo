import { parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs
} from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { PlayCircle } from "lucide-react";
import { useState } from "react";
import CardAssigned from "../../components/CardAssigned";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { requireUser } from "../../server/auth.server";
import { BatchLoaderData } from "./batch";
import { BatchSchema } from "./batch.schema";

export const action = async ({ request, params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const batchId = params.batchId;

  if (!batchId) {
    throw new Error("Batch ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Assigner un processus au batch
  if (intent === "assign") {
    const processId = formData.get("processId");
    if (!processId) {
      throw new Error("Process ID is required");
    }

    await context.remixService.prisma.batch.update({
      where: { id: batchId.toString(), userId: user.id },
      data: {
        processId: processId.toString() // ✅ Met à jour ce champ
      },
    });

    return new Response(null, { status: 200 });
  }

  // Retirer le processus du batch
  if (intent === "unassign") {
    await context.remixService.prisma.batch.update({
      where: {
        id: batchId.toString(),
        userId: user.id
      },
      data: {
        processId: null
      },
    });

    return new Response(null, { status: 200 });
  }

  // Créer un nouveau processus
  const submission = parseWithZod(formData, {
    schema: BatchSchema,
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  return { result: submission.reply() };
};

export function CreateBatchProcessDialog({
  batch,
  processes,
  processesExcludedIds
}: {
  batch: BatchLoaderData['batches'][number];
  processes: BatchLoaderData['processes'];
  processesExcludedIds: BatchLoaderData['processesExcludedIds'];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlayCircle className="w-4 h-4 mr-1" />
          Processus
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Processus pour {batch.name}</DialogTitle>
        </DialogHeader>

        {batch.processId ? (
          <CardAssigned title={processes.filter(p => p.id === batch.processId)[0]?.name} description={`Processus actuel • ${processes.filter(p => p.id === batch.processId)[0]?.description}`} url={`/batch/${batch.id}/process`} />

        ) :
          <div className="space-y-4">
            {processesExcludedIds && processesExcludedIds.length > 0 ? (
              <>
                <div>
                  <h4 className="font-medium mb-2">Assigner un processus existant</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {processes.map((process) => (
                      <div key={process.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{process.name}</p>
                          {process.description && (
                            <p className="text-sm text-gray-600">{process.description}</p>
                          )}
                        </div>
                        <Form method="POST" action={`/batch/${batch.id}/process`}>
                          <input type="hidden" name="intent" value="assign" />
                          <input type="hidden" name="processId" value={process.id} />
                          <Button size="sm" type="submit">Assigner</Button>
                        </Form>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Link to="/process">
                    <Button className="w-full">
                      Créer un nouveau processus
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <PlayCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Aucun processus disponible</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Créez votre premier processus pour ce batch
                </p>
                <Link to="/process">
                  <Button className="w-full">
                    Créer un processus
                  </Button>
                </Link>
              </div>
            )}
          </div>
        }
      </DialogContent>
    </Dialog>
  );
}
