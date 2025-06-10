import { parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs
} from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { Grape } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
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
import { MyCellarLoaderData } from "./my-cellar";

export const BatchSchema = z.object({
  name: z.string().min(1, "Le nom du lot est requis"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "La quantité doit être supérieure à 0"),
});


export const action = async ({ request, params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const tankId = params.tankId;

  if (!tankId) {
    throw new Error("Tank ID is required");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Assigner un batch existant à la cuve
  if (intent === "assign") {
    const batchId = formData.get("batchId");
    if (!batchId) {
      throw new Error("Batch ID is required");
    }

    await context.remixService.prisma.tank.update({
      where: { id: tankId, userId: user.id },
      data: { batchId: batchId.toString() },
    });

    return new Response(null, { status: 200 });
  }

  // Retirer le batch de la cuve
  if (intent === "unassign") {
    await context.remixService.prisma.tank.update({
      where: { id: tankId, userId: user.id },
      data: { batchId: null },
    });

    return new Response(null, { status: 200 });
  }

  // Créer un nouveau batch
  const submission = parseWithZod(formData, {
    schema: BatchSchema,
  });

  if (submission.status !== "success") {
    return { result: submission.reply() };
  }

  const newBatch = await context.remixService.prisma.batch.create({
    data: {
      ...submission.value,
      userId: user.id,
    },
  });

  // Assigner automatiquement le nouveau batch à la cuve
  await context.remixService.prisma.tank.update({
    where: { id: tankId, userId: user.id },
    data: { batchId: newBatch.id },
  });

  return { result: submission.reply() };
};

export function CreateMyCellarBatchDialog({ tank, batches }: { tank: MyCellarLoaderData['tanks'][number]; batches: MyCellarLoaderData['batches'] }) {
  const [open, setOpen] = useState(false);
  const availableBatches = batches.filter(b => b.id !== tank.batch?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Grape className="w-4 h-4 mr-1" />
          Cuvées
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cuvée pour {tank.name}</DialogTitle>
        </DialogHeader>

        {tank.batch ? (
          <CardAssigned title={tank.batch.name} description={`Cuvée actuelle • ${tank.batch.quantity}L`} url={`/my-cellar/${tank.id}/batch`} />
        )
          :
          <div className="space-y-4">
            {availableBatches.length > 0 ? (
              <>
                <div>
                  <h4 className="font-medium mb-2">Assigner une cuvée existante</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableBatches.map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{batch.name}</p>
                          <p className="text-sm text-gray-600">{batch.quantity}L</p>
                          {batch.description && (
                            <p className="text-xs text-gray-500">{batch.description}</p>
                          )}
                        </div>
                        <Form method="POST" action={`/my-cellar/${tank.id}/batch`}>
                          <input type="hidden" name="intent" value="assign" />
                          <input type="hidden" name="batchId" value={batch.id} />
                          <Button size="sm" type="submit">Assigner</Button>
                        </Form>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Link to="/batch">
                    <Button className="w-full">
                      Créer une nouvelle cuvée
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Grape className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Aucune cuvée disponible</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Créez votre première cuvée pour cette cuve
                </p>
                <Link to="/batch">
                  <Button className="w-full">
                    Créer une cuvée
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
