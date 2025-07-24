import { Form } from "@remix-run/react";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface ConfirmDeleteProps {
  itemName: string;
  itemType: string;
  deleteAction: string;
  onCancel: () => void;
  isSubmitting: boolean;
  additionalInputs?: Array<{ name: string; value: string }>;
}

export function ConfirmDelete({
  itemName,
  itemType,
  deleteAction,
  onCancel,
  isSubmitting,
  additionalInputs = []
}: ConfirmDeleteProps) {
  return (
    <div className="absolute inset-0 bg-white rounded-lg p-6 flex flex-col justify-center">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Supprimer {itemType} &quot;{itemName}&quot;
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Cette action est irréversible. {itemType} sera définitivement supprimé{itemType.endsWith('e') ? 'e' : ''}.
        </p>
        <div className="flex justify-center space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Form method="POST" action={deleteAction}>
            <input type="hidden" name="intent" value="delete" />
            {additionalInputs.map((input) => (
              <input
                key={input.name}
                type="hidden"
                name={input.name}
                value={input.value}
              />
            ))}
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
} 
