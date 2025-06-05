import { parseWithZod } from "@conform-to/zod";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/server/auth.server";

const CreateActionSchema = z.object({
  type: z.string(),
  description: z.string(),
  duration: z.coerce.number().min(1),
  needsPurchase: z.boolean().optional(),
  wineType: z.enum(["ROUGE", "BLANC", "ROSE"]),
  consumables: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().min(0),
      unit: z.string(),
    })
  ),
});

export const action = async ({
  request,
  params,
  context,
}: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const formData = await request.formData();
  const actionId = params.actionId;

  if (request.method === "DELETE") {
    await context.remixService.prisma.action.delete({
      where: {
        id: actionId,
        userId: user.id,
      },
    });
    return json({ success: true });
  }

  const submission = await parseWithZod(formData, {
    schema: CreateActionSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { type, description, duration, needsPurchase, wineType, consumables } =
    submission.value;

  // Création ou update de l'action
  let actionTank;
  if (actionId === "new") {
    actionTank = await context.remixService.prisma.action.create({
      data: {
        type,
        description,
        estimatedDuration: duration,
        userId: user.id,
        needsPurchase: needsPurchase || false,
        wineType,
      },
    });
  } else {
    actionTank = await context.remixService.prisma.action.update({
      where: {
        id: actionId,
        userId: user.id,
      },
      data: {
        type,
        description,
        estimatedDuration: duration,
        needsPurchase,
        wineType,
      },
    });
    // On supprime les anciens consommables liés à cette action pour les remplacer
    await context.remixService.prisma.actionConsumable.deleteMany({
      where: { actionId: actionTank.id },
    });
  }

  // Pour chaque consommable du formulaire
  for (const c of consumables) {
    // On cherche un consommable existant
    let consumable = await context.remixService.prisma.consumable.findFirst({
      where: { name: c.name, unit: c.unit },
    });
    // Sinon on le crée
    if (!consumable) {
      consumable = await context.remixService.prisma.consumable.create({
        data: { name: c.name, unit: c.unit },
      });
    }
    // On crée la relation ActionConsumable
    await context.remixService.prisma.actionConsumable.create({
      data: {
        actionId: actionTank.id,
        consumableId: consumable.id,
        quantity: c.quantity,
      },
    });
  }

  return submission.reply();
};
