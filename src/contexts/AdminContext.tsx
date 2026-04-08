import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type {
  Admin,
  Agent,
  Appointment,
  BlogPost,
  FAQ,
  Lead,
  Office,
  Property,
  PropertyTaxonomyItem,
  SiteSettings,
  Testimonial,
  ValuationRequest,
} from "@/types";
import { api } from "@/lib/api";
import { reportClientError } from "@/lib/errors";

interface AdminContextType {
  properties: Property[];
  agents: Agent[];
  leads: Lead[];
  blogPosts: BlogPost[];
  offices: Office[];
  propertyCategories: PropertyTaxonomyItem[];
  propertyTypes: PropertyTaxonomyItem[];
  propertyFeatures: PropertyTaxonomyItem[];
  appointments: Appointment[];
  valuationRequests: ValuationRequest[];
  settings: SiteSettings;
  faqs: FAQ[];
  testimonials: Testimonial[];
  admin: Admin | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  loading: {
    publicData: boolean;
    adminData: boolean;
  };
  refreshPublicData: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  bootstrapAdmin: (payload: { username: string; displayName: string; email?: string; password: string }) => Promise<boolean>;
  createProperty: (property: Partial<Property>) => Promise<void>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  createAgent: (agent: Partial<Agent>) => Promise<void>;
  updateAgent: (id: string, agent: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  submitGeneralInquiry: (lead: { name: string; phone: string; email?: string; message: string }) => Promise<void>;
  submitAppointmentRequest: (appointment: Partial<Appointment>) => Promise<void>;
  submitValuationRequest: (valuation: Partial<ValuationRequest>) => Promise<void>;
  createAppointment: (appointment: Partial<Appointment>) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  createValuation: (valuation: Partial<ValuationRequest>) => Promise<void>;
  updateValuation: (id: string, valuation: Partial<ValuationRequest>) => Promise<void>;
  deleteValuation: (id: string) => Promise<void>;
  createFaq: (faq: Partial<FAQ>) => Promise<void>;
  updateFaq: (id: string, faq: Partial<FAQ>) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
  createOffice: (office: Partial<Office>) => Promise<void>;
  updateOffice: (id: string, office: Partial<Office>) => Promise<void>;
  deleteOffice: (id: string) => Promise<void>;
  createBlogPost: (post: Partial<BlogPost>) => Promise<void>;
  updateBlogPost: (id: string, post: Partial<BlogPost>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  createTestimonial: (testimonial: Partial<Testimonial>) => Promise<void>;
  updateTestimonial: (id: string, testimonial: Partial<Testimonial>) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  createTaxonomy: (kind: "categories" | "types" | "features", name: string) => Promise<void>;
  updateTaxonomy: (kind: "categories" | "types" | "features", id: string, name: string) => Promise<void>;
  deleteTaxonomy: (kind: "categories" | "types" | "features", id: string) => Promise<void>;
  seedTaxonomyDefaults: () => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  heroTitle: "",
  heroSubtitle: "",
  aboutText: "",
  companyName: "GenieHub Realty",
  companyPhone: "",
  companyAltPhone: "",
  companyEmail: "",
  officeHours: "",
  mapEmbedUrl: "",
  whatsappNumber: "",
  primaryCtaLabel: "Browse Properties",
  primaryCtaLink: "/properties",
  secondaryCtaLabel: "Speak to an Agent",
  secondaryCtaLink: "/contact",
  footerText: "",
  trustSectionTitle: "Why Clients Choose Us",
  trustSectionIntro: "",
  homepageBadges: [],
  popularLocations: [],
  socialLinks: {
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
  },
  seoTitle: "",
  seoDescription: "",
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function propertyToPayload(property: Partial<Property>) {
  const tags = property.tags ?? [];
  const features = property.features?.length
    ? property.features
    : [
        ...(property.hasKitchen ? ["kitchen"] : []),
        ...(property.hasAC ? ["air-conditioning"] : []),
        ...(property.hasSecurityPost ? ["security-post"] : []),
        ...(property.isGatedCommunity ? ["gated-community"] : []),
        ...(property.hasWater ? ["water"] : []),
        ...(property.hasElectricity ? ["electricity"] : []),
      ];

  return {
    title: property.title,
    description: property.description,
    category: property.category,
    type: property.type,
    region: property.region,
    city: property.city,
    area: property.area,
    address: property.address,
    price: property.salePrice ?? null,
    rent_price: property.rentPrice ?? null,
    rent_advance: property.rentAdvanceYears ?? null,
    bedrooms: property.bedrooms ?? 0,
    bathrooms: property.bathrooms ?? 0,
    toilets: property.toilets ?? 0,
    parking_spaces: property.parkingSpaces ?? 0,
    land_size: property.landSize ?? null,
    furnished: property.furnished ?? "unfurnished",
    status: property.status ?? "available",
    is_featured: tags.includes("featured"),
    is_verified: tags.includes("verified"),
    agent_id: property.agentId || null,
    images: property.images ?? [],
    features,
    meta_title: property.metaTitle ?? null,
    meta_description: property.metaDescription ?? null,
    og_image: property.ogImage ?? null,
    canonical_url: property.canonicalUrl ?? null,
  };
}

function settingsToPayload(settings: Partial<SiteSettings>) {
  const payload: Record<string, string> = {};

  if (settings.heroTitle !== undefined) payload.hero_title = settings.heroTitle;
  if (settings.heroSubtitle !== undefined) payload.hero_subtitle = settings.heroSubtitle;
  if (settings.aboutText !== undefined) payload.about_text = settings.aboutText;
  if (settings.companyName !== undefined) payload.company_name = settings.companyName;
  if (settings.companyPhone !== undefined) payload.company_phone = settings.companyPhone;
  if (settings.companyAltPhone !== undefined) payload.company_alt_phone = settings.companyAltPhone;
  if (settings.companyEmail !== undefined) payload.company_email = settings.companyEmail;
  if (settings.officeHours !== undefined) payload.office_hours = settings.officeHours;
  if (settings.mapEmbedUrl !== undefined) payload.map_embed_url = settings.mapEmbedUrl;
  if (settings.whatsappNumber !== undefined) payload.whatsapp_number = settings.whatsappNumber;
  if (settings.primaryCtaLabel !== undefined) payload.primary_cta_label = settings.primaryCtaLabel;
  if (settings.primaryCtaLink !== undefined) payload.primary_cta_link = settings.primaryCtaLink;
  if (settings.secondaryCtaLabel !== undefined) payload.secondary_cta_label = settings.secondaryCtaLabel;
  if (settings.secondaryCtaLink !== undefined) payload.secondary_cta_link = settings.secondaryCtaLink;
  if (settings.footerText !== undefined) payload.footer_text = settings.footerText;
  if (settings.trustSectionTitle !== undefined) payload.trust_section_title = settings.trustSectionTitle;
  if (settings.trustSectionIntro !== undefined) payload.trust_section_intro = settings.trustSectionIntro;
  if (settings.homepageBadges !== undefined) payload.homepage_badges = JSON.stringify(settings.homepageBadges);
  if (settings.popularLocations !== undefined) payload.popular_locations = JSON.stringify(settings.popularLocations);
  if (settings.seoTitle !== undefined) payload.seo_title = settings.seoTitle;
  if (settings.seoDescription !== undefined) payload.seo_description = settings.seoDescription;

  if (settings.socialLinks) {
    if (settings.socialLinks.facebook !== undefined) payload.facebook_url = settings.socialLinks.facebook;
    if (settings.socialLinks.instagram !== undefined) payload.instagram_url = settings.socialLinks.instagram;
    if (settings.socialLinks.twitter !== undefined) payload.twitter_url = settings.socialLinks.twitter;
    if (settings.socialLinks.linkedin !== undefined) payload.linkedin_url = settings.socialLinks.linkedin;
    if (settings.socialLinks.youtube !== undefined) payload.youtube_url = settings.socialLinks.youtube;
  }

  return payload;
}

function blogPostToPayload(post: Partial<BlogPost>) {
  return {
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    cover_image: post.coverImage,
    author: post.author,
    meta_title: post.metaTitle,
    meta_description: post.metaDescription,
    is_published: post.published ?? false,
  };
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyTaxonomyItem[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTaxonomyItem[]>([]);
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyTaxonomyItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [valuationRequests, setValuationRequests] = useState<ValuationRequest[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loading, setLoading] = useState({ publicData: false, adminData: false });

  const refreshPublicData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, publicData: true }));
    try {
      const [settingsData, officeData, faqData, blogData, testimonialData, taxonomyData] = await Promise.all([
        api.getSettings(),
        api.getOffices(),
        api.getFaqs(false),
        api.getBlogPosts(false),
        api.getTestimonials(false),
        api.getTaxonomies(),
      ]);
      setSettings(settingsData);
      setOffices(officeData);
      setFaqs(faqData);
      setBlogPosts(blogData);
      setTestimonials(testimonialData);
      setPropertyCategories(taxonomyData.categories);
      setPropertyTypes(taxonomyData.types);
      setPropertyFeatures(taxonomyData.features);
    } finally {
      setLoading((prev) => ({ ...prev, publicData: false }));
    }
  }, []);

  const refreshAdminData = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading((prev) => ({ ...prev, adminData: true }));
    try {
      const results = await Promise.allSettled([
        api.getProperties({ admin: 1, per_page: 100 }),
        api.getAgents(),
        api.getInquiries(),
        api.getAppointments(),
        api.getValuations(),
        api.getFaqs(true),
        api.getOffices(),
        api.getBlogPosts(true),
        api.getTestimonials(true),
        api.getTaxonomies(),
      ]);

      const [propertyResult, agentResult, leadResult, appointmentResult, valuationResult, faqResult, officeResult, blogResult, testimonialResult, taxonomyResult] = results;

      if (propertyResult.status === "fulfilled") {
        setProperties(propertyResult.value.data);
      }

      if (agentResult.status === "fulfilled") {
        setAgents(agentResult.value);
      }

      if (leadResult.status === "fulfilled") {
        setLeads(leadResult.value);
      }

      if (appointmentResult.status === "fulfilled") {
        setAppointments(appointmentResult.value);
      }

      if (valuationResult.status === "fulfilled") {
        setValuationRequests(valuationResult.value);
      }

      if (faqResult.status === "fulfilled") {
        setFaqs(faqResult.value);
      }

      if (officeResult.status === "fulfilled") {
        setOffices(officeResult.value);
      }

      if (blogResult.status === "fulfilled") {
        setBlogPosts(blogResult.value);
      }

      if (testimonialResult.status === "fulfilled") {
        setTestimonials(testimonialResult.value);
      }

      if (taxonomyResult.status === "fulfilled") {
        setPropertyCategories(taxonomyResult.value.categories);
        setPropertyTypes(taxonomyResult.value.types);
        setPropertyFeatures(taxonomyResult.value.features);
      }
    } finally {
      setLoading((prev) => ({ ...prev, adminData: false }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await refreshPublicData();
        const session = await api.getSession();
        if (session.user) {
          setAdmin(session.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        reportClientError("bootstrap app data", error);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, [refreshPublicData]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAdminData().catch((error) => reportClientError("refresh admin data", error));
    } else {
      setProperties([]);
      setAgents([]);
      setLeads([]);
      setAppointments([]);
      setValuationRequests([]);
    }
  }, [isAuthenticated, refreshAdminData]);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password);
      setAdmin(response.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      reportClientError("login", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      reportClientError("logout", error);
    } finally {
      setAdmin(null);
      setIsAuthenticated(false);
      try {
        await refreshPublicData();
      } catch (error) {
        reportClientError("refresh public data after logout", error);
      }
    }
  };

  const bootstrapAdmin = async (payload: { username: string; displayName: string; email?: string; password: string }) => {
    try {
      const response = await api.bootstrapAdmin({
        username: payload.username,
        display_name: payload.displayName,
        email: payload.email,
        password: payload.password,
      });
      setAdmin(response.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      reportClientError("bootstrap admin", error);
      return false;
    }
  };

  const createProperty = async (property: Partial<Property>) => {
    await api.createProperty(propertyToPayload(property));
    await refreshAdminData();
  };

  const updateProperty = async (id: string, property: Partial<Property>) => {
    await api.updateProperty(id, propertyToPayload(property));
    await refreshAdminData();
  };

  const deleteProperty = async (id: string) => {
    await api.deleteProperty(id);
    await refreshAdminData();
  };

  const createAgent = async (agent: Partial<Agent>) => {
    await api.createAgent({
      name: agent.name,
      photo: agent.photo,
      phone: agent.phone,
      email: agent.email,
      bio: agent.bio,
      specialization: agent.specialization,
      experience_years: agent.experienceYears ?? 0,
      office_id: agent.officeId || null,
    });
    await refreshAdminData();
  };

  const updateAgent = async (id: string, agent: Partial<Agent>) => {
    await api.updateAgent(id, {
      name: agent.name,
      photo: agent.photo,
      phone: agent.phone,
      email: agent.email,
      bio: agent.bio,
      specialization: agent.specialization,
      experience_years: agent.experienceYears ?? 0,
      office_id: agent.officeId || null,
    });
    await refreshAdminData();
  };

  const deleteAgent = async (id: string) => {
    await api.deleteAgent(id);
    await refreshAdminData();
  };

  const updateLead = async (id: string, lead: Partial<Lead>) => {
    await api.updateInquiry(id, { status: lead.status });
    await refreshAdminData();
  };

  const submitGeneralInquiry = async (lead: {
    name: string;
    phone: string;
    email?: string;
    message: string;
  }) => {
    await api.createInquiry(lead);
  };

  const submitAppointmentRequest = async (appointment: Partial<Appointment>) => {
    await api.createAppointment({
      property_id: appointment.propertyId || null,
      agent_id: appointment.agentId || null,
      client_name: appointment.clientName,
      client_phone: appointment.clientPhone,
      client_email: appointment.clientEmail || null,
      preferred_date: appointment.date,
      preferred_time: appointment.time,
      message: appointment.message || null,
      status: appointment.status ?? "pending",
    });
  };

  const submitValuationRequest = async (valuation: Partial<ValuationRequest>) => {
    await api.createValuation({
      location: valuation.location,
      property_type: valuation.propertyType,
      size: valuation.size,
      property_condition: valuation.condition,
      expected_price: valuation.expectedPrice ?? null,
      contact_name: valuation.contactName,
      contact_phone: valuation.contactPhone,
      contact_email: valuation.contactEmail || null,
      notes: valuation.notes || null,
      status: valuation.status ?? "new",
    });
  };

  const createAppointment = async (appointment: Partial<Appointment>) => {
    await submitAppointmentRequest(appointment);
    await refreshAdminData();
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>) => {
    await api.updateAppointment(id, {
      property_id: appointment.propertyId || null,
      agent_id: appointment.agentId || null,
      client_name: appointment.clientName,
      client_phone: appointment.clientPhone,
      client_email: appointment.clientEmail || null,
      preferred_date: appointment.date,
      preferred_time: appointment.time,
      message: appointment.message || null,
      status: appointment.status ?? "pending",
    });
    await refreshAdminData();
  };

  const deleteAppointment = async (id: string) => {
    await api.deleteAppointment(id);
    await refreshAdminData();
  };

  const createValuation = async (valuation: Partial<ValuationRequest>) => {
    await submitValuationRequest(valuation);
    await refreshAdminData();
  };

  const updateValuation = async (id: string, valuation: Partial<ValuationRequest>) => {
    await api.updateValuation(id, {
      location: valuation.location,
      property_type: valuation.propertyType,
      size: valuation.size,
      property_condition: valuation.condition,
      expected_price: valuation.expectedPrice ?? null,
      contact_name: valuation.contactName,
      contact_phone: valuation.contactPhone,
      contact_email: valuation.contactEmail || null,
      notes: valuation.notes || null,
      status: valuation.status ?? "new",
    });
    await refreshAdminData();
  };

  const deleteValuation = async (id: string) => {
    await api.deleteValuation(id);
    await refreshAdminData();
  };

  const createFaq = async (faq: Partial<FAQ>) => {
    await api.createFaq({
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sortOrder ?? 0,
      is_active: faq.isActive ?? true,
    });
    await refreshPublicData();
    await refreshAdminData();
  };

  const updateFaq = async (id: string, faq: Partial<FAQ>) => {
    await api.updateFaq(id, {
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sortOrder ?? 0,
      is_active: faq.isActive ?? true,
    });
    await refreshPublicData();
    await refreshAdminData();
  };

  const deleteFaq = async (id: string) => {
    await api.deleteFaq(id);
    await refreshPublicData();
    await refreshAdminData();
  };

  const createOffice = async (office: Partial<Office>) => {
    await api.createOffice(office);
    await refreshPublicData();
    await refreshAdminData();
  };

  const updateOffice = async (id: string, office: Partial<Office>) => {
    await api.updateOffice(id, office);
    await refreshPublicData();
    await refreshAdminData();
  };

  const deleteOffice = async (id: string) => {
    await api.deleteOffice(id);
    await refreshPublicData();
    await refreshAdminData();
  };

  const createBlogPost = async (post: Partial<BlogPost>) => {
    await api.createBlogPost(blogPostToPayload(post));
    await refreshPublicData();
    await refreshAdminData();
  };

  const updateBlogPost = async (id: string, post: Partial<BlogPost>) => {
    await api.updateBlogPost(id, blogPostToPayload(post));
    await refreshPublicData();
    await refreshAdminData();
  };

  const deleteBlogPost = async (id: string) => {
    await api.deleteBlogPost(id);
    await refreshPublicData();
    await refreshAdminData();
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    await api.updateSettings(settingsToPayload(newSettings));
    await refreshPublicData();
  };

  const createTestimonial = async (testimonial: Partial<Testimonial>) => {
    await api.createTestimonial({
      name: testimonial.name,
      role: testimonial.role,
      photo: testimonial.photo ?? null,
      content: testimonial.content,
      rating: testimonial.rating ?? 5,
      sort_order: testimonial.sortOrder ?? 0,
      is_active: testimonial.isActive ?? true,
    });
    await refreshPublicData();
    await refreshAdminData();
  };

  const updateTestimonial = async (id: string, testimonial: Partial<Testimonial>) => {
    await api.updateTestimonial(id, {
      name: testimonial.name,
      role: testimonial.role,
      photo: testimonial.photo ?? null,
      content: testimonial.content,
      rating: testimonial.rating ?? 5,
      sort_order: testimonial.sortOrder ?? 0,
      is_active: testimonial.isActive ?? true,
    });
    await refreshPublicData();
    await refreshAdminData();
  };

  const deleteTestimonial = async (id: string) => {
    await api.deleteTestimonial(id);
    await refreshPublicData();
    await refreshAdminData();
  };

  const createTaxonomy = async (kind: "categories" | "types" | "features", name: string) => {
    await api.createTaxonomy(kind, name);
    await refreshPublicData();
    await refreshAdminData();
  };

  const updateTaxonomy = async (kind: "categories" | "types" | "features", id: string, name: string) => {
    await api.updateTaxonomy(kind, id, name);
    await refreshPublicData();
    await refreshAdminData();
  };

  const deleteTaxonomy = async (kind: "categories" | "types" | "features", id: string) => {
    await api.deleteTaxonomy(kind, id);
    await refreshPublicData();
    await refreshAdminData();
  };

  const seedTaxonomyDefaults = async () => {
    await api.seedTaxonomyDefaults();
    await refreshPublicData();
    await refreshAdminData();
  };

  return (
    <AdminContext.Provider
      value={{
        properties,
        agents,
        leads,
        blogPosts,
        offices,
        propertyCategories,
        propertyTypes,
        propertyFeatures,
        appointments,
        valuationRequests,
        settings,
        faqs,
        testimonials,
        admin,
        isAuthenticated,
        isBootstrapping,
        loading,
        refreshPublicData,
        refreshAdminData,
        login,
        logout,
        bootstrapAdmin,
        createProperty,
        updateProperty,
        deleteProperty,
        createAgent,
        updateAgent,
        deleteAgent,
        updateLead,
        submitGeneralInquiry,
        submitAppointmentRequest,
        submitValuationRequest,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        createValuation,
        updateValuation,
        deleteValuation,
        createFaq,
        updateFaq,
        deleteFaq,
        createOffice,
        updateOffice,
        deleteOffice,
        createBlogPost,
        updateBlogPost,
        deleteBlogPost,
        createTestimonial,
        updateTestimonial,
        deleteTestimonial,
        createTaxonomy,
        updateTaxonomy,
        deleteTaxonomy,
        seedTaxonomyDefaults,
        updateSettings,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
