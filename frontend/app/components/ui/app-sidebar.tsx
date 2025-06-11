import { Database, PackageCheck, PlayCircle, ShoppingBag, SquareArrowRight, Wine } from "lucide-react";
import { useOptionalUser } from "../../root";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "./sidebar";

const items = [
  {
    title: "Cuvées",
    url: "/batch",
    icon: Wine,
  },
  {
    title: "Mon Chai",
    url: "/my-cellar",
    icon: Database,
  },
  {
    title: "Processus",
    url: "/process",
    icon: PlayCircle,
  },
  {
    title: "Production",
    url: "/production",
    icon: SquareArrowRight,
  },

]

export function AppSidebar() {
  const user = useOptionalUser();
  return (
    <>
      {
        user?.role === "USER" &&
        <Sidebar className="mt-16">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Vignification</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Stock</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <a href="/stock">
                          <Database />
                          <span>Stockage</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Achats</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <a href="/purchases">
                          <ShoppingBag />
                          <span>Achats</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Commandes</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <a href="/orders">
                          <PackageCheck />
                          <span>Commandes</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      }
    </>
  )
}
