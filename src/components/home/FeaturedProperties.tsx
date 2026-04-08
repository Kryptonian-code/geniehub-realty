import { useState, useEffect } from "react";
import PropertyCard from "@/components/property/PropertyCard";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import type { Property } from "@/types";
import { reportClientError } from "@/lib/errors";

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await api.getProperties({ featured: true, per_page: 4 });
        setProperties(response.data);
      } catch (error) {
        reportClientError("featured properties load", error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  if (loading) {
    return (
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">Handpicked for you</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Featured Properties</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">Handpicked for you</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Featured Properties</h2>
          </div>
          <Link to="/properties" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-gold transition-colors">
            View all listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
        <div className="sm:hidden mt-6 text-center">
          <Link to="/properties" className="text-sm font-medium text-primary hover:text-gold">View all listings →</Link>
        </div>
      </div>
    </section>
  );
}
