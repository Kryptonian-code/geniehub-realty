import { Link } from "react-router-dom";
import type { Property } from "@/types";
import { Bath, Bed, Car, MapPin, BadgeCheck, Flame, Sparkles } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

function formatPrice(property: Property): string {
  const formatCurrency = (amount: number) => `GHS ${amount.toLocaleString()}`;

  if (property.salePrice) return formatCurrency(property.salePrice);
  if (property.rentPrice) {
    let summary = `${formatCurrency(property.rentPrice)}/${property.rentPeriod || "month"}`;
    if (property.rentAdvanceYears) {
      summary += ` | ${property.rentAdvanceYears}yr advance`;
    }
    return summary;
  }

  return "Price on request";
}

const tagConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  featured: { icon: Sparkles, label: "Featured", className: "bg-gold text-accent-foreground" },
  verified: { icon: BadgeCheck, label: "Verified", className: "bg-primary text-primary-foreground" },
  "hot-deal": { icon: Flame, label: "Hot Deal", className: "bg-destructive text-destructive-foreground" },
  new: { icon: Sparkles, label: "New", className: "bg-secondary text-secondary-foreground" },
  reduced: { icon: Sparkles, label: "Reduced", className: "bg-gold text-accent-foreground" },
};

const statusColors: Record<string, string> = {
  available: "bg-green-600/90 text-white",
  sold: "bg-red-600/90 text-white",
  rented: "bg-blue-600/90 text-white",
  pending: "bg-yellow-600/90 text-white",
};

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <Link to={`/properties/${property.slug}`} className="group block">
      <div className="overflow-hidden rounded-lg border border-border bg-card transition-shadow duration-300 hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {property.images[0] ? (
            <img
              src={resolveMediaUrl(property.images[0])}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <MapPin className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {(property.tags || []).map((tag) => {
              const config = tagConfig[tag];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${config.className}`}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </span>
              );
            })}
          </div>

          <span
            className={`absolute right-3 top-3 rounded px-2 py-0.5 text-xs font-semibold capitalize ${statusColors[property.status] || ""}`}
          >
            {property.status}
          </span>
        </div>

        <div className="p-4">
          <p className="mb-1 text-lg font-bold text-gold">{formatPrice(property)}</p>
          <h3 className="mb-2 line-clamp-2 font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {property.title}
          </h3>
          <p className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.area}, {property.city}
          </p>

          {(property.bedrooms > 0 || property.bathrooms > 0 || property.parkingSpaces > 0) && (
            <div className="flex items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  {property.bedrooms}
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  {property.bathrooms}
                </span>
              )}
              {property.parkingSpaces > 0 && (
                <span className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  {property.parkingSpaces}
                </span>
              )}
              {property.landSize && <span className="text-xs">{property.landSize}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
