import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

export default function Footer() {
  const { settings, offices } = useAdmin();

  const socialIcons: Record<string, React.ElementType> = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-lg font-bold mb-4">{settings.companyName}</h3>
            {settings.aboutText ? (
              <p className="text-sm text-primary-foreground/70 leading-relaxed mb-6">
                {settings.aboutText.slice(0, 180)}{settings.aboutText.length > 180 ? "..." : ""}
              </p>
            ) : null}
            {settings.footerText ? (
              <p className="mb-6 text-sm leading-relaxed text-primary-foreground/70">{settings.footerText}</p>
            ) : null}
            <div className="flex gap-3">
              {Object.entries(settings.socialLinks).map(([key, url]) => {
                if (!url) return null;
                const Icon = socialIcons[key];
                return Icon ? (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-primary-foreground/80 hover:bg-gold hover:text-accent-foreground transition-colors">
                    <Icon className="h-4 w-4" />
                  </a>
                ) : null;
              })}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gold">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Properties", path: "/properties" },
                { label: "Our Agents", path: "/agents" },
                { label: "Blog", path: "/blog" },
                { label: "Property Valuation", path: "/valuation" },
                { label: "Contact Us", path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-primary-foreground/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gold">Property Types</h4>
            <ul className="space-y-2.5 text-sm">
              {["Houses", "Apartments", "Land", "Commercial", "Short Stay", "Luxury", "Student Housing"].map((type) => (
                <li key={type}>
                  <Link to={`/properties?category=${type.toLowerCase().replace(" ", "-")}`} className="text-primary-foreground/70 hover:text-gold transition-colors">
                    {type}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gold">Our Offices</h4>
            <div className="space-y-4 text-sm">
              {offices.map((office) => (
                <div key={office.id}>
                  <p className="font-medium">{office.name}</p>
                  <p className="text-primary-foreground/60 flex items-start gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    {office.address}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2 text-sm">
              {settings.companyPhone ? (
                <a href={`tel:${settings.companyPhone}`} className="flex items-center gap-2 text-primary-foreground/70 hover:text-gold">
                  <Phone className="h-3.5 w-3.5" /> {settings.companyPhone}
                </a>
              ) : null}
              {settings.companyAltPhone ? (
                <a href={`tel:${settings.companyAltPhone}`} className="flex items-center gap-2 text-primary-foreground/70 hover:text-gold">
                  <Phone className="h-3.5 w-3.5" /> {settings.companyAltPhone}
                </a>
              ) : null}
              {settings.companyEmail ? (
                <a href={`mailto:${settings.companyEmail}`} className="flex items-center gap-2 text-primary-foreground/70 hover:text-gold">
                  <Mail className="h-3.5 w-3.5" /> {settings.companyEmail}
                </a>
              ) : null}
              {settings.officeHours ? (
                <p className="text-primary-foreground/70">{settings.officeHours}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-secondary">
        <div className="container mx-auto px-4 py-5 text-center text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} {settings.companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
