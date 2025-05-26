import { Bell, CreditCard, LogOut, Settings, User, Users } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const Dropdown = ({ profileName }: { profileName: string }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">Hi {profileName}!</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Account
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <a href="/notifications" className="flex items-center gap-2 w-full">
              <Bell className="w-4 h-4" />
              Notifications
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <a href="/profile" className="flex items-center gap-2 w-full">
              <User className="w-4 h-4" />
              Profile
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <a href="/subscription" className="flex items-center gap-2 w-full">
              <CreditCard className="w-4 h-4" />
              Subscription
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <a href="/settings" className="flex items-center gap-2 w-full">
              <Settings className="w-4 h-4" />
              Settings
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <form method="POST" action="/auth/logout" className="w-full">
            <button
              type="submit"
              className="font-bold flex items-center gap-2 w-full"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
