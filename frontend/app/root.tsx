import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "@remix-run/react";
import type { RemixService } from "@thiez-64/backend";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { getOptionalUser } from "./server/auth.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "/app/tailwind.css" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  return json({ user });
};

export const useOptionalUser = () => {
  const data = useRouteLoaderData<typeof loader>("root");
  if (!data) {
    throw new Error("Root Loader did not return anything");
  }
  return data.user;
};

declare module "@remix-run/node" {
  interface AppLoadContext {
    remixService: RemixService;
    user: unknown;
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        {children}
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
