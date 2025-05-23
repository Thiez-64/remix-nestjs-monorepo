import { Link } from "@remix-run/react";
import { Bell } from "lucide-react";
import { useOptionalUser } from "~/root";
import { Button } from "./ui/button";

export const Header = () => {
  const user = useOptionalUser();
  return (
    <header>
      <nav className="px-3 py-2 bg-bleu text-white flex justify-between items-center">
        <Link to="/">
          <div className="w-full h-auto max-w-[120px] text-black">LOGO</div>
        </Link>
        <div className="flex gap-4 text-black">
          <div className="flex gap-4 items-center">
            <Link to="/blog">Blog</Link>
            <Link to="/home">What's new</Link>
          </div>
          {user ? (
            <div className="flex gap-4 items-center">
              <Link to="/profile">
                <span>Hi {user.name} !</span>
              </Link>
              <Link to="/notifications">
                <Bell className="fill-white flex-shrink-0" />
              </Link>
              <form method="POST" action="/auth/logout">
                <Button type="submit" variant="outline">
                  Logout
                </Button>
              </form>
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
