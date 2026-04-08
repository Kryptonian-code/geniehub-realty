import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Properties", path: "/properties" },
  { label: "Agents", path: "/agents" },
  { label: "Blog", path: "/blog" },
  { label: "Valuation", path: "/valuation" },
  { label: "Contact", path: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { settings } = useAdmin();

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-secondary">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-primary-foreground">
            {settings.companyName}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === link.path
                  ? "bg-secondary text-primary-foreground"
                  : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-secondary/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href={`tel:${settings.companyPhone}`}
            className="flex items-center gap-1.5 text-sm text-gold font-medium"
          >
            <Phone className="h-4 w-4" />
            {settings.companyPhone}
          </a>
          <Link to="/admin/login">
            <Button variant="outline" size="sm" className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold">
              Admin
            </Button>
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-primary-foreground p-2"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-primary border-t border-secondary">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 text-sm font-medium rounded-md ${
                  location.pathname === link.path
                    ? "bg-secondary text-primary-foreground"
                    : "text-primary-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/admin/login" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="mt-2 w-full border-gold/40 text-gold hover:bg-gold/10">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
