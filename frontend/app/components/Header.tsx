import { Link } from "@remix-run/react";
import { Amphora } from "lucide-react";
import { Button } from "./ui/button";

export const Header = () => {

  return (
    <header className="bg-background/75 backdrop-blur border-b border-gray-200 dark:border-gray-800 -mb-px sticky top-0 z-50">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between gap-3 h-16">
        <Link to="/" className="flex items-center gap-1.5">
          <Amphora className="!size-5" />
          <span className="text-base font-semibold">Vinum Inc.</span>
        </Link>
          <div className="flex gap-4 items-center">
            <Link to="/blog">Blog</Link>
            <Link to="/new">What&apos;s new</Link>
        </div>
        <Link className="text-xs" to="/login">
          <Button variant="default">Login</Button>
        </Link>
      </nav>
    </header>
  );
};
