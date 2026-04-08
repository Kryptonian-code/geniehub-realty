import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import type { LeadStatus } from "@/types";

const PAGE_SIZE = 10;
const statusOptions: LeadStatus[] = ["new", "contacted", "responded", "closed"];
const statusClasses: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  responded: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-800",
};

export default function AdminLeads() {
  const { leads, updateLead, loading } = useAdmin();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [page, setPage] = useState(1);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch =
        term === "" ||
        lead.name.toLowerCase().includes(term) ||
        lead.phone.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        (lead.property_title || "").toLowerCase().includes(term) ||
        lead.message.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const paginatedLeads = useMemo(() => filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredLeads, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await updateLead(id, { status });
      toast({ title: "Lead updated", description: `Lead marked as ${status}.` });
    } catch (error) {
      toast({ title: "Update failed", description: "The lead status could not be saved.", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads and Inquiries</h1>
          <p className="text-sm text-muted-foreground">
            {leads.length} total inquiries
            {loading.adminData ? " | refreshing..." : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads by name, phone, property, or message" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "all")} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            No inquiries match your current view.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="p-3 font-medium text-muted-foreground">Name</th>
                      <th className="p-3 font-medium text-muted-foreground">Phone</th>
                      <th className="p-3 font-medium text-muted-foreground">Email</th>
                      <th className="p-3 font-medium text-muted-foreground">Property</th>
                      <th className="p-3 font-medium text-muted-foreground">Message</th>
                      <th className="p-3 font-medium text-muted-foreground">Status</th>
                      <th className="p-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border/50 align-top">
                        <td className="p-3 font-medium text-foreground">{lead.name}</td>
                        <td className="p-3 text-muted-foreground">{lead.phone}</td>
                        <td className="p-3 text-muted-foreground">{lead.email || "Not provided"}</td>
                        <td className="p-3 text-muted-foreground">{lead.property_title || "General inquiry"}</td>
                        <td className="max-w-sm p-3 text-muted-foreground">{lead.message}</td>
                        <td className="p-3">
                          <select
                            value={lead.status}
                            onChange={(event) => handleStatusChange(lead.id, event.target.value as LeadStatus)}
                            className={`rounded border-0 px-2 py-1 text-xs font-medium ${statusClasses[lead.status]}`}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString("en-GH")}</td>
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
