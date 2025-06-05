import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Action } from "~/components/ColumnsActions";
import { DeleteDialog } from "~/components/DeleteTankDialog";
import { Button } from "~/components/ui/button";
import { deleteAction } from "~/server/action.server";
import { requireUser } from "~/server/auth.server";

export const loader = async () => {
  return redirect("/actions");
};

export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  const actionId = params.actionId;

  if (!actionId) {
    throw new Error("Action ID is required");
  }

  await deleteAction(context.remixService, user.id, actionId);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export default function DeleteActionForm({ action }: { action: Action }) {
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
          <DeleteDialog name="action" url={`/actions/${action.id}/delete`}>
            <Button variant="destructive" className="justify-start">
              Supprimer cette action
            </Button>
          </DeleteDialog>
        </div>
      </div>
    </div>
  );
}
