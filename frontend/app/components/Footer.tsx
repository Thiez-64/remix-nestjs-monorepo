import { Link, NavLink } from "@remix-run/react";
import { Amphora } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="overflow-x-auto px-3 py-2 flex flex-col items-center justify-between gap-4 mt-auto ">
      <Link to="/" className="flex items-center gap-1.5">
        <Amphora className="!size-5" />
        <span className="text-base font-semibold">Vinum Inc.</span>
      </Link>
      <div className="flex gap-4">
        <FooterLinkItem href="/terms" label="Terms" />
        <FooterLinkItem href="/privacy" label="Privacy" />
        <FooterLinkItem href="/legal" label="Legal" />
        <FooterLinkItem href="/home" label="What's new?" />
        <FooterLinkItem href="/cookies-policy" label="Cookies policy" />
      </div>
    </footer>
  );
};

const FooterLinkItem = ({ label, href }: { label: string; href: string }) => {
  return (
    <NavLink
      className={({ isActive }) =>
        `flex flex-col items-center text-sm ${isActive ? "text-vert" : "text-bleu"}`
      }
      to={href}
    >
      <span className="text-bleu">{label}</span>
    </NavLink>
  );
};
