import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { resolveMediaUrl } from "@/lib/media";

export default function BlogPreview() {
  const { blogPosts } = useAdmin();
  const published = blogPosts.filter((p) => p.published).slice(0, 3);
  if (published.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-1">Insights and guides</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">From Our Blog</h2>
          </div>
          <Link to="/blog" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-gold transition-colors">
            All articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {published.map((post) => (
            <Link to={`/blog/${post.slug}`} key={post.id} className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow">
              <div className="aspect-[16/9] bg-muted">
                {post.coverImage ? <img src={resolveMediaUrl(post.coverImage)} alt={post.title} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-gold uppercase">{post.category.replace(/-/g, " ")}</span>
                <h3 className="font-semibold text-foreground mt-1 mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
