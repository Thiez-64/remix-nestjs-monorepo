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
import { ThemeProvider } from "./components/ThemeProvider";
import { AppSidebar } from "./components/ui/app-sidebar";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { getOptionalUser } from "./server/auth.server";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href:
      process.env.NODE_ENV === "production"
        ? "/build/tailwind.css"
        : "/app/tailwind.css",
  },
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
  return json({ user: user || null });
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
    user: {
      id: string;
      email: string;
      name: string | null;
      role: "USER" | "ADMIN" | "SUPER_ADMIN";
    } | null;
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useOptionalUser();
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col bg-primary-foreground">
        {user ? <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <div className="flex-1">
                {children}
                <Footer />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider> :
          <>
            <Header />
            <div className="flex-1">
              {children}
              <Footer />
            </div>
          </>}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
