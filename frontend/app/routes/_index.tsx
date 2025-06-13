import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getOptionalUser } from "../server/auth.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  if (user) {
    return redirect("/dashboard");
  }
  return null;
};

export default function Index() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold">Home page</h1>
    </div>
  );
}
