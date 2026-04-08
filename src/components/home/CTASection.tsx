import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";

export default function CTASection() {
  const { settings } = useAdmin();

  return (
    <section className="py-16 lg:py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">List Your Property</h3>
            <p className="text-sm text-muted-foreground mb-5">Reach thousands of verified buyers and tenants across Ghana by listing your property with GenieHub.</p>
            <Link to="/contact"><Button className="bg-primary text-primary-foreground hover:bg-secondary">Get Started</Button></Link>
          </div>
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Book a Viewing</h3>
            <p className="text-sm text-muted-foreground mb-5">Schedule a visit to any property at a time that works for you. Our agents will be there to guide you.</p>
            <Link to="/properties"><Button className="bg-gold text-accent-foreground hover:bg-gold/90">Browse Properties</Button></Link>
          </div>
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Talk to an Agent</h3>
            <p className="text-sm text-muted-foreground mb-5">Not sure where to start? Our team is ready to help you find the right property for your needs.</p>
            <Link to={settings.secondaryCtaLink || "/agents"}>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                {settings.secondaryCtaLabel || "Meet the Team"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
