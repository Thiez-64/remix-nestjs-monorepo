import { Link } from "@remix-run/react";
import { ShieldAlert } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <ShieldAlert className="w-16 h-16 text-red-500" />
      <h1 className="text-2xl font-bold">Unauthorized access</h1>
      <p className="text-muted-foreground">
        You don&apos;t have the necessary permissions to access this page.
      </p>
      <Link to="/" className="text-primary hover:underline">
        <Button variant="outline">Back home</Button>
      </Link>
    </div>
  );
}
