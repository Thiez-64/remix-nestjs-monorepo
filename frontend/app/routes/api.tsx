import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

type RemixContext = {
  remixService: {
    getHello: () => string;
  };
};

export const loader = async ({ context }: LoaderFunctionArgs & { context: RemixContext }) => {
  return json(context.remixService.getHello());
};

export default function Page() {
  const data = useLoaderData<typeof loader>();
  return <h1>{data}</h1>;
}
