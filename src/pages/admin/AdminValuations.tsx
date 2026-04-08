import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { adminInputClass, adminLabelClass } from "@/lib/adminForms";
import AdminPagination from "@/components/admin/AdminPagination";
import type { ValuationRequest } from "@/types";

const PAGE_SIZE = 8;
const emptyValuation: Partial<ValuationRequest> = {
  location: "",
  propertyType: "",
  size: "",
  condition: "",
  expectedPrice: undefined,
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  notes: "",
  status: "new",
};

export default function AdminValuations() {
  const { valuationRequests, createValuation, updateValuation, deleteValuation, loading } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<ValuationRequest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ValuationRequest["status"] | "all">("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Partial<ValuationRequest>>(emptyValuation);

  const filteredValuations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return valuationRequests.filter((valuation) => {
      const matchesSearch =
        term === "" ||
        valuation.contactName.toLowerCase().includes(term) ||
        valuation.contactPhone.toLowerCase().includes(term) ||
        (valuation.contactEmail || "").toLowerCase().includes(term) ||
        valuation.location.toLowerCase().includes(term) ||
        valuation.propertyType.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || valuation.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [valuationRequests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredValuations.length / PAGE_SIZE));
  const paginatedValuations = useMemo(() => filteredValuations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredValuations, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyValuation);
    setShowForm(true);
  };

  const openEdit = (valuation: ValuationRequest) => {
    setEditing(valuation);
    setForm(valuation);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyValuation);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.location || !form.propertyType || !form.size || !form.condition || !form.contactName || !form.contactPhone) {
      toast({ title: "Missing details", description: "Please complete the valuation details before saving.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateValuation(editing.id, form);
        toast({ title: "Valuation updated", description: "The valuation request has been saved." });
      } else {
        await createValuation(form);
        toast({ title: "Valuation created", description: "The valuation request has been added." });
      }
      closeForm();
    } catch (_error) {
      toast({ title: "Unable to save valuation", description: "Please review the details and try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteValuation(id);
      toast({ title: "Valuation removed", description: "The valuation request has been deleted." });
    } catch (_error) {
      toast({ title: "Delete failed", description: "This valuation request could not be removed right now.", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Valuation Requests</h1>
            <p className="text-sm text-muted-foreground">
              {valuationRequests.length} valuation requests
              {loading.adminData ? " | refreshing..." : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="mr-1 h-4 w-4" />
            Add Valuation
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Valuation" : "New Valuation"}</h2>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className={adminLabelClass}>Property location</Label>
                <input value={form.location || ""} onChange={(event) => setForm({ ...form, location: event.target.value })} className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Property type</Label>
                <input value={form.propertyType || ""} onChange={(event) => setForm({ ...form, propertyType: event.target.value })} className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Size</Label>
                <input value={form.size || ""} onChange={(event) => setForm({ ...form, size: event.target.value })} className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Condition</Label>
                <input value={form.condition || ""} onChange={(event) => setForm({ ...form, condition: event.target.value })} className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Expected price</Label>
                <input value={form.expectedPrice || ""} onChange={(event) => setForm({ ...form, expectedPrice: event.target.value ? Number(event.target.value) : undefined })} type="number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Status</Label>
                <select value={form.status || "new"} onChange={(event) => setForm({ ...form, status: event.target.value as ValuationRequest["status"] })} className={adminInputClass}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>Contact name</Label>
                <input value={form.contactName || ""} onChange={(event) => setForm({ ...form, contactName: event.target.value })} className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Contact phone</Label>
                <input value={form.contactPhone || ""} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} className={adminInputClass} />
              </div>
              <div className="md:col-span-2">
                <Label className={adminLabelClass}>Contact email</Label>
                <input value={form.contactEmail || ""} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} type="email" className={adminInputClass} />
              </div>
            </div>

            <div>
              <Label className={adminLabelClass}>Notes</Label>
              <textarea value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} className={`${adminInputClass} resize-none`} />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update Valuation" : "Create Valuation"}
              </Button>
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by contact, location, or property type" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ValuationRequest["status"] | "all")} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {paginatedValuations.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            No valuation requests match your current view.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="p-3 font-medium text-muted-foreground">Contact</th>
                      <th className="p-3 font-medium text-muted-foreground">Property</th>
                      <th className="p-3 font-medium text-muted-foreground">Expected price</th>
                      <th className="p-3 font-medium text-muted-foreground">Status</th>
                      <th className="p-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedValuations.map((valuation) => (
                      <tr key={valuation.id} className="border-b border-border/50 align-top">
                        <td className="p-3">
                          <p className="font-medium text-foreground">{valuation.contactName}</p>
                          <p className="text-xs text-muted-foreground">{valuation.contactPhone}</p>
                          <p className="text-xs text-muted-foreground">{valuation.contactEmail || "No email provided"}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <p>{valuation.location}</p>
                          <p className="mt-1 text-xs">{valuation.propertyType} | {valuation.size}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {valuation.expectedPrice ? `GHS ${valuation.expectedPrice.toLocaleString()}` : "Not provided"}
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium capitalize text-accent-foreground">
                            {valuation.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(valuation)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit valuation">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(valuation.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete valuation">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
