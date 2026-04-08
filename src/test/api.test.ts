import { describe, expect, it } from "vitest";
import { inferApiBase, normalizeBlogPost } from "@/lib/api";

describe("inferApiBase", () => {
  it("targets the XAMPP backend during local Vite development", () => {
    expect(
      inferApiBase({
        protocol: "http:",
        hostname: "localhost",
        port: "5173",
        pathname: "/",
        origin: "http://localhost:5173",
      }),
    ).toBe("http://localhost/geniehub-realty/backend/api");
  });

  it("targets the deployed backend folder in production", () => {
    expect(
      inferApiBase({
        protocol: "https:",
        hostname: "geniehub.example.com",
        port: "",
        pathname: "/blog",
        origin: "https://geniehub.example.com",
      }),
    ).toBe("https://geniehub.example.com/backend/api");
  });
});

describe("normalizeBlogPost", () => {
  it("maps backend blog payloads into frontend blog posts", () => {
    const post = normalizeBlogPost({
      id: 7,
      title: "Market Update",
      slug: "market-update",
      excerpt: "Short summary",
      content: "Long form content",
      category: "market-insights",
      cover_image: "/uploads/blog.jpg",
      author: "GenieHub Realty",
      meta_title: "Meta Title",
      meta_description: "Meta Description",
      is_published: 1,
      created_at: "2026-04-08 10:00:00",
    });

    expect(post).toMatchObject({
      id: "7",
      title: "Market Update",
      slug: "market-update",
      excerpt: "Short summary",
      coverImage: "/uploads/blog.jpg",
      author: "GenieHub Realty",
      published: true,
      createdAt: "2026-04-08 10:00:00",
    });
  });
});
