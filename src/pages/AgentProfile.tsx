import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import PropertyCard from "@/components/property/PropertyCard";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { Phone, Mail, Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/media";
import type { Agent, Property } from "@/types";
import { reportClientError } from "@/lib/errors";
import SeoMeta from "@/components/seo/SeoMeta";

export default function AgentProfile() {
  const { id } = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgent = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const ag = await api.getAgent(id);
        setAgent(ag);

        // Load agent's properties
        const agentProps = await api.getProperties({ agent_id: id });
        setProperties(agentProps.data);
      } catch (error) {
        reportClientError("agent profile load", error);
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="bg-primary py-4">
          <div className="container mx-auto px-4">
            <Link to="/agents" className="inline-flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to agents
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          <div className="animate-pulse">
            <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2 w-48 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">Agent not found</p>
            <Link to="/agents"><Button>Back to Agents</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title={`${agent.name} | Ghana Property Agent`}
        description={agent.bio?.slice(0, 155) || `${agent.name} helps clients with ${agent.specialization.toLowerCase()} across Ghana.`}
        canonicalPath={`/agents/${agent.id}`}
        image={agent.photo ? resolveMediaUrl(agent.photo) : undefined}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: agent.name,
          jobTitle: agent.specialization,
          telephone: agent.phone,
          email: agent.email,
          image: agent.photo ? resolveMediaUrl(agent.photo) : undefined,
        }}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary py-4">
          <div className="container mx-auto px-4">
            <Link to="/agents" className="inline-flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to agents
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl border border-border p-6 h-fit">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-muted-foreground/30">
                {agent.photo ? <img src={resolveMediaUrl(agent.photo)} alt={agent.name} className="w-full h-full rounded-full object-cover" /> : agent.name.charAt(0)}
              </div>
              <h1 className="text-xl font-bold text-foreground text-center">{agent.name}</h1>
              <p className="text-sm text-gold text-center flex items-center justify-center gap-1 mt-1"><Briefcase className="h-3.5 w-3.5" /> {agent.specialization}</p>
              <p className="text-xs text-muted-foreground text-center mt-1">{agent.experienceYears} years experience</p>
              <div className="mt-5 pt-5 border-t border-border space-y-2 text-sm">
                <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="h-4 w-4" /> {agent.phone}</a>
                <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="h-4 w-4" /> {agent.email}</a>
              </div>
              <WhatsAppButton variant="inline" message={`Hello ${agent.name}, I found your profile on GenieHub Realty.`} className="w-full mt-4 justify-center" />
            </div>
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{agent.bio}</p>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Listings by {agent.name.split(" ")[0]} ({properties.length})</h2>
              {properties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
                </div>
              ) : (
                <p className="text-muted-foreground">No listings available at the moment.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
