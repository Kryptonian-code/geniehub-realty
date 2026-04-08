import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleHelp,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  NotebookPen,
  Settings,
  Star,
  Tags,
  Users,
  ClipboardList,
  X,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

const adminLinks = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Properties", path: "/admin/properties", icon: Home },
  { label: "Agents", path: "/admin/agents", icon: Users },
  { label: "Leads", path: "/admin/leads", icon: MessageSquare },
  { label: "Appointments", path: "/admin/appointments", icon: CalendarDays },
  { label: "Valuations", path: "/admin/valuations", icon: ClipboardList },
  { label: "FAQs", path: "/admin/faqs", icon: CircleHelp },
  { label: "Offices", path: "/admin/offices", icon: Building2 },
  { label: "Taxonomy", path: "/admin/taxonomy", icon: Tags },
  { label: "Testimonials", path: "/admin/testimonials", icon: Star },
  { label: "Blog", path: "/admin/blog", icon: NotebookPen },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdmin();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30 lg:flex">
      <aside className="hidden w-64 flex-col bg-primary text-primary-foreground lg:flex">
        <div className="border-b border-secondary px-6 py-5">
          <Link to="/admin" className="block">
            <span className="text-lg font-bold tracking-tight">GenieHub Admin</span>
            <span className="mt-1 block text-xs text-primary-foreground/70">Real estate operations workspace</span>
          </Link>
        </div>

        <div className="border-b border-secondary/70 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/55">Signed in as</p>
          <p className="mt-2 text-sm font-semibold">{admin?.display_name || admin?.name || admin?.username}</p>
          <p className="text-xs text-primary-foreground/70">{admin?.username}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "bg-secondary text-primary-foreground"
                  : "text-primary-foreground/75 hover:bg-secondary/60 hover:text-primary-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-secondary px-3 py-4">
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/75 transition-colors hover:bg-secondary/60 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Sign Out
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/75 transition-colors hover:bg-secondary/60 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Website
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-primary px-4 text-primary-foreground lg:hidden">
          <Link to="/admin" className="text-lg font-bold tracking-tight">
            GenieHub Admin
          </Link>
          <button onClick={() => setSidebarOpen((prev) => !prev)} aria-label="Toggle admin navigation">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {sidebarOpen && (
          <div className="border-b border-secondary bg-primary px-4 py-3 lg:hidden">
            <div className="space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    location.pathname === link.path ? "bg-secondary text-primary-foreground" : "text-primary-foreground/75"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              <button onClick={() => void handleLogout()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/75">
                <ArrowLeft className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
