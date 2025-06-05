import {
  getFormProps,
  getInputProps,
  type FieldMetadata,
  type FormMetadata,
} from "@conform-to/react";
import { Form, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { SelectScrollable } from "./SelectScrollable";
import { Field } from "./forms";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type CreateActionFormData = {
  wineType: "ROUGE" | "BLANC" | "ROSE";
  type: string;
  description: string;
  duration: number;
};

type CreateActionDialogProps = {
  children: React.ReactNode;
  form: FormMetadata<CreateActionFormData, string[]>;
  fields: {
    wineType: FieldMetadata<
      CreateActionFormData["wineType"],
      CreateActionFormData,
      string[]
    >;
    type: FieldMetadata<
      CreateActionFormData["type"],
      CreateActionFormData,
      string[]
    >;
    description: FieldMetadata<
      CreateActionFormData["description"],
      CreateActionFormData,
      string[]
    >;
    duration: FieldMetadata<
      CreateActionFormData["duration"],
      CreateActionFormData,
      string[]
    >;
  };
};

export function CreateActionDialog({
  children,
  form,
  fields,
}: CreateActionDialogProps) {
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
          <DialogTitle>Créer une action</DialogTitle>
        </DialogHeader>
        <Form
          {...getFormProps(form)}
          method="POST"
          action="/actions"
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type de vin</Label>
            <Select name={fields.wineType.name}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROUGE">Rouge</SelectItem>
                <SelectItem value="BLANC">Blanc</SelectItem>
                <SelectItem value="ROSE">Rosé</SelectItem>
              </SelectContent>
            </Select>
            {fields.wineType.errors && (
              <p className="text-sm text-red-500">{fields.wineType.errors}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type d&apos;actions</Label>
            <SelectScrollable name={fields.type.name} />
            {fields.type.errors && (
              <p className="text-sm text-red-500">{fields.type.errors}</p>
            )}
          </div>
          <Field
            inputProps={getInputProps(fields.description, { type: "text" })}
            labelsProps={{ children: "Description" }}
            errors={fields.description.errors}
          />
          <Field
            inputProps={getInputProps(fields.duration, { type: "number" })}
            labelsProps={{ children: "Durée estimée (jours)" }}
            errors={fields.duration.errors}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Création..." : "Créer"}
          </Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
