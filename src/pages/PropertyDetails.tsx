import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import PropertyCard from "@/components/property/PropertyCard";
import { api } from "@/lib/api";
import type { Agent, Property } from "@/types";
import { useState, useEffect } from "react";
import { MapPin, Bed, Bath, Car, Ruler, ShieldCheck, Droplets, Zap, Home, CheckCircle, ArrowLeft, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { resolveMediaUrl } from "@/lib/media";
import { reportClientError } from "@/lib/errors";
import { useAdmin } from "@/contexts/AdminContext";
import SeoMeta from "@/components/seo/SeoMeta";

export default function PropertyDetails() {
  const { slug } = useParams();
  const { toast } = useToast();
  const { submitAppointmentRequest } = useAdmin();
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [viewingForm, setViewingForm] = useState({ name: "", phone: "", email: "", date: "", time: "", message: "" });

  useEffect(() => {
    const loadProperty = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        const prop = await api.getPropertyBySlug(slug);
        setProperty(prop);
        setActiveImageIndex(0);

        // Load agent
        if (prop.agentId) {
          try {
            const ag = await api.getAgent(prop.agentId);
            setAgent(ag);
          } catch (error) {
            reportClientError("property details agent load", error);
          }
        }

        // Load similar properties
        try {
          const similarProps = await api.getProperties({ category: prop.category, per_page: 3 });
          setSimilar(similarProps.data.filter((p) => p.id !== prop.id).slice(0, 3));
        } catch (error) {
          reportClientError("property details similar load", error);
        }
      } catch (error) {
        reportClientError("property details load", error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-gray-200 rounded mb-4 w-64 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-48 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">Property not found</p>
            <Link to="/properties"><Button>Back to Listings</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatPrice = () => {
    const fmt = (n: number) => "GHS " + n.toLocaleString();
    if (property.salePrice) return fmt(property.salePrice);
    if (property.rentPrice) return fmt(property.rentPrice) + "/" + (property.rentPeriod || "month");
    return "Price on request";
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitAppointmentRequest({
        propertyId: property.id,
        agentId: property.agentId,
        clientName: viewingForm.name,
        clientPhone: viewingForm.phone,
        clientEmail: viewingForm.email,
        date: viewingForm.date,
        time: viewingForm.time,
        message: viewingForm.message || `I would like to schedule a viewing for ${property.title}.`,
      });
      toast({ title: "Viewing request sent", description: "An agent will confirm your appointment shortly." });
      setViewingForm({ name: "", phone: "", email: "", date: "", time: "", message: "" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send inquiry. Please try again.", variant: "destructive" });
    }
  };

  const specs = [
    property.bedrooms > 0 && { icon: Bed, label: `${property.bedrooms} Bedrooms` },
    property.bathrooms > 0 && { icon: Bath, label: `${property.bathrooms} Bathrooms` },
    property.parkingSpaces > 0 && { icon: Car, label: `${property.parkingSpaces} Parking` },
    property.landSize && { icon: Ruler, label: property.landSize },
    property.hasKitchen && { icon: Home, label: "Kitchen" },
    property.hasAC && { icon: CheckCircle, label: "Air Conditioning" },
    property.hasSecurityPost && { icon: ShieldCheck, label: "Security Post" },
    property.isGatedCommunity && { icon: ShieldCheck, label: "Gated Community" },
    property.hasWater && { icon: Droplets, label: "Water Available" },
    property.hasElectricity && { icon: Zap, label: "Electricity Available" },
  ].filter(Boolean) as { icon: React.ElementType; label: string }[];

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title={property.metaTitle || `${property.title} | ${property.area}, ${property.city}`}
        description={property.metaDescription || property.description.slice(0, 160)}
        canonicalUrl={property.canonicalUrl || undefined}
        canonicalPath={property.canonicalUrl ? undefined : `/properties/${property.slug}`}
        image={resolveMediaUrl(property.ogImage || property.images[0]) || undefined}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: property.title,
            description: property.description,
            url: typeof window !== "undefined" ? `${window.location.origin}/properties/${property.slug}` : undefined,
            image: property.images.map((image) => resolveMediaUrl(image)).filter(Boolean),
            address: {
              "@type": "PostalAddress",
              streetAddress: property.address,
              addressLocality: property.city,
              addressRegion: property.region,
              addressCountry: "GH",
            },
            offers: property.salePrice || property.rentPrice
              ? {
                  "@type": "Offer",
                  priceCurrency: "GHS",
                  price: property.salePrice ?? property.rentPrice,
                  availability: property.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
                }
              : undefined,
            numberOfRooms: property.bedrooms || undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: typeof window !== "undefined" ? window.location.origin : undefined },
              { "@type": "ListItem", position: 2, name: "Properties", item: typeof window !== "undefined" ? `${window.location.origin}/properties` : undefined },
              { "@type": "ListItem", position: 3, name: property.title, item: typeof window !== "undefined" ? `${window.location.origin}/properties/${property.slug}` : undefined },
            ],
          },
        ]}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary py-4">
          <div className="container mx-auto px-4">
            <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to listings
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="aspect-[16/9] rounded-xl bg-muted flex items-center justify-center border border-border overflow-hidden">
                {property.images[activeImageIndex] ? (
                  <img src={resolveMediaUrl(property.images[activeImageIndex])} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <MapPin className="h-16 w-16 text-muted-foreground/20" />
                )}
              </div>
              {property.images.length > 1 ? (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {property.images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`overflow-hidden rounded-xl border ${activeImageIndex === index ? "border-gold ring-2 ring-gold/40" : "border-border"}`}
                    >
                      <img src={resolveMediaUrl(image)} alt={`${property.title} view ${index + 1}`} className="aspect-[4/3] h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{property.title}</h1>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" /> {property.area}, {property.city}, {property.region}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gold">{formatPrice()}</p>
                    {property.rentAdvanceYears && <p className="text-sm text-muted-foreground">{property.rentAdvanceYears} year advance required</p>}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Property Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {specs.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                      <s.icon className="h-4 w-4 text-gold flex-shrink-0" />
                      <span className="text-foreground">{s.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                    <Home className="h-4 w-4 text-gold flex-shrink-0" />
                    <span className="text-foreground capitalize">{property.furnished.replace(/-/g, " ")}</span>
                  </div>
                </div>
              </div>

              {property.nearbyLandmarks.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Nearby Landmarks</h2>
                  <ul className="space-y-1.5">
                    {property.nearbyLandmarks.map((l, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gold" /> {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {similar.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Similar Properties</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {similar.map((p) => <PropertyCard key={p.id} property={p} />)}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {agent && (
                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-3">Listed by</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                      {agent.photo ? <img src={resolveMediaUrl(agent.photo)} alt={agent.name} className="h-full w-full rounded-full object-cover" /> : agent.name.charAt(0)}
                    </div>
                    <div>
                      <Link to={`/agents/${agent.id}`} className="font-semibold text-foreground hover:text-primary">{agent.name}</Link>
                      <p className="text-xs text-muted-foreground">{agent.specialization}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="h-4 w-4" /> {agent.phone}</a>
                    <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="h-4 w-4" /> {agent.email}</a>
                  </div>
                  <WhatsAppButton variant="inline" message={`Hello, I am interested in: ${property.title}`} className="w-full mt-4 justify-center" />
                </div>
              )}

              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-4">Request a Viewing</h3>
                <form onSubmit={handleInquiry} className="space-y-3">
                  <input value={viewingForm.name} onChange={(e) => setViewingForm({ ...viewingForm, name: e.target.value })} placeholder="Your name" required className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm" />
                  <input value={viewingForm.phone} onChange={(e) => setViewingForm({ ...viewingForm, phone: e.target.value })} placeholder="Phone number" required className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm" />
                  <input value={viewingForm.email} onChange={(e) => setViewingForm({ ...viewingForm, email: e.target.value })} placeholder="Email address" type="email" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm" />
                  <input value={viewingForm.date} onChange={(e) => setViewingForm({ ...viewingForm, date: e.target.value })} type="date" required className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm" />
                  <input value={viewingForm.time} onChange={(e) => setViewingForm({ ...viewingForm, time: e.target.value })} type="time" required className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm" />
                  <textarea value={viewingForm.message} onChange={(e) => setViewingForm({ ...viewingForm, message: e.target.value })} placeholder="Your message" rows={3} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm resize-none" />
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-secondary">Request Viewing</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
