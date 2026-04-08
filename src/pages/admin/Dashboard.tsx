import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Building2, CalendarDays, CircleHelp, ClipboardList, Home, MessageSquare, NotebookPen, Star, Tags, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { properties, agents, leads, appointments, valuationRequests, faqs, offices, blogPosts, propertyCategories, propertyTypes, propertyFeatures, testimonials, loading } = useAdmin();

  const stats = [
    { label: "Properties", value: properties.length, icon: Home, path: "/admin/properties", color: "text-gold" },
    { label: "Agents", value: agents.length, icon: Users, path: "/admin/agents", color: "text-gold" },
    { label: "Leads", value: leads.length, icon: MessageSquare, path: "/admin/leads", color: "text-gold" },
    { label: "Appointments", value: appointments.length, icon: CalendarDays, path: "/admin/appointments", color: "text-gold" },
    { label: "Valuations", value: valuationRequests.length, icon: ClipboardList, path: "/admin/valuations", color: "text-gold" },
    { label: "FAQs", value: faqs.length, icon: CircleHelp, path: "/admin/faqs", color: "text-gold" },
    { label: "Offices", value: offices.length, icon: Building2, path: "/admin/offices", color: "text-gold" },
    { label: "Taxonomy", value: propertyCategories.length + propertyTypes.length + propertyFeatures.length, icon: Tags, path: "/admin/taxonomy", color: "text-gold" },
    { label: "Testimonials", value: testimonials.length, icon: Star, path: "/admin/testimonials", color: "text-gold" },
    { label: "Blog", value: blogPosts.length, icon: NotebookPen, path: "/admin/blog", color: "text-gold" },
  ];

  const recentLeads = leads.slice(-5).reverse();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor listings, team activity, and incoming leads from one workspace.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link to={stat.path} key={stat.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
            </Link>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Recent Leads</h2>
          {loading.adminData && <p className="text-sm text-muted-foreground mb-3">Refreshing live data...</p>}
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet. Leads from the contact form and property inquiries will appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Name</th>
                    <th className="pb-2 font-medium text-muted-foreground">Phone</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/50">
                      <td className="py-2.5 text-foreground">{lead.name}</td>
                      <td className="py-2.5 text-muted-foreground">{lead.phone}</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 text-xs rounded-full bg-gold/20 text-accent-foreground capitalize">{lead.status.replace(/-/g, " ")}</span></td>
                      <td className="py-2.5 text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
