import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Briefcase } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import type { Agent } from "@/types";
import { reportClientError } from "@/lib/errors";
import SeoMeta from "@/components/seo/SeoMeta";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await api.getAgents();
        setAgents(data);
      } catch (error) {
        reportClientError("agents page load", error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="bg-primary py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">Our Agents</h1>
            <p className="text-primary-foreground/70 mt-1 text-sm">Experienced professionals ready to help you</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card rounded-xl border border-border overflow-hidden">
                <div className="aspect-square bg-muted"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title="Real Estate Agents in Ghana | GenieHub Realty"
        description="Meet experienced GenieHub Realty agents who guide buyers, renters, landlords, and investors across Ghana."
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">Our Agents</h1>
            <p className="text-primary-foreground/70 mt-1 text-sm">Experienced professionals ready to help you</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent) => (
              <Link to={`/agents/${agent.id}`} key={agent.id} className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {agent.photo ? (
                    <img src={resolveMediaUrl(agent.photo)} alt={agent.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-5xl font-bold text-muted-foreground/20">{agent.name.charAt(0)}</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground group-hover:text-primary">{agent.name}</h3>
                  <p className="text-sm text-gold flex items-center gap-1 mt-0.5"><Briefcase className="h-3.5 w-3.5" /> {agent.specialization}</p>
                  <p className="text-xs text-muted-foreground mt-1">{agent.experienceYears} years experience</p>
                  <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {agent.phone}</p>
                    <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {agent.email}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
