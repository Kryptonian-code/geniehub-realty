import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { adminInputClass, adminLabelClass } from "@/lib/adminForms";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import type { FAQ } from "@/types";

const PAGE_SIZE = 8;
const emptyFaq: Partial<FAQ> = {
  question: "",
  answer: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminFaqs() {
  const { faqs, createFaq, updateFaq, deleteFaq, loading } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Partial<FAQ>>(emptyFaq);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesSearch = term === "" || faq.question.toLowerCase().includes(term) || faq.answer.toLowerCase().includes(term);
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && faq.isActive) ||
        (visibilityFilter === "hidden" && !faq.isActive);
      return matchesSearch && matchesVisibility;
    });
  }, [faqs, search, visibilityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFaqs.length / PAGE_SIZE));
  const paginatedFaqs = useMemo(() => filteredFaqs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredFaqs, page]);

  useEffect(() => {
    setPage(1);
  }, [search, visibilityFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyFaq);
    setShowForm(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditing(faq);
    setForm(faq);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyFaq);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.question || !form.answer) {
      toast({ title: "Missing details", description: "Please complete the question and answer fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateFaq(editing.id, form);
        toast({ title: "FAQ updated", description: "The FAQ has been saved and is ready on the website." });
      } else {
        await createFaq(form);
        toast({ title: "FAQ created", description: "The new FAQ has been added." });
      }
      closeForm();
    } catch (error) {
      toast({ title: "Unable to save FAQ", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFaq(id);
      toast({ title: "FAQ removed", description: "The FAQ has been deleted." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "This FAQ could not be removed.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">FAQs</h1>
            <p className="text-sm text-muted-foreground">
              {faqs.length} questions available
              {loading.adminData ? " | refreshing..." : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="mr-1 h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit FAQ" : "New FAQ"}</h2>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div>
              <Label className={adminLabelClass}>Question</Label>
              <input value={form.question || ""} onChange={(event) => setForm({ ...form, question: event.target.value })} placeholder="Question" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>Answer</Label>
              <textarea value={form.answer || ""} onChange={(event) => setForm({ ...form, answer: event.target.value })} rows={5} placeholder="Answer" className={`${adminInputClass} resize-none`} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className={adminLabelClass}>Sort Order</Label>
                <input value={form.sortOrder ?? 0} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} placeholder="Sort order" type="number" className={adminInputClass} />
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm">
                <input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                Show on website
              </label>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update FAQ" : "Create FAQ"}
              </Button>
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions or answers" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as "all" | "visible" | "hidden")} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All FAQs</option>
            <option value="visible">Visible only</option>
            <option value="hidden">Hidden only</option>
          </select>
        </div>

        <div className="space-y-4">
          {paginatedFaqs.map((faq) => (
            <div key={faq.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">Order {faq.sortOrder}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${faq.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                      {faq.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(faq)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit FAQ">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPendingDeleteId(faq.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete FAQ">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {paginatedFaqs.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              No FAQs match your current view.
            </div>
          )}
        </div>

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        <ConfirmActionDialog
          open={Boolean(pendingDeleteId)}
          title="Delete FAQ?"
          description="This will remove the selected question and answer from the admin dashboard and public website."
          confirmLabel="Delete FAQ"
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
