import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { getOptionalUser } from "~/server/auth.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  if (user?.role !== "USER") {
    return redirect("/unauthorized");
  }
  return null;
};

export default function Orders() {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-4xl font-bold">Orders page</h1>
    </div>
  );
}
