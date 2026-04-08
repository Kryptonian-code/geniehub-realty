import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

export default function PopularLocations() {
  const { settings } = useAdmin();
  const locations = settings.popularLocations.length > 0
    ? settings.popularLocations
    : ["East Legon", "Cantonments", "Airport Residential", "Tema", "Kumasi", "Spintex"];

  return (
    <section className="py-16 lg:py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">Explore by area</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Popular Locations</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {locations.map((loc) => (
            <Link key={loc} to={`/properties?location=${encodeURIComponent(loc)}`} className="group bg-card rounded-lg p-4 border border-border hover:border-gold/50 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-gold" />
                <span className="font-semibold text-sm text-foreground group-hover:text-primary">{loc}</span>
              </div>
              <p className="text-xs text-muted-foreground">Browse listings in this area</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
