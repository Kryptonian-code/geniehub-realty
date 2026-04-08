import { Star } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { resolveMediaUrl } from "@/lib/media";

export default function Testimonials() {
  const { testimonials } = useAdmin();
  const visibleTestimonials = testimonials.filter((item) => item.isActive !== false).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  if (visibleTestimonials.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">Client stories</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">What Our Clients Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {visibleTestimonials.slice(0, 3).map((t) => (
            <div key={t.id} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? "text-gold fill-gold" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.content}"</p>
              <div className="flex items-center gap-3">
                {t.photo ? <img src={resolveMediaUrl(t.photo)} alt={t.name} className="h-10 w-10 rounded-full object-cover" /> : null}
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
