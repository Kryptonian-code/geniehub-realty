import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { adminInputClass, adminLabelClass } from "@/lib/adminForms";
import AdminPagination from "@/components/admin/AdminPagination";
import type { Appointment } from "@/types";

const PAGE_SIZE = 8;
const emptyAppointment: Partial<Appointment> = {
  propertyId: "",
  agentId: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  date: "",
  time: "",
  message: "",
  status: "pending",
};

export default function AdminAppointments() {
  const { appointments, properties, agents, createAppointment, updateAppointment, deleteAppointment, loading } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Appointment["status"] | "all">("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Partial<Appointment>>(emptyAppointment);

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesSearch =
        term === "" ||
        appointment.clientName.toLowerCase().includes(term) ||
        appointment.clientPhone.toLowerCase().includes(term) ||
        (appointment.clientEmail || "").toLowerCase().includes(term) ||
        (appointment.propertyTitle || "").toLowerCase().includes(term) ||
        (appointment.agentName || "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const paginatedAppointments = useMemo(() => filteredAppointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredAppointments, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAppointment);
    setShowForm(true);
  };

  const openEdit = (appointment: Appointment) => {
    setEditing(appointment);
    setForm(appointment);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyAppointment);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.clientName || !form.clientPhone || !form.date || !form.time) {
      toast({ title: "Missing details", description: "Please complete the client and appointment details.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateAppointment(editing.id, form);
        toast({ title: "Appointment updated", description: "The viewing appointment has been saved." });
      } else {
        await createAppointment(form);
        toast({ title: "Appointment created", description: "The viewing appointment has been added." });
      }
      closeForm();
    } catch (_error) {
      toast({ title: "Unable to save appointment", description: "Please review the details and try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
      toast({ title: "Appointment removed", description: "The viewing appointment has been deleted." });
    } catch (_error) {
      toast({ title: "Delete failed", description: "This appointment could not be removed right now.", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
            <p className="text-sm text-muted-foreground">
              {appointments.length} viewing requests
              {loading.adminData ? " | refreshing..." : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="mr-1 h-4 w-4" />
            Add Appointment
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Appointment" : "New Appointment"}</h2>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className={adminLabelClass}>Property</Label>
                <select value={form.propertyId || ""} onChange={(event) => setForm({ ...form, propertyId: event.target.value })} className={adminInputClass}>
                  <option value="">No property linked</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>Assigned agent</Label>
                <select value={form.agentId || ""} onChange={(event) => setForm({ ...form, agentId: event.target.value })} className={adminInputClass}>
                  <option value="">No agent assigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>Client name</Label>
                <input value={form.clientName || ""} onChange={(event) => setForm({ ...form, clientName: event.target.value })} className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Client phone</Label>
                <input value={form.clientPhone || ""} onChange={(event) => setForm({ ...form, clientPhone: event.target.value })} className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Client email</Label>
                <input value={form.clientEmail || ""} onChange={(event) => setForm({ ...form, clientEmail: event.target.value })} type="email" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Status</Label>
                <select value={form.status || "pending"} onChange={(event) => setForm({ ...form, status: event.target.value as Appointment["status"] })} className={adminInputClass}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>Preferred date</Label>
                <input value={form.date || ""} onChange={(event) => setForm({ ...form, date: event.target.value })} type="date" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Preferred time</Label>
                <input value={form.time || ""} onChange={(event) => setForm({ ...form, time: event.target.value })} type="time" className={adminInputClass} />
              </div>
            </div>

            <div>
              <Label className={adminLabelClass}>Notes</Label>
              <textarea value={form.message || ""} onChange={(event) => setForm({ ...form, message: event.target.value })} rows={4} className={`${adminInputClass} resize-none`} />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update Appointment" : "Create Appointment"}
              </Button>
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by client, phone, property, or agent" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Appointment["status"] | "all")} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {paginatedAppointments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            No appointments match your current view.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="p-3 font-medium text-muted-foreground">Client</th>
                      <th className="p-3 font-medium text-muted-foreground">Property</th>
                      <th className="p-3 font-medium text-muted-foreground">Schedule</th>
                      <th className="p-3 font-medium text-muted-foreground">Status</th>
                      <th className="p-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAppointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b border-border/50 align-top">
                        <td className="p-3">
                          <p className="font-medium text-foreground">{appointment.clientName}</p>
                          <p className="text-xs text-muted-foreground">{appointment.clientPhone}</p>
                          <p className="text-xs text-muted-foreground">{appointment.clientEmail || "No email provided"}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <p>{appointment.propertyTitle || "General viewing request"}</p>
                          <p className="mt-1 text-xs">{appointment.agentName || "No agent assigned"}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <p>{appointment.date}</p>
                          <p className="mt-1 text-xs">{appointment.time}</p>
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium capitalize text-accent-foreground">
                            {appointment.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(appointment)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit appointment">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(appointment.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete appointment">
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
