import { ShieldCheck, Users, Eye, MapPin, Lock } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

const features = [
  { icon: ShieldCheck, title: "Verified Listings", desc: "Every property undergoes our verification process to confirm ownership, condition, and listing accuracy." },
  { icon: Users, title: "Trusted Agents", desc: "Our agents are experienced professionals who are vetted, trained, and committed to your success." },
  { icon: Eye, title: "Transparent Process", desc: "No hidden fees, no surprises. We walk you through every step from viewing to final documentation." },
  { icon: MapPin, title: "Local Market Expertise", desc: "Deep knowledge of neighbourhoods, pricing trends, and investment opportunities across Ghana." },
  { icon: Lock, title: "Secure Transactions", desc: "We partner with reputable legal professionals to ensure your property transaction is safe and fully documented." },
];

export default function WhyChooseUs() {
  const { settings } = useAdmin();

  return (
    <section className="py-16 lg:py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">Why GenieHub</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-primary-foreground">{settings.trustSectionTitle || "Why Clients Choose Us"}</h2>
          {settings.trustSectionIntro ? (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/72">
              {settings.trustSectionIntro}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-semibold text-primary-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
