import { SquareArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";


export function ActionTankDialog() {
  return (

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="data-[state=open]:bg-muted min-w-40"
          size='sm'
        >
          <SquareArrowRight className="w-4 h-4" />
          <span>Action sur la cuve</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Fermentation alcoolique</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>Contrôle de température</DropdownMenuItem>
          <DropdownMenuItem>Remontage</DropdownMenuItem>
          <DropdownMenuItem>Délestage</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Fermentation malolactique</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>Décuvage</DropdownMenuItem>
          <DropdownMenuItem>Soutirage</DropdownMenuItem>
          <DropdownMenuItem>Ouillage</DropdownMenuItem>
          <DropdownMenuItem>Sulfitage</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Entretien de la cuve</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>Nettoyage</DropdownMenuItem>
          <DropdownMenuItem>Désinfection</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>

  );
}
