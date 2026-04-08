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
import type { Agent } from "@/types";

const emptyAgent: Partial<Agent> = {
  name: "",
  photo: "",
  phone: "",
  email: "",
  bio: "",
  specialization: "",
  experienceYears: 0,
  officeId: "",
};
const PAGE_SIZE = 9;

export default function AdminAgents() {
  const { agents, offices, createAgent, updateAgent, deleteAgent, loading } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Agent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Partial<Agent>>(emptyAgent);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const filteredAgents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesSearch =
        term === "" ||
        agent.name.toLowerCase().includes(term) ||
        agent.phone.toLowerCase().includes(term) ||
        agent.email.toLowerCase().includes(term) ||
        (agent.office_name || "").toLowerCase().includes(term) ||
        (agent.bio || "").toLowerCase().includes(term);
      const matchesOffice = officeFilter === "all" || agent.officeId === officeFilter;
      return matchesSearch && matchesOffice;
    });
  }, [agents, search, officeFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));
  const paginatedAgents = useMemo(() => filteredAgents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredAgents, page]);

  useEffect(() => {
    setPage(1);
  }, [search, officeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAgent);
    setShowForm(true);
  };

  const openEdit = (agent: Agent) => {
    setEditing(agent);
    setForm(agent);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyAgent);
    setShowForm(false);
    setUploadingPhoto(false);
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await api.uploadMedia(file, "agent");
      setForm((prev) => ({ ...prev, photo: response.path }));
      toast({ title: "Photo uploaded", description: "The agent profile photo is ready." });
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
    if (!form.name || !form.phone || !form.email || !form.bio) {
      toast({ title: "Missing details", description: "Please complete the required agent fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateAgent(editing.id, form);
        toast({ title: "Agent updated", description: "Agent details have been saved." });
      } else {
        await createAgent(form);
        toast({ title: "Agent added", description: "The new agent is now available for property assignment." });
      }
      closeForm();
    } catch (error) {
      toast({
        title: "Unable to save agent",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgent(id);
      toast({ title: "Agent removed", description: "The agent profile has been deleted." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "This agent could not be removed right now.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agents</h1>
            <p className="text-sm text-muted-foreground">
              {agents.length} active profiles
              {loading.adminData ? " | refreshing..." : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="mr-1 h-4 w-4" />
            Add Agent
          </Button>
        </div>

        {showForm && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Agent" : "New Agent"}</h2>
                <p className="text-sm text-muted-foreground">Add a clear profile for each agent so clients can trust who they are speaking to.</p>
              </div>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className={adminLabelClass}>Full name</Label>
                <input value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Phone number</Label>
                <input value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Email address</Label>
                <input value={form.email || ""} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email address" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Specialization</Label>
                <input value={form.specialization || ""} onChange={(event) => setForm({ ...form, specialization: event.target.value })} placeholder="Eg. Residential sales and diaspora clients" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Years of experience</Label>
                <input
                  value={form.experienceYears ?? 0}
                  onChange={(event) => setForm({ ...form, experienceYears: Number(event.target.value) })}
                  placeholder="Years of experience"
                  type="number"
                  className={adminInputClass}
                />
              </div>
              <div>
                <Label className={adminLabelClass}>Office</Label>
                <select value={form.officeId || ""} onChange={(event) => setForm({ ...form, officeId: event.target.value })} className={adminInputClass}>
                  <option value="">Assign office</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className={adminLabelClass}>Profile photo</Label>
                  <p className={adminHelpTextClass}>Upload a professional headshot. This photo appears on the public agent pages.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  {uploadingPhoto ? "Uploading..." : form.photo ? "Replace photo" : "Upload photo"}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                </label>
              </div>

              {form.photo ? (
                <div className="flex items-start gap-4 rounded-xl border border-border bg-background p-3">
                  <img src={resolveMediaUrl(form.photo)} alt={form.name || "Agent"} className="h-24 w-24 rounded-xl object-cover" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Current photo</p>
                    <button type="button" onClick={() => setForm({ ...form, photo: "" })} className="text-sm font-medium text-destructive">
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                  No photo uploaded yet.
                </div>
              )}
            </div>

            <div>
              <Label className={adminLabelClass}>Professional biography</Label>
              <textarea
                value={form.bio || ""}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                placeholder="Describe the agent's background, market focus, and client strengths."
                rows={4}
                className={`${adminInputClass} resize-none`}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || uploadingPhoto} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update Agent" : "Create Agent"}
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
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by agent name, phone, email, office, or bio"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm"
            />
          </div>
          <select value={officeFilter} onChange={(event) => setOfficeFilter(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All offices</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            {agents.length === 0 ? "No agents have been added yet." : "No agents match your current filters."}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedAgents.map((agent) => (
                <div key={agent.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground">
                        {agent.photo ? (
                          <img src={resolveMediaUrl(agent.photo)} alt={agent.name} className="h-full w-full object-cover" />
                        ) : (
                          agent.name.charAt(0)
                        )}
                      </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.specialization || agent.office_name || "No office assigned"}</p>
                  </div>
                </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(agent)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit agent">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setPendingDeleteId(agent.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete agent">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{agent.bio}</p>
                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    <p>{agent.phone}</p>
                    <p>{agent.email}</p>
                    <p>{agent.experienceYears} years experience</p>
                  </div>
                </div>
              ))}
            </div>
            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
        <ConfirmActionDialog
          open={Boolean(pendingDeleteId)}
          title="Delete agent profile?"
          description="This will remove the agent profile from the admin dashboard and public website. Existing listings will remain available without that profile attached."
          confirmLabel="Delete Agent"
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
