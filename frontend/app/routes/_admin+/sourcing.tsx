import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "../../server/auth.server";


export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await requireUser({ context });
  if (user?.role !== "ADMIN") {
    return redirect("/unauthorized");
  }
  const stocks = await context.remixService.prisma.stock.findMany()
  console.log('stocks', stocks)

  return { stocks }
};

export const action = async ({ params, context }: ActionFunctionArgs) => {
  const user = await requireUser({ context });
  console.log('user', user)
  console.log('params', params)

  return redirect("/menu");
};


export default function Sourcing() {
  const { stocks } = useLoaderData<typeof loader>();
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Sourcing page</h1>
      <div className="flex flex-col gap-4">
        {stocks.map((stock) => (
          <div key={stock.id}>{stock.name}</div>
        ))}
      </div>
    </div>
  );
}
