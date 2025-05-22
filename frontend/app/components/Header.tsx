import { Link } from "@remix-run/react";
import { Bell, ReceiptEuro, UserRound } from "lucide-react";
import { useOptionalUser } from "~/root";

export const Header = () => {
  const user = useOptionalUser();
  return (
    <header>
      <nav className="px-3 py-2 bg-bleu text-white flex justify-between items-center">
        <Link to="/">
          <div className="w-full h-auto max-w-[120px] text-black">LOGO</div>
        </Link>
        <div className="flex gap-2 text-black">
          {user ? (
            <>
              <span>{user.name}</span>
              <Link to="/">
                <ReceiptEuro className="flex-shrink-0" />
              </Link>
              <Link to="/">
                <Bell className="fill-white flex-shrink-0" />
              </Link>
              <Link to="/profile">
                <UserRound className="flex-shrink-0" />
              </Link>
              <form method="POST" action="/auth/logout">
                <button type="submit">Se déconnecter</button>
              </form>
            </>
          ) : (
            <>
              <Link className="text-xs" to="/login">
                Connexion
              </Link>
              <Link className="text-xs" to="/register">
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
