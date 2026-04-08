import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SeoMeta from "@/components/seo/SeoMeta";

export default function Contact() {
  const { settings, offices, submitGeneralInquiry } = useAdmin();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", budget: "", preferredLocation: "", propertyInterest: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const contextLine = [
        form.propertyInterest ? `Interest: ${form.propertyInterest}` : "",
        form.preferredLocation ? `Preferred location: ${form.preferredLocation}` : "",
        form.budget ? `Budget: GHS ${form.budget}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      await submitGeneralInquiry({
        name: form.name,
        phone: form.phone,
        email: form.email,
        message: [contextLine, form.message].filter(Boolean).join("\n"),
      });

      toast({ title: "Message sent", description: "Thank you for reaching out. Our team will get back to you soon." });
      setForm({ name: "", phone: "", email: "", budget: "", preferredLocation: "", propertyInterest: "", message: "" });
    } catch (error) {
      toast({ title: "Unable to send message", description: "Please try again in a moment.", variant: "destructive" });
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title={`Contact ${settings.companyName || "GenieHub Realty"} | Ghana Property Advisors`}
        description="Speak with GenieHub Realty about buying, renting, valuation, or property investment opportunities across Ghana."
        canonicalPath="/contact"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: `Contact ${settings.companyName || "GenieHub Realty"}`,
          url: typeof window !== "undefined" ? `${window.location.origin}/contact` : undefined,
        }}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">Contact Us</h1>
            <p className="text-primary-foreground/70 mt-1 text-sm">Get in touch with our team</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-foreground mb-4">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Full name" required className={inputClass} />
                  <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Phone number" required className={inputClass} />
                  <input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="Email address" type="email" className={inputClass} />
                  <input value={form.budget} onChange={(e) => setForm({...form, budget: e.target.value})} placeholder="Budget (GHS)" className={inputClass} />
                  <input value={form.preferredLocation} onChange={(e) => setForm({...form, preferredLocation: e.target.value})} placeholder="Preferred location" className={inputClass} />
                  <select value={form.propertyInterest} onChange={(e) => setForm({...form, propertyInterest: e.target.value})} className={inputClass}>
                    <option value="">Property interest</option>
                    <option value="buy">Buying</option>
                    <option value="rent">Renting</option>
                    <option value="invest">Investing</option>
                    <option value="sell">Selling</option>
                    <option value="valuation">Property Valuation</option>
                  </select>
                </div>
                <textarea value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} placeholder="Your message" rows={5} required className={`${inputClass} resize-none`} />
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-secondary">Send Message</Button>
              </form>
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3">Contact Information</h3>
                <div className="space-y-3 text-sm">
                  {settings.companyPhone ? (
                    <a href={`tel:${settings.companyPhone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="h-4 w-4 text-gold" /> {settings.companyPhone}</a>
                  ) : null}
                  {settings.companyAltPhone ? (
                    <a href={`tel:${settings.companyAltPhone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="h-4 w-4 text-gold" /> {settings.companyAltPhone}</a>
                  ) : null}
                  {settings.companyEmail ? (
                    <a href={`mailto:${settings.companyEmail}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="h-4 w-4 text-gold" /> {settings.companyEmail}</a>
                  ) : null}
                  {settings.officeHours ? (
                    <p className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-gold" /> {settings.officeHours}</p>
                  ) : null}
                </div>
                <WhatsAppButton variant="inline" className="w-full mt-4 justify-center" />
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3">Our Offices</h3>
                <div className="space-y-4 text-sm">
                  {offices.map((office) => (
                    <div key={office.id}>
                      <p className="font-medium text-foreground">{office.name}</p>
                      <p className="text-muted-foreground flex items-start gap-1 mt-0.5"><MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> {office.address}</p>
                      <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {office.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
              {settings.mapEmbedUrl ? (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <iframe
                    src={settings.mapEmbedUrl}
                    title="Office location map"
                    className="h-72 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
