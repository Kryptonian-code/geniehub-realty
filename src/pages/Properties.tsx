import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import PropertyCard from "@/components/property/PropertyCard";
import { api } from "@/lib/api";
import { useAdmin } from "@/contexts/AdminContext";
import type { Property } from "@/types";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/errors";
import SeoMeta from "@/components/seo/SeoMeta";

const ITEMS_PER_PAGE = 12;

export default function Properties() {
  const { propertyCategories, propertyTypes } = useAdmin();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);

  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "");
  const [furnished, setFurnished] = useState("");
  const [verified, setVerified] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get("page") || "1"));

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (location) nextParams.set("location", location);
    if (type) nextParams.set("type", type);
    if (category) nextParams.set("category", category);
    if (bedrooms) nextParams.set("bedrooms", bedrooms);
    if (priceRange) nextParams.set("price", priceRange);
    if (furnished) nextParams.set("furnished", furnished);
    if (verified) nextParams.set("verified", "1");
    if (page > 1) nextParams.set("page", String(page));
    setSearchParams(nextParams, { replace: true });
  }, [location, type, category, bedrooms, priceRange, furnished, verified, page, setSearchParams]);

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      try {
        const filters: Record<string, string | number | boolean> = {};
        if (location) filters.city = location;
        if (type) filters.type = type;
        if (category) filters.category = category;
        if (priceRange) {
          if (priceRange === "0-100000") {
            filters.max_price = 100000;
          } else if (priceRange === "100000-500000") {
            filters.min_price = 100000;
            filters.max_price = 500000;
          } else if (priceRange === "500000-1000000") {
            filters.min_price = 500000;
            filters.max_price = 1000000;
          } else if (priceRange === "1000000+") {
            filters.min_price = 1000000;
          }
        }

        filters.page = page;
        filters.per_page = ITEMS_PER_PAGE;
        if (bedrooms) filters.bedrooms = bedrooms;
        if (furnished) filters.furnished = furnished;
        if (verified) filters.verified = true;

        const response = await api.getProperties(filters);
        setProperties(response.data);
        setTotal(response.meta.total);
      } catch (error) {
        reportClientError("properties page load", error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [location, type, category, priceRange, bedrooms, furnished, verified, page]);

  const filtered = useMemo(() => properties, [properties]);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const paginated = filtered;

  const clearFilters = () => {
    setLocation(""); setType(""); setCategory(""); setBedrooms(""); setPriceRange(""); setFurnished(""); setVerified(false); setPage(1);
    setSearchParams({});
  };

  const selectClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring appearance-none";

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title="Property Listings in Ghana | GenieHub Realty"
        description="Browse verified property listings in Ghana, including houses, apartments, land, and commercial spaces."
        canonicalPath="/properties"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Property Listings in Ghana",
          description: "Browse verified property listings in Ghana, including houses, apartments, land, and commercial spaces.",
        }}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">Property Listings</h1>
            <p className="text-primary-foreground/70 mt-1 text-sm">Browse verified properties across Ghana</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">{total} {total === 1 ? "property" : "properties"} found</p>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4 mr-1" /> Filters
            </Button>
          </div>

          <div className="flex gap-8">
            <aside className={`${showFilters ? "fixed inset-0 z-40 bg-background p-6 overflow-auto" : "hidden"} lg:block lg:static lg:w-64 flex-shrink-0`}>
              <div className="flex items-center justify-between mb-4 lg:mb-0">
                <h3 className="font-semibold text-foreground">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="lg:hidden"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
                  <select value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} className={selectClass}>
                    <option value="">All Locations</option>
                    {["East Legon","Cantonments","Airport Residential","Spintex","Tema","Adenta","Kasoa","Osu","Dzorwulu","Labone","Kumasi","Ayeduase"].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={selectClass}>
                    <option value="">All Categories</option>
                    {propertyCategories.map((category) => <option key={category.id} value={category.name}>{category.name.replace(/-/g," ").replace(/\b\w/g,x=>x.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Property Type</label>
                  <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={selectClass}>
                    <option value="">All Types</option>
                    {propertyTypes.map((propertyType) => <option key={propertyType.id} value={propertyType.name}>{propertyType.name.replace(/-/g," ").replace(/\b\w/g,x=>x.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Bedrooms</label>
                  <select value={bedrooms} onChange={(e) => { setBedrooms(e.target.value); setPage(1); }} className={selectClass}>
                    <option value="">Any</option>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Price Range</label>
                  <select value={priceRange} onChange={(e) => { setPriceRange(e.target.value); setPage(1); }} className={selectClass}>
                    <option value="">Any Price</option>
                    <option value="0-100000">Up to GHS 100,000</option>
                    <option value="100000-500000">GHS 100k - 500k</option>
                    <option value="500000-1000000">GHS 500k - 1M</option>
                    <option value="1000000+">Above GHS 1M</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Furnished</label>
                  <select value={furnished} onChange={(e) => { setFurnished(e.target.value); setPage(1); }} className={selectClass}>
                    <option value="">Any</option>
                    <option value="fully-furnished">Fully Furnished</option>
                    <option value="semi-furnished">Semi Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={verified} onChange={(e) => { setVerified(e.target.checked); setPage(1); }} className="rounded border-input" />
                  Verified only
                </label>
                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full mt-2">Clear Filters</Button>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {paginated.length === 0 ? (
                <div className="text-center py-20">
                  <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No properties match your filters.</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2 text-gold">Clear all filters</Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginated.map((p) => <PropertyCard key={p.id} property={p} />)}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
