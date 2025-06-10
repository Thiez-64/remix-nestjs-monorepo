import { Link } from "@remix-run/react";
import { useOptionalUser } from "~/root";
import { Dropdown } from "./Dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ModeToggle } from "./ui/toggle-mode";

export const Header = () => {
  const user = useOptionalUser();
  return (
    <header className="bg-background/75 backdrop-blur border-b border-gray-200 dark:border-gray-800 -mb-px sticky top-0 z-50">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between gap-3 h-16">
        <div className="flex items-center gap-1.5">
          <Link to="/">
            <div className=" text-black">LOGO</div>
          </Link>
        </div>
        {user ? (
          <ul className="items-center gap-x-8 hidden md:flex lg:flex-1 justify-end">
            {user.role === "SUPER_ADMIN" && (
              <>
                <li className="relative">
                  <Link to="/admin">Admin</Link>
                </li>
                <li className="relative">
                  <Link to="/users">Users</Link>
                </li>
              </>
            )}
            {user.role === "ADMIN" && (
              <>
                <li className="relative">
                  <Link to="/menu">Menu</Link>
                </li>
              </>
            )}
            {user.role === "USER" && (
              <>
                <li className="relative">
                  <Link to="/batch">Cuvées</Link>
                </li>
                <li className="relative">
                  <Link to="/my-cellar">Mon Chai</Link>
                </li>
                <li className="relative">
                  <Link to="/process">Processus</Link>
                </li>
                <li className="relative">
                  <Link to="/production">Production</Link>
                </li>

              </>
            )}
          </ul>
        ) : null}
        <div className="flex items-center justify-end lg:flex-1 gap-4">
          <div className="flex gap-4 items-center">
            <Link to="/blog">Blog</Link>
            <Link to="/home">What&apos;s new</Link>
          </div>
          {user ? (
            <div className="flex gap-4 items-center">
              <ModeToggle />
              <Avatar>
                <AvatarImage src="" alt={user.name ?? ""} />
                <AvatarFallback>
                  {user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <Dropdown profileName={user.name ?? ""} />
            </div>
          ) : (
            <>
              <Link className="text-xs" to="/login">
                <Button variant="default">Login</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
