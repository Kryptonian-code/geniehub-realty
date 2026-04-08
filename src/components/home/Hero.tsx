import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home, DollarSign, Bed } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import { useAdmin } from "@/contexts/AdminContext";

export default function Hero() {
  const { settings } = useAdmin();
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (type) params.set("type", type);
    if (priceRange) params.set("price", priceRange);
    if (bedrooms) params.set("bedrooms", bedrooms);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Premium Ghana real estate" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
      </div>
      <div className="relative container mx-auto px-4 py-20">
        <div className="max-w-2xl">
          {settings.heroTitle ? (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-4">
              {settings.heroTitle}
            </h1>
          ) : (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-4">
              {settings.companyName}
            </h1>
          )}
          {settings.heroSubtitle ? (
            <p className="text-base lg:text-lg text-primary-foreground/80 mb-8 leading-relaxed max-w-xl">
              {settings.heroSubtitle}
            </p>
          ) : null}
          {settings.homepageBadges.length > 0 ? (
            <div className="mb-8 flex flex-wrap gap-2">
              {settings.homepageBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/85">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 mb-10">
            <Button onClick={() => navigate(settings.primaryCtaLink || "/properties")} size="lg" className="bg-gold text-accent-foreground hover:bg-gold/90 font-semibold">
              {settings.primaryCtaLabel || "Browse Properties"}
            </Button>
            <Button onClick={() => navigate(settings.secondaryCtaLink || "/contact")} size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              {settings.secondaryCtaLabel || "Speak to an Agent"}
            </Button>
          </div>
        </div>

        <div className="bg-card/95 backdrop-blur-sm rounded-xl p-4 lg:p-6 max-w-4xl shadow-xl border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring appearance-none">
                <option value="">Any Location</option>
                {["East Legon","Cantonments","Airport","Spintex","Tema","Adenta","Kasoa","Dansoman","Weija","Dzorwulu","Labone","Osu"].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="relative lg:col-span-1">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring appearance-none">
                <option value="">Property Type</option>
                {["house","apartment","duplex","studio","land","office-space","shop","warehouse","short-stay","hostel"].map(t => <option key={t} value={t}>{t.replace("-"," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="relative lg:col-span-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring appearance-none">
                <option value="">Price Range</option>
                <option value="0-100000">Up to GHS 100,000</option>
                <option value="100000-500000">GHS 100,000 - 500,000</option>
                <option value="500000-1000000">GHS 500,000 - 1,000,000</option>
                <option value="1000000+">Above GHS 1,000,000</option>
              </select>
            </div>
            <div className="relative lg:col-span-1">
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring appearance-none">
                <option value="">Bedrooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
              </select>
            </div>
            <Button onClick={handleSearch} className="bg-primary text-primary-foreground hover:bg-secondary h-auto py-2.5">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
