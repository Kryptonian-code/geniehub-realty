import { useEffect } from "react";

interface SeoMetaProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  canonicalPath?: string;
  image?: string;
  type?: "website" | "article";
  robots?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

export default function SeoMeta({ title, description, canonicalUrl, canonicalPath, image, type = "website", robots, structuredData }: SeoMetaProps) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const resolvedCanonical = canonicalUrl || (canonicalPath ? `${window.location.origin}${canonicalPath}` : window.location.href);
    const resolvedImage = image || "";

    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description", content: description || "" });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots || "index,follow" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description || "" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: resolvedCanonical });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description || "" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: resolvedImage ? "summary_large_image" : "summary" });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: resolvedCanonical });

    if (resolvedImage) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: resolvedImage });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: resolvedImage });
    }

    const scriptId = "seo-structured-data";
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.getElementById(scriptId);
      if (script) {
        script.remove();
      }
    };
  }, [title, description, canonicalUrl, canonicalPath, image, type, robots, structuredData]);

  return null;
}
