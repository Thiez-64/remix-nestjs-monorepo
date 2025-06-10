import { Form } from "@remix-run/react";
import { Button } from "./ui/button";

export default function CardAssigned({ title, description, url }: { title: string, description: string, url: string }) {
  return (
    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-green-900">{title}</h4>
          <p className="text-sm text-green-700">{description}</p>
        </div>
        <Form method="POST" action={url}>
          <input type="hidden" name="intent" value="unassign" />
          <Button variant="outline" size="sm" type="submit">
            Retirer
          </Button>
        </Form>
      </div>
    </div>
  )
}
