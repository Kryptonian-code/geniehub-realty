import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media";
import type { BlogPost as BlogPostType } from "@/types";
import SeoMeta from "@/components/seo/SeoMeta";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await api.getBlogPostBySlug(slug);
        setPost(response);
      } catch (error) {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    void loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading article...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">Article not found</p>
            <Link to="/blog"><Button>Back to Blog</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title={post.metaTitle || `${post.title} | GenieHub Realty Blog`}
        description={post.metaDescription || post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        image={post.coverImage ? resolveMediaUrl(post.coverImage) : undefined}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.metaDescription || post.excerpt,
          image: post.coverImage ? [resolveMediaUrl(post.coverImage)] : undefined,
          author: {
            "@type": "Person",
            name: post.author,
          },
          datePublished: post.createdAt,
          mainEntityOfPage: typeof window !== "undefined" ? `${window.location.origin}/blog/${post.slug}` : undefined,
        }}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary py-4">
          <div className="container mx-auto px-4">
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to blog
            </Link>
          </div>
        </div>
        <article className="container mx-auto max-w-3xl px-4 py-10">
          <span className="text-xs font-medium uppercase text-gold">{post.category.replace(/-/g, " ")}</span>
          <h1 className="mt-2 mb-3 text-2xl font-bold text-foreground lg:text-3xl">{post.title}</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            By {post.author} | {new Date(post.createdAt).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          {post.coverImage ? (
            <img src={resolveMediaUrl(post.coverImage)} alt={post.title} className="mb-8 aspect-[16/9] w-full rounded-2xl object-cover" />
          ) : null}
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
            {post.content.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph.slice(0, 60)}>{paragraph}</p>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
