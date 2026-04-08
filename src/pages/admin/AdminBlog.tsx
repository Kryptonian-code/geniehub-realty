import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { adminHelpTextClass, adminInputClass, adminLabelClass } from "@/lib/adminForms";
import { resolveMediaUrl } from "@/lib/media";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import type { BlogPost } from "@/types";

const PAGE_SIZE = 8;
const emptyPost: Partial<BlogPost> = {
  title: "",
  excerpt: "",
  content: "",
  category: "market-insights",
  coverImage: "",
  author: "GenieHub Realty",
  metaTitle: "",
  metaDescription: "",
  published: true,
};

export default function AdminBlog() {
  const { blogPosts, createBlogPost, updateBlogPost, deleteBlogPost, loading } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Partial<BlogPost>>(emptyPost);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const posts = useMemo(() => [...blogPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [blogPosts]);
  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesSearch =
        term === "" ||
        post.title.toLowerCase().includes(term) ||
        post.category.toLowerCase().includes(term) ||
        post.author.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && post.published) ||
        (statusFilter === "draft" && !post.published);
      return matchesSearch && matchesStatus;
    });
  }, [posts, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const paginatedPosts = useMemo(() => filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredPosts, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPost);
    setShowForm(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm(post);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyPost);
    setShowForm(false);
    setUploadingCover(false);
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const response = await api.uploadMedia(file, "blog");
      setForm((prev) => ({ ...prev, coverImage: response.path }));
      toast({ title: "Cover image uploaded", description: "The article now has a cover image." });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The cover image could not be uploaded right now.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.content || !form.category) {
      toast({ title: "Missing details", description: "Please complete the title, category, and content fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateBlogPost(editing.id, form);
        toast({ title: "Article updated", description: "The blog article has been saved." });
      } else {
        await createBlogPost(form);
        toast({ title: "Article created", description: "The new blog article is now available." });
      }
      closeForm();
    } catch (error) {
      toast({ title: "Unable to save article", description: error instanceof Error ? error.message : "Please review the article details and try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBlogPost(id);
      toast({ title: "Article removed", description: "The blog article has been deleted." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "This article could not be removed right now.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Blog</h1>
            <p className="text-sm text-muted-foreground">
              {posts.length} articles in the database
              {loading.adminData ? " | refreshing..." : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="mr-1 h-4 w-4" />
            Add Article
          </Button>
        </div>

        {showForm && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Article" : "New Article"}</h2>
                <p className="text-sm text-muted-foreground">Write articles your team can confidently publish without touching code or links.</p>
              </div>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div><Label className={adminLabelClass}>Article title</Label><input value={form.title || ""} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Article title" className={adminInputClass} /></div>
              <div><Label className={adminLabelClass}>Category</Label><input value={form.category || ""} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" className={adminInputClass} /></div>
              <div><Label className={adminLabelClass}>Author name</Label><input value={form.author || ""} onChange={(event) => setForm({ ...form, author: event.target.value })} placeholder="Author name" className={adminInputClass} /></div>
              <div><Label className={adminLabelClass}>Search result title</Label><input value={form.metaTitle || ""} onChange={(event) => setForm({ ...form, metaTitle: event.target.value })} placeholder="Optional shorter title for Google" className={adminInputClass} /></div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className={adminLabelClass}>Cover image</Label>
                  <p className={adminHelpTextClass}>Upload the main article image. It appears on the blog page and the article header.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  {uploadingCover ? "Uploading..." : form.coverImage ? "Replace image" : "Upload image"}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploadingCover} />
                </label>
              </div>
              {form.coverImage ? (
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <img src={resolveMediaUrl(form.coverImage)} alt={form.title || "Article cover"} className="aspect-[16/9] w-full object-cover" />
                  <div className="p-3">
                    <button type="button" onClick={() => setForm({ ...form, coverImage: "" })} className="text-sm font-medium text-destructive">Remove image</button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">No cover image uploaded yet.</div>
              )}
            </div>

            <div><Label className={adminLabelClass}>Short intro</Label><textarea value={form.excerpt || ""} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} rows={3} placeholder="A short summary readers will see before opening the article" className={`${adminInputClass} resize-none`} /></div>
            <div><Label className={adminLabelClass}>Search result description</Label><textarea value={form.metaDescription || ""} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} rows={3} placeholder="Optional description for search engines" className={`${adminInputClass} resize-none`} /></div>
            <div><Label className={adminLabelClass}>Article content</Label><textarea value={form.content || ""} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={10} placeholder="Write the full article here" className={`${adminInputClass} resize-none`} /></div>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm font-medium text-foreground">
              <input type="checkbox" checked={Boolean(form.published)} onChange={(event) => setForm({ ...form, published: event.target.checked })} />
              Publish this article on the website
            </label>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || uploadingCover} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update Article" : "Create Article"}
              </Button>
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles by title, author, or category" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "published" | "draft")} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All articles</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        <div className="space-y-4">
          {paginatedPosts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">{post.category}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{post.published ? "Published" : "Draft"}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                  <p className="text-xs text-muted-foreground">{post.author} | {new Date(post.createdAt).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(post)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit article"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setPendingDeleteId(post.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete article"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {paginatedPosts.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No blog articles match your current view.</div>
          )}
        </div>

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        <ConfirmActionDialog
          open={Boolean(pendingDeleteId)}
          title="Delete article?"
          description="This will remove the article from the admin dashboard, blog listing, and public article page."
          confirmLabel="Delete Article"
          onOpenChange={(open) => {
            if (!open) setPendingDeleteId(null);
          }}
          onConfirm={() => {
            if (pendingDeleteId) {
              void handleDelete(pendingDeleteId);
            }
            setPendingDeleteId(null);
          }}
        />
      </div>
    </AdminLayout>
  );
}
