import { Link } from "react-router-dom";
import { Building2, Clock, Crown, GraduationCap, Home, LandPlot, Store } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import type { ElementType } from "react";

const iconMap: Record<string, ElementType> = {
  houses: Home,
  apartments: Building2,
  land: LandPlot,
  commercial: Store,
  "short-stay": Clock,
  luxury: Crown,
  "student-housing": GraduationCap,
};

const descriptionMap: Record<string, string> = {
  houses: "Standalone homes and townhouses",
  apartments: "Flats and multi-storey units",
  land: "Plots for development",
  commercial: "Offices, shops, and warehouses",
  "short-stay": "Furnished temporary accommodation",
  luxury: "Premium high-end properties",
  "student-housing": "Near campuses and institutions",
};

export default function PropertyCategories() {
  const { propertyCategories } = useAdmin();
  if (propertyCategories.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">What are you looking for?</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {propertyCategories.map((category) => {
            const slug = category.name;
            const Icon = iconMap[slug] || Home;
            return (
              <Link key={category.id} to={`/properties?category=${slug}`} className="group bg-card rounded-lg p-5 border border-border hover:border-gold/50 hover:shadow-md transition-all text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary group-hover:text-gold transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{category.name.replace(/-/g, " ")}</h3>
                <p className="text-xs text-muted-foreground">{descriptionMap[slug] || "Explore available listings in this category."}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
