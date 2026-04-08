import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails"));
const Agents = lazy(() => import("./pages/Agents"));
const AgentProfile = lazy(() => import("./pages/AgentProfile"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const Valuation = lazy(() => import("./pages/Valuation"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProperties = lazy(() => import("./pages/admin/AdminProperties"));
const AdminAgents = lazy(() => import("./pages/admin/AdminAgents"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminAppointments = lazy(() => import("./pages/admin/AdminAppointments"));
const AdminValuations = lazy(() => import("./pages/admin/AdminValuations"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminFaqs = lazy(() => import("./pages/admin/AdminFaqs"));
const AdminOffices = lazy(() => import("./pages/admin/AdminOffices"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminTaxonomy = lazy(() => import("./pages/admin/AdminTaxonomy"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-muted-foreground">Loading page...</p>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isBootstrapping } = useAdmin();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading admin session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:slug" element={<PropertyDetails />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agents/:id" element={<AgentProfile />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/valuation" element={<Valuation />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/properties" element={<ProtectedRoute><AdminProperties /></ProtectedRoute>} />
              <Route path="/admin/agents" element={<ProtectedRoute><AdminAgents /></ProtectedRoute>} />
              <Route path="/admin/leads" element={<ProtectedRoute><AdminLeads /></ProtectedRoute>} />
              <Route path="/admin/appointments" element={<ProtectedRoute><AdminAppointments /></ProtectedRoute>} />
              <Route path="/admin/valuations" element={<ProtectedRoute><AdminValuations /></ProtectedRoute>} />
              <Route path="/admin/faqs" element={<ProtectedRoute><AdminFaqs /></ProtectedRoute>} />
              <Route path="/admin/offices" element={<ProtectedRoute><AdminOffices /></ProtectedRoute>} />
              <Route path="/admin/taxonomy" element={<ProtectedRoute><AdminTaxonomy /></ProtectedRoute>} />
              <Route path="/admin/testimonials" element={<ProtectedRoute><AdminTestimonials /></ProtectedRoute>} />
              <Route path="/admin/blog" element={<ProtectedRoute><AdminBlog /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
