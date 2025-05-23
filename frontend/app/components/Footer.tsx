import { Link, NavLink } from "@remix-run/react";

export const Footer = () => {
  return (
    <footer className="overflow-x-auto px-3 py-2 flex flex-col items-center justify-between gap-4 mt-auto ">
      <Link to="/">
        <div className="w-full h-auto max-w-[120px] text-black">LOGO</div>
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
