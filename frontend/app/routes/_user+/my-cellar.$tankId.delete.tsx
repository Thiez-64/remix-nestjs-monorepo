import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Tank } from "~/components/ColumnsMyCellar";
import { DeleteDialog } from "~/components/DeleteTankDialog";
import { Button } from "~/components/ui/button";
import { requireUser } from "~/server/auth.server";
import { deleteTank } from "~/server/mycellar.server";

export const loader = async () => {
  return redirect("/my-cellar");
};

export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const tankId = params.tankId;

  if (!tankId) {
    throw new Error("Tank ID is required");
  }

  await deleteTank(context.remixService, user.id, tankId);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export default function DeleteTankForm({ tank }: { tank: Tank }) {
  return (
    <div className="border-t pt-6 mt-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-destructive">
              Zone dangereuse
            </h3>
            <p className="text-sm text-muted-foreground">Supprimer la cuve</p>
          </div>
          <DeleteDialog name="cuve" url={`/my-cellar/${tank.id}/delete`}>
            <Button variant="destructive" className="justify-start">
              Supprimer cette cuve
            </Button>
          </DeleteDialog>
        </div>
      </div>
    </div>
  );
}
