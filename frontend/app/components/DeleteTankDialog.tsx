import { Form, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export function DeleteDialog({
  children,
  name,
  url,
}: {
  children: React.ReactNode;
  name: string;
  url: string;
}) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la {name}</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette {name} ? Cette action est
            irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Form method="POST" action={url} className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Suppression..." : "Supprimer"}
            </Button>
          </Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
