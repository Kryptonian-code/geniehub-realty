import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, Star, Trash2, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { adminHelpTextClass, adminInputClass, adminLabelClass } from "@/lib/adminForms";
import { resolveMediaUrl } from "@/lib/media";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import type { Testimonial } from "@/types";

const PAGE_SIZE = 8;
const emptyTestimonial: Partial<Testimonial> = {
  name: "",
  role: "",
  photo: "",
  content: "",
  rating: 5,
  sortOrder: 0,
  isActive: true,
};

export default function AdminTestimonials() {
  const { testimonials, createTestimonial, updateTestimonial, deleteTestimonial } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Partial<Testimonial>>(emptyTestimonial);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredTestimonials = useMemo(() => {
    const term = search.trim().toLowerCase();
    return testimonials.filter((testimonial) => {
      const matchesSearch =
        term === "" ||
        testimonial.name.toLowerCase().includes(term) ||
        (testimonial.role || "").toLowerCase().includes(term) ||
        testimonial.content.toLowerCase().includes(term);
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && testimonial.isActive) ||
        (visibilityFilter === "hidden" && !testimonial.isActive);
      return matchesSearch && matchesVisibility;
    });
  }, [testimonials, search, visibilityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTestimonials.length / PAGE_SIZE));
  const paginatedTestimonials = useMemo(() => filteredTestimonials.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredTestimonials, page]);

  useEffect(() => {
    setPage(1);
  }, [search, visibilityFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyTestimonial);
    setShowForm(true);
  };

  const openEdit = (testimonial: Testimonial) => {
    setEditing(testimonial);
    setForm(testimonial);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyTestimonial);
    setShowForm(false);
    setUploadingPhoto(false);
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const response = await api.uploadMedia(file, "agent");
      setForm((prev) => ({ ...prev, photo: response.path }));
      toast({ title: "Photo uploaded", description: "The client photo is ready." });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The photo could not be uploaded right now.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.content) {
      toast({ title: "Missing details", description: "Please complete the client name and testimonial message.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateTestimonial(editing.id, form);
        toast({ title: "Testimonial updated", description: "The client story has been saved." });
      } else {
        await createTestimonial(form);
        toast({ title: "Testimonial created", description: "The testimonial is now available for the public website." });
      }
      closeForm();
    } catch (error) {
      toast({
        title: "Unable to save testimonial",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTestimonial(id);
      toast({ title: "Testimonial removed", description: "The testimonial has been deleted." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "This testimonial could not be removed right now.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Testimonials</h1>
            <p className="text-sm text-muted-foreground">Manage social proof shown on the homepage and trust sections.</p>
          </div>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="mr-1 h-4 w-4" />
            Add Testimonial
          </Button>
        </div>

        {showForm && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Testimonial" : "New Testimonial"}</h2>
                <p className="text-sm text-muted-foreground">Use real client stories that strengthen trust and conversion.</p>
              </div>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div><Label className={adminLabelClass}>Client name</Label><input value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Client name" className={adminInputClass} /></div>
              <div><Label className={adminLabelClass}>Client role or context</Label><input value={form.role || ""} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="Eg. Home buyer in East Legon" className={adminInputClass} /></div>
              <div>
                <Label className={adminLabelClass}>Rating</Label>
                <select value={form.rating ?? 5} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} className={adminInputClass}>
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating > 1 ? "s" : ""}</option>)}
                </select>
              </div>
              <div><Label className={adminLabelClass}>Display order</Label><input value={form.sortOrder ?? 0} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} type="number" className={adminInputClass} /></div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className={adminLabelClass}>Client photo</Label>
                  <p className={adminHelpTextClass}>Optional. Add a real photo when you have one.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  {uploadingPhoto ? "Uploading..." : form.photo ? "Replace photo" : "Upload photo"}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                </label>
              </div>
              {form.photo ? (
                <div className="flex items-start gap-4 rounded-xl border border-border bg-background p-3">
                  <img src={resolveMediaUrl(form.photo)} alt={form.name || "Client"} className="h-20 w-20 rounded-xl object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, photo: "" })} className="text-sm font-medium text-destructive">Remove photo</button>
                </div>
              ) : null}
            </div>

            <div><Label className={adminLabelClass}>Testimonial message</Label><textarea value={form.content || ""} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={5} className={`${adminInputClass} resize-none`} /></div>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm font-medium text-foreground">
              <input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              Show this testimonial on the website
            </label>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || uploadingPhoto} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update Testimonial" : "Create Testimonial"}
              </Button>
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search testimonials by client name or message" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as "all" | "visible" | "hidden")} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All testimonials</option>
            <option value="visible">Visible only</option>
            <option value="hidden">Hidden only</option>
          </select>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {paginatedTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gold">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className={`h-4 w-4 ${index < testimonial.rating ? "fill-gold" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <h3 className="font-semibold text-foreground">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm text-foreground">{testimonial.content}</p>
                  <p className="text-xs text-muted-foreground">Order {testimonial.sortOrder ?? 0} | {testimonial.isActive ? "Visible" : "Hidden"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(testimonial)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit testimonial"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setPendingDeleteId(testimonial.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete testimonial"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {paginatedTestimonials.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No testimonials match your current view.</div>
          )}
        </div>

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        <ConfirmActionDialog
          open={Boolean(pendingDeleteId)}
          title="Delete testimonial?"
          description="This will remove the client testimonial from both the admin dashboard and the public trust sections."
          confirmLabel="Delete Testimonial"
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
