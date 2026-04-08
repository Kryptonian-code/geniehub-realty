import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SeoMeta from "@/components/seo/SeoMeta";

export default function Valuation() {
  const { submitValuationRequest, settings } = useAdmin();
  const { toast } = useToast();
  const [form, setForm] = useState({ location: "", propertyType: "", size: "", condition: "", expectedPrice: "", contactName: "", contactPhone: "", contactEmail: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitValuationRequest({
        location: form.location,
        propertyType: form.propertyType,
        size: form.size,
        condition: form.condition,
        expectedPrice: form.expectedPrice ? Number(form.expectedPrice) : undefined,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail || undefined,
      });

      toast({ title: "Valuation request submitted", description: "Our team will review and contact you within 48 hours." });
      setForm({ location: "", propertyType: "", size: "", condition: "", expectedPrice: "", contactName: "", contactPhone: "", contactEmail: "" });
    } catch (error) {
      toast({ title: "Submission failed", description: "Please try again shortly.", variant: "destructive" });
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title={`Property Valuation in Ghana | ${settings.companyName || "GenieHub Realty"}`}
        description="Request a professional property valuation in Ghana for sale planning, investment decisions, and market guidance."
        canonicalPath="/valuation"
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">Property Valuation</h1>
            <p className="text-primary-foreground/70 mt-1 text-sm">Get an expert assessment of your property's market value</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10 max-w-2xl">
          <div className="bg-card rounded-xl border border-border p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-foreground mb-1">Request a Valuation</h2>
            <p className="text-sm text-muted-foreground mb-6">Fill in the details below and our valuation team will contact you with an assessment.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="Property location" required className={inputClass} />
                <select value={form.propertyType} onChange={(e) => setForm({...form, propertyType: e.target.value})} required className={inputClass}>
                  <option value="">Property type</option>
                  {["House","Apartment","Duplex","Land","Office Space","Shop","Warehouse"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={form.size} onChange={(e) => setForm({...form, size: e.target.value})} placeholder="Size (e.g. 3 bedrooms, 100x100 ft)" required className={inputClass} />
                <select value={form.condition} onChange={(e) => setForm({...form, condition: e.target.value})} required className={inputClass}>
                  <option value="">Property condition</option>
                  <option value="new">Newly Built</option>
                  <option value="good">Good Condition</option>
                  <option value="fair">Fair Condition</option>
                  <option value="needs-renovation">Needs Renovation</option>
                  <option value="under-construction">Under Construction</option>
                </select>
                <input value={form.expectedPrice} onChange={(e) => setForm({...form, expectedPrice: e.target.value})} placeholder="Expected price (GHS, optional)" className={inputClass} />
              </div>
              <hr className="border-border" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input value={form.contactName} onChange={(e) => setForm({...form, contactName: e.target.value})} placeholder="Your name" required className={inputClass} />
                <input value={form.contactPhone} onChange={(e) => setForm({...form, contactPhone: e.target.value})} placeholder="Phone number" required className={inputClass} />
                <input value={form.contactEmail} onChange={(e) => setForm({...form, contactEmail: e.target.value})} placeholder="Email address" type="email" className={`${inputClass} sm:col-span-2`} />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-secondary">Submit Valuation Request</Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
