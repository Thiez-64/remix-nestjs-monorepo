import { Amphora, BarChart, Bell, Cylinder, Database, FileText, Home, PackageCheck, ShoppingBag, Sprout, SquareArrowRight, Store, User, Wine, Zap } from "lucide-react";
import { useOptionalUser } from "../../root";
import { NavUser } from "../nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "./sidebar";

const itemsUser = [
  {
    title: "Domaine",
    items: [
      {
        title: "Vignobles",
        url: "/vineyard",
        icon: Sprout,
      },
      {
        title: "Mon Chai",
        url: "/my-cellar",
        icon: Cylinder,
      },
      {
        title: "Cave à vin",
        url: "/my-storage",
        icon: Wine,
      },
      {
        title: "Production",
        url: "/production",
        icon: SquareArrowRight,
      },
      // {
      //   title: "Cuvées",
      //   url: "/batch",
      //   icon: Wine,
      // },
    ]
  }, {
    title: "Gestion",
    items: [{
      title: "Stock",
      url: "/stock",
      icon: Database,
    }, {
      title: "Achats",
      url: "/purchase",
      icon: Store,
    }, {
      title: "Commandes",
      url: "/order",
      icon: PackageCheck,
    }]
  },
  {
    title: "Accueil",
    items: [{
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    }, {
      title: "Notifications",
      url: "/notification",
      icon: Bell,
    }, {
      title: "Actions",
      url: "/action",
      icon: Zap,
    }]
  },
]
const itemsAdmin = [{
  title: "Procurement",
  items: [{
    title: "Sourcing",
    url: "/sourcing",
    icon: ShoppingBag,
  },
  {
    title: "Devis",
    url: "/quote",
    icon: FileText,
  },
  {
    title: "Analyse",
    url: "/analysis",
    icon: BarChart,
  },
  {
    title: "Contrats",
    url: "/contract",
    icon: FileText,
  }
  ]
},
{
  title: "Commandes",
  items: [{
    title: "Commandes",
    url: "/order",
    icon: PackageCheck,
  }]
},
{
  title: "Facturation",
  items: [{
    title: "Factures",
    url: "/invoice",
    icon: FileText,
  }]
},
]

const itemsSuperAdmin = [
  {
    title: "Utilisateurs",
    items: [{
      title: "Utilisateurs",
      url: "/user",
      icon: User,
    }]
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useOptionalUser();
  if (!user) return null;

  const renderMenu = () => {
    switch (user.role) {
      case "USER":
        return itemsUser;
      case "ADMIN":
        return itemsAdmin;
      case "SUPER_ADMIN":
        return itemsSuperAdmin;
      default:
        return [];
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <Amphora className="!size-5" />
                <span className="text-base font-semibold">Vinum Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {renderMenu().map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuButton key={item.title} asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
