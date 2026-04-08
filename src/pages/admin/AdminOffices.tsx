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
import type { Office } from "@/types";

const PAGE_SIZE = 8;
const emptyOffice: Partial<Office> = {
  name: "",
  city: "",
  address: "",
  phone: "",
  email: "",
};

export default function AdminOffices() {
  const { offices, createOffice, updateOffice, deleteOffice, loading } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Office | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Partial<Office>>(emptyOffice);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredOffices = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return offices;
    return offices.filter((office) =>
      [office.name, office.city, office.address, office.phone || "", office.email || ""].some((value) => value.toLowerCase().includes(term)),
    );
  }, [offices, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOffices.length / PAGE_SIZE));
  const paginatedOffices = useMemo(() => filteredOffices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredOffices, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyOffice);
    setShowForm(true);
  };

  const openEdit = (office: Office) => {
    setEditing(office);
    setForm(office);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyOffice);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.city || !form.address) {
      toast({ title: "Missing details", description: "Please complete the office name, city, and address.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateOffice(editing.id, form);
        toast({ title: "Office updated", description: "Office details have been saved." });
      } else {
        await createOffice(form);
        toast({ title: "Office created", description: "The new office is now available on the public site." });
      }
      closeForm();
    } catch (error) {
      toast({ title: "Unable to save office", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOffice(id);
      toast({ title: "Office removed", description: "The office has been deleted." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "This office could not be removed.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Offices</h1>
            <p className="text-sm text-muted-foreground">
              {offices.length} office locations
              {loading.adminData ? " | refreshing..." : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="mr-1 h-4 w-4" />
            Add Office
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Office" : "New Office"}</h2>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div><Label className={adminLabelClass}>Office Name</Label><input value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Office name" className={adminInputClass} /></div>
              <div><Label className={adminLabelClass}>City</Label><input value={form.city || ""} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="City" className={adminInputClass} /></div>
              <div><Label className={adminLabelClass}>Phone</Label><input value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" className={adminInputClass} /></div>
              <div><Label className={adminLabelClass}>Email</Label><input value={form.email || ""} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" className={adminInputClass} /></div>
            </div>

            <div>
              <Label className={adminLabelClass}>Address</Label>
              <textarea value={form.address || ""} onChange={(event) => setForm({ ...form, address: event.target.value })} rows={3} placeholder="Office address" className={`${adminInputClass} resize-none`} />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update Office" : "Create Office"}
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
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search offices by name, city, or address" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <p className="text-sm text-muted-foreground">{filteredOffices.length} offices</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {paginatedOffices.map((office) => (
            <div key={office.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{office.name}</h3>
                  <p className="text-sm text-muted-foreground">{office.city}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{office.address}</p>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>{office.phone}</p>
                    <p>{office.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(office)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit office">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPendingDeleteId(office.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete office">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {paginatedOffices.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              No offices match your current view.
            </div>
          )}
        </div>

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        <ConfirmActionDialog
          open={Boolean(pendingDeleteId)}
          title="Delete office?"
          description="This will remove the office from contact pages and branch assignment lists. Agents linked to the office will remain but lose the office connection."
          confirmLabel="Delete Office"
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
