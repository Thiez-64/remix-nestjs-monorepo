import { Outlet, useMatches } from "@remix-run/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { capitalize } from "../../lib/capitalize";

export default function Layout() {
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const currentPath = currentMatch.pathname.split("/").pop() || "";
  return (

    <main className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl w-full">
      <div className="m-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {currentPath && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={currentMatch.pathname}>
                    {capitalize(currentPath)}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Outlet />
    </main>

  );
}
