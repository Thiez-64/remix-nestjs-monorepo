import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form, useNavigation } from "@remix-run/react";
import { Package } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Field } from "./forms";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

const RestockSchema = z.object({
  quantity: z.coerce.number().min(0.1, "La quantité doit être positive"),
});

interface RestockDialogProps {
  stock: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    isOutOfStock?: boolean;
  };
}

export function RestockDialog({ stock }: RestockDialogProps) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    id: `restock-${stock.id}`,
    constraint: getZodConstraint(RestockSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: RestockSchema });
    },
    onSubmit() {
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${stock.isOutOfStock
            ? 'border-red-200 text-red-700 hover:bg-red-50'
            : 'border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
        >
          <Package className="w-4 h-4 mr-1" />
          {stock.isOutOfStock ? 'Réapprovisionner' : 'Ajouter stock'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {stock.isOutOfStock ? 'Réapprovisionner' : 'Ajouter du stock'}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="font-medium">{stock.name}</div>
          <div className="text-sm text-gray-600">
            Stock actuel: {stock.quantity} {stock.unit}
            {stock.isOutOfStock && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                Rupture
              </span>
            )}
          </div>
        </div>

        <Form
          {...getFormProps(form)}
          method="POST"
          action={`/stock/${stock.id}/restock`}
          className="space-y-4"
        >
          <Field
            inputProps={{
              ...getInputProps(fields.quantity, { type: "number", step: "0.1" }),
              placeholder: `Quantité à ajouter (${stock.unit})`
            }}
            labelsProps={{ children: `Quantité à ajouter (${stock.unit})` }}
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
              {isSubmitting ? "Ajout..." : "Réapprovisionner"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
