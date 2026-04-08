import Hero from "@/components/home/Hero";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import PopularLocations from "@/components/home/PopularLocations";
import PropertyCategories from "@/components/home/PropertyCategories";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import CTASection from "@/components/home/CTASection";
import Testimonials from "@/components/home/Testimonials";
import BlogPreview from "@/components/home/BlogPreview";
import FAQSection from "@/components/home/FAQSection";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import SeoMeta from "@/components/seo/SeoMeta";
import { useAdmin } from "@/contexts/AdminContext";

export default function Index() {
  const { settings, faqs } = useAdmin();
  const title = settings.seoTitle || `${settings.companyName} | Trusted Ghana Real Estate`;
  const description =
    settings.seoDescription || settings.heroSubtitle || "Find verified homes, apartments, land, and commercial property across Ghana with GenieHub Realty.";

  const structuredData: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.companyName || "GenieHub Realty",
      telephone: settings.companyPhone || undefined,
      email: settings.companyEmail || undefined,
      url: typeof window !== "undefined" ? window.location.origin : undefined,
      sameAs: Object.values(settings.socialLinks).filter(Boolean),
      openingHours: settings.officeHours || undefined,
    },
  ];

  if (faqs.length > 0) {
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return (
    <div className="min-h-screen">
      <SeoMeta title={title} description={description} canonicalPath="/" structuredData={structuredData} />
      <Header />
      <Hero />
      <FeaturedProperties />
      <PopularLocations />
      <PropertyCategories />
      <WhyChooseUs />
      <CTASection />
      <Testimonials />
      <FAQSection />
      <BlogPreview />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
