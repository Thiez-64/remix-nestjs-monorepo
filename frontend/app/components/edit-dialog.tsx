import { getFormProps } from "@conform-to/react";
import { Form } from "@remix-run/react";
import { Trash2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { ConfirmDelete } from "./confirm-delete";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

interface EditDialogProps {
  trigger: ReactNode;
  title: string;
  formProps: ReturnType<typeof getFormProps>;
  isSubmitting: boolean;
  editAction: string;
  deleteAction: string;
  itemName: string;
  itemType: string;
  submitLabel?: string;
  deleteInputs?: Array<{ name: string; value: string }>;
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDialog({
  trigger,
  title,
  formProps,
  isSubmitting,
  editAction,
  deleteAction,
  itemName,
  itemType,
  submitLabel = "Modifier",
  deleteInputs = [],
  children,
  isOpen,
  onOpenChange,
}: EditDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
          method="POST"
          action={editAction}
          className="space-y-4"
        >
          {children}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
              size="icon"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? `${submitLabel.slice(0, -1)}cation...` : submitLabel}
              </Button>
            </div>
          </div>
        </Form>

        {showDeleteConfirm && (
          <ConfirmDelete
            itemName={itemName}
            itemType={itemType}
            deleteAction={deleteAction}
            onCancel={() => setShowDeleteConfirm(false)}
            isSubmitting={isSubmitting}
            additionalInputs={deleteInputs}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 
