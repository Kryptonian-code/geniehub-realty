import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { useAdmin } from "@/contexts/AdminContext";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "@/lib/media";
import SeoMeta from "@/components/seo/SeoMeta";

export default function Blog() {
  const { blogPosts, settings } = useAdmin();
  const published = blogPosts.filter((p) => p.published);

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title={`Property News and Market Insights | ${settings.companyName || "GenieHub Realty"}`}
        description="Read practical Ghana real estate insights, buyer guidance, landlord advice, and investment updates from GenieHub Realty."
        canonicalPath="/blog"
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">Blog</h1>
            <p className="text-primary-foreground/70 mt-1 text-sm">Guides, insights, and advice on Ghana real estate</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          {published.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No articles published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {published.map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow">
                  <div className="aspect-[16/9] bg-muted">
                    {post.coverImage ? <img src={resolveMediaUrl(post.coverImage)} alt={post.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-medium text-gold uppercase">{post.category.replace(/-/g, " ")}</span>
                    <h2 className="font-semibold text-foreground mt-1 mb-2 line-clamp-2 group-hover:text-primary">{post.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    <p className="text-xs text-muted-foreground mt-3">{new Date(post.createdAt).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
