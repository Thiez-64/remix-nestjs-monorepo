import {
  FieldMetadata,
  getFormProps,
  getInputProps,
  type FormMetadata
} from "@conform-to/react";
import { Form, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { TankSchema } from "~/routes/_user+/my-cellar";
import { Label } from "./ui/label";

type FormFieldsFromSchema<TSchema extends z.ZodTypeAny> = {
  [K in keyof z.infer<TSchema>]: FieldMetadata<
    z.infer<TSchema>[K],
    z.infer<TSchema>,
    string[]
  >;
};

type CreateTankDialogProps = {
  children: React.ReactNode;
  form: FormMetadata<z.infer<typeof TankSchema>, string[]>;
  fields: FormFieldsFromSchema<typeof TankSchema>;
};

export function CreateTankDialog({
  children,
  form,
  fields,
}: CreateTankDialogProps) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (form.status === "success") {
      setOpen(false);
    }
  }, [form.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une cuve</DialogTitle>
        </DialogHeader>
        <Form
          {...getFormProps(form)}
          method="POST"
          action="/my-cellar"
          className="space-y-4"
        >
          <Field
            inputProps={getInputProps(fields.name, { type: "text" })}
            labelsProps={{ children: "Nom" }}
            errors={fields.name.errors}
          />

          {fields.description && < Field
            inputProps={getInputProps(fields.description, { type: "text" })}
            labelsProps={{ children: "Description" }}
            errors={fields.description.errors}
          />}

          <Field
            inputProps={getInputProps(fields.capacity, { type: "number" })}
            labelsProps={{ children: "Capacité (L)" }}
            errors={fields.capacity.errors}
          />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Matériau</Label>
            <Select name={fields.material.name}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un matériau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INOX">Inox</SelectItem>
                <SelectItem value="BETON">Béton</SelectItem>
                <SelectItem value="BOIS">Bois</SelectItem>
                <SelectItem value="PLASTIQUE">Plastique</SelectItem>
              </SelectContent>
            </Select>
            {fields.material.errors && (
              <p className="text-sm text-red-500">{fields.material.errors}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Création..." : "Créer"}
          </Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
