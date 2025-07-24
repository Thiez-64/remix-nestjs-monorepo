import { getFormProps } from "@conform-to/react";
import { Form } from "@remix-run/react";
import { ReactNode } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

interface CreateDialogProps {
  trigger: ReactNode;
  title: string;
  formProps: ReturnType<typeof getFormProps>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  submitLabel?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  action?: string;
  children: ReactNode;
}

export function CreateDialog({
  trigger,
  title,
  formProps,
  isOpen,
  onOpenChange,
  isSubmitting,
  submitLabel = "Créer",
  method = "POST",
  action,
  children
}: CreateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form
          {...formProps}
          method={method}
          action={action}
          className="space-y-4"
        >
          {children}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? `${submitLabel.slice(0, -1)}ion...` : submitLabel}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
