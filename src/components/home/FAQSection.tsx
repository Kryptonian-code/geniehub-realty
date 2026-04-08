import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FAQ } from "@/types";
import { reportClientError } from "@/lib/errors";

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const data = await api.getFaqs();
        setFaqs(data);
      } catch (error) {
        reportClientError("faq section load", error);
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, []);

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">Frequently Asked Questions</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Got Questions? We've Got Answers</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-14 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">Frequently Asked Questions</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Got Questions? We've Got Answers</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Find answers to common questions about buying, renting, and investing in Ghanaian property.
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          {faqs.map((faq) => (
            <Collapsible key={faq.id} open={openItems.has(faq.id)} onOpenChange={() => toggleItem(faq.id)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-card border border-border rounded-lg mb-3 hover:bg-accent/50 transition-colors text-left">
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                {openItems.has(faq.id) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  );
}
