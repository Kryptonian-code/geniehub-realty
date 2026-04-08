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
import { getUserFacingErrorMessage } from "@/lib/errors";

export function inferApiBase(location: Pick<Location, "protocol" | "hostname" | "port" | "pathname" | "origin">): string {
  const localhostHosts = ["localhost", "127.0.0.1"];
  const isLocalhost = localhostHosts.includes(location.hostname);
  const isViteDevServer = ["5173", "8080"].includes(location.port);
  const isXamppSubfolder = location.pathname.startsWith("/geniehub-realty");

  if (isLocalhost && (isViteDevServer || isXamppSubfolder)) {
    return `${location.protocol}//${location.hostname}/geniehub-realty/backend/api`;
  }

  return `${location.origin}/backend/api`;
}

const fallbackLocation = {
  protocol: "http:",
  hostname: "localhost",
  port: "",
  pathname: "/geniehub-realty",
  origin: "http://localhost",
};
const runtimeLocation = typeof window !== "undefined" ? window.location : fallbackLocation;
const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? inferApiBase(runtimeLocation);
let csrfToken: string | null = null;

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type PropertyPayload = Record<string, unknown>;
type BlogPayload = Record<string, unknown>;
type TaxonomyPayload = Record<string, unknown>;
type PropertyListResponse = {
  data: PropertyPayload[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

type TaxonomyCollectionResponse = {
  categories: TaxonomyPayload[];
  types: TaxonomyPayload[];
  features: TaxonomyPayload[];
};

export type PropertyFilters = Record<string, string | number | boolean | undefined>;

export interface PagedResult<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface TaxonomyCollection {
  categories: PropertyTaxonomyItem[];
  types: PropertyTaxonomyItem[];
  features: PropertyTaxonomyItem[];
}

const defaultMeta = { page: 1, per_page: 12, total: 0, total_pages: 0 };

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function normalizeProperty(payload: PropertyPayload): Property {
  const features = Array.isArray(payload.features) ? payload.features.map(String) : [];
  return {
    id: String(payload.id ?? ""),
    title: String(payload.title ?? ""),
    slug: String(payload.slug ?? ""),
    description: String(payload.description ?? ""),
    category: String(payload.category_name ?? payload.category ?? ""),
    type: String(payload.type_name ?? payload.type ?? ""),
    region: String(payload.region ?? ""),
    city: String(payload.city ?? ""),
    area: String(payload.area ?? ""),
    address: String(payload.address ?? ""),
    nearbyLandmarks: Array.isArray(payload.nearby_landmarks) ? payload.nearby_landmarks.map(String) : [],
    salePrice: toNumber(payload.price),
    rentPrice: toNumber(payload.rent_price),
    rentPeriod: "month",
    rentAdvanceYears: toNumber(payload.rent_advance),
    bedrooms: Number(payload.bedrooms ?? 0),
    bathrooms: Number(payload.bathrooms ?? 0),
    toilets: Number(payload.toilets ?? 0),
    parkingSpaces: Number(payload.parking_spaces ?? 0),
    landSize: (payload.land_size as string | undefined) || undefined,
    hasKitchen: toBoolean(payload.hasKitchen) || features.includes("kitchen"),
    furnished: (payload.furnished as Property["furnished"]) ?? "unfurnished",
    hasAC: toBoolean(payload.hasAC) || features.includes("air-conditioning"),
    hasSecurityPost: toBoolean(payload.hasSecurityPost) || features.includes("security-post"),
    isGatedCommunity: toBoolean(payload.isGatedCommunity) || features.includes("gated-community"),
    hasWater: toBoolean(payload.hasWater) || features.includes("water"),
    hasElectricity: toBoolean(payload.hasElectricity) || features.includes("electricity"),
    images: Array.isArray(payload.images) ? payload.images.map(String) : [],
    status: (payload.status as Property["status"]) ?? "available",
    tags: [
      ...(toBoolean(payload.is_featured) ? ["featured" as const] : []),
      ...(toBoolean(payload.is_verified) ? ["verified" as const] : []),
    ],
    agentId: payload.agent_id ? String(payload.agent_id) : undefined,
    agent_name: payload.agent_name ? String(payload.agent_name) : undefined,
    agent_phone: payload.agent_phone ? String(payload.agent_phone) : undefined,
    agent_email: payload.agent_email ? String(payload.agent_email) : undefined,
    features,
    metaTitle: payload.meta_title ? String(payload.meta_title) : undefined,
    metaDescription: payload.meta_description ? String(payload.meta_description) : undefined,
    ogImage: payload.og_image ? String(payload.og_image) : undefined,
    canonicalUrl: payload.canonical_url ? String(payload.canonical_url) : undefined,
    createdAt: String(payload.created_at ?? ""),
    updatedAt: String(payload.updated_at ?? ""),
  };
}

export function normalizeAgent(payload: Record<string, unknown>): Agent {
  const bio = String(payload.bio ?? "");
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    photo: String(payload.photo ?? ""),
    phone: String(payload.phone ?? ""),
    email: String(payload.email ?? ""),
    bio,
    specialization: String(payload.specialization ?? "") || "Property Consultant",
    experienceYears: Number(payload.experience_years ?? 0),
    officeId: payload.office_id ? String(payload.office_id) : undefined,
    office_name: payload.office_name ? String(payload.office_name) : undefined,
    office_city: payload.office_city ? String(payload.office_city) : undefined,
    createdAt: payload.created_at ? String(payload.created_at) : undefined,
  };
}

export function normalizeLead(payload: Record<string, unknown>): Lead {
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    phone: String(payload.phone ?? ""),
    email: String(payload.email ?? ""),
    message: String(payload.message ?? ""),
    status: (payload.status as Lead["status"]) ?? "new",
    propertyId: payload.property_id ? String(payload.property_id) : undefined,
    property_title: payload.property_title ? String(payload.property_title) : undefined,
    createdAt: String(payload.created_at ?? ""),
  };
}

export function normalizeAppointment(payload: Record<string, unknown>): Appointment {
  return {
    id: String(payload.id ?? ""),
    propertyId: payload.property_id ? String(payload.property_id) : undefined,
    agentId: payload.agent_id ? String(payload.agent_id) : undefined,
    clientName: String(payload.client_name ?? ""),
    clientPhone: String(payload.client_phone ?? ""),
    clientEmail: payload.client_email ? String(payload.client_email) : undefined,
    date: String(payload.preferred_date ?? ""),
    time: String(payload.preferred_time ?? ""),
    message: payload.message ? String(payload.message) : undefined,
    propertyTitle: payload.property_title ? String(payload.property_title) : undefined,
    agentName: payload.agent_name ? String(payload.agent_name) : undefined,
    status: (payload.status as Appointment["status"]) ?? "pending",
    createdAt: payload.created_at ? String(payload.created_at) : undefined,
    updatedAt: payload.updated_at ? String(payload.updated_at) : undefined,
  };
}

export function normalizeValuation(payload: Record<string, unknown>): ValuationRequest {
  return {
    id: String(payload.id ?? ""),
    location: String(payload.location ?? ""),
    propertyType: String(payload.property_type ?? ""),
    size: String(payload.size ?? ""),
    condition: String(payload.property_condition ?? ""),
    expectedPrice: toNumber(payload.expected_price),
    contactName: String(payload.contact_name ?? ""),
    contactPhone: String(payload.contact_phone ?? ""),
    contactEmail: payload.contact_email ? String(payload.contact_email) : undefined,
    notes: payload.notes ? String(payload.notes) : undefined,
    status: (payload.status as ValuationRequest["status"]) ?? "new",
    createdAt: String(payload.created_at ?? ""),
    updatedAt: payload.updated_at ? String(payload.updated_at) : undefined,
  };
}

export function normalizeFaq(payload: Record<string, unknown>): FAQ {
  return {
    id: String(payload.id ?? ""),
    question: String(payload.question ?? ""),
    answer: String(payload.answer ?? ""),
    sortOrder: Number(payload.sort_order ?? 0),
    isActive: toBoolean(payload.is_active ?? true),
    createdAt: payload.created_at ? String(payload.created_at) : undefined,
    updatedAt: payload.updated_at ? String(payload.updated_at) : undefined,
  };
}

export function normalizeOffice(payload: Record<string, unknown>): Office {
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    city: String(payload.city ?? ""),
    address: String(payload.address ?? ""),
    phone: String(payload.phone ?? ""),
    email: String(payload.email ?? ""),
    createdAt: payload.created_at ? String(payload.created_at) : undefined,
  };
}

export function normalizeBlogPost(payload: BlogPayload): BlogPost {
  const excerpt = String(payload.excerpt ?? "").trim();
  const content = String(payload.content ?? "");
  return {
    id: String(payload.id ?? ""),
    title: String(payload.title ?? ""),
    slug: String(payload.slug ?? ""),
    excerpt: excerpt || content.slice(0, 180).trim(),
    content,
    category: String(payload.category ?? "market-insights"),
    coverImage: String(payload.cover_image ?? payload.coverImage ?? ""),
    author: String(payload.author ?? "GenieHub Realty"),
    metaTitle: payload.meta_title ? String(payload.meta_title) : undefined,
    metaDescription: payload.meta_description ? String(payload.meta_description) : undefined,
    published: toBoolean(payload.is_published ?? payload.published ?? false),
    createdAt: String(payload.created_at ?? ""),
  };
}

export function normalizeTestimonial(payload: Record<string, unknown>): Testimonial {
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    role: String(payload.role ?? ""),
    photo: payload.photo ? String(payload.photo) : undefined,
    content: String(payload.content ?? ""),
    rating: Number(payload.rating ?? 5),
    sortOrder: Number(payload.sort_order ?? 0),
    isActive: toBoolean(payload.is_active ?? true),
    createdAt: payload.created_at ? String(payload.created_at) : undefined,
  };
}

export function normalizeTaxonomyItem(payload: TaxonomyPayload): PropertyTaxonomyItem {
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    usageCount: Number(payload.usage_count ?? 0),
    createdAt: payload.created_at ? String(payload.created_at) : undefined,
  };
}

function parseStringList(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch (_error) {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeSettings(settings: Record<string, string>): SiteSettings {
  return {
    heroTitle: settings.hero_title || "",
    heroSubtitle: settings.hero_subtitle || "",
    aboutText: settings.about_text || "",
    companyName: settings.company_name || "GenieHub Realty",
    companyPhone: settings.company_phone || "",
    companyAltPhone: settings.company_alt_phone || "",
    companyEmail: settings.company_email || "",
    officeHours: settings.office_hours || "",
    mapEmbedUrl: settings.map_embed_url || "",
    whatsappNumber: settings.whatsapp_number || "",
    primaryCtaLabel: settings.primary_cta_label || "Browse Properties",
    primaryCtaLink: settings.primary_cta_link || "/properties",
    secondaryCtaLabel: settings.secondary_cta_label || "Speak to an Agent",
    secondaryCtaLink: settings.secondary_cta_link || "/contact",
    footerText: settings.footer_text || "",
    trustSectionTitle: settings.trust_section_title || "Why Clients Choose Us",
    trustSectionIntro: settings.trust_section_intro || "",
    homepageBadges: parseStringList(settings.homepage_badges),
    popularLocations: parseStringList(settings.popular_locations),
    socialLinks: {
      facebook: settings.facebook_url || "",
      instagram: settings.instagram_url || "",
      twitter: settings.twitter_url || "",
      linkedin: settings.linkedin_url || "",
      youtube: settings.youtube_url || "",
    },
    seoTitle: settings.seo_title || "",
    seoDescription: settings.seo_description || "",
  };
}

class ApiClient {
  private async ensureCsrfToken() {
    if (csrfToken) {
      return csrfToken;
    }

    try {
      const response = await this.request<{ user: Admin | null; csrf_token?: string }>("/auth.php", {
        method: "GET",
      });
      if (response.csrf_token) {
        csrfToken = response.csrf_token;
      }
    } catch (_error) {
      csrfToken = null;
    }

    return csrfToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "OPTIONS") {
      await this.ensureCsrfToken();
    }

    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (!isFormData && typeof options.body === "string" && method !== "GET" && method !== "OPTIONS" && csrfToken) {
      try {
        const parsed = JSON.parse(options.body) as Record<string, unknown>;
        if (!("csrf_token" in parsed)) {
          options.body = JSON.stringify({ ...parsed, csrf_token: csrfToken });
        }
      } catch (_error) {
        options.body = JSON.stringify({ csrf_token: csrfToken });
      }
    }

    const headers = new Headers(options.headers || {});

    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (method !== "GET" && method !== "OPTIONS" && csrfToken && !headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", csrfToken);
    }

    if (isFormData && csrfToken && !options.body.has("csrf_token")) {
      options.body.append("csrf_token", csrfToken);
    }

    if (method === "DELETE" && !options.body && csrfToken) {
      options.body = JSON.stringify({ csrf_token: csrfToken });
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: "include",
      headers,
      ...options,
    });

    const payload = await response.json().catch(() => ({}));

    if (payload && typeof payload === "object" && "csrf_token" in payload && typeof payload.csrf_token === "string") {
      csrfToken = payload.csrf_token;
    }

    if (!response.ok) {
      if (response.status === 419 && method !== "GET" && method !== "OPTIONS") {
        csrfToken = null;
      }
      throw new ApiError(getUserFacingErrorMessage(response.status), response.status);
    }

    return payload as T;
  }

  async getProperties(filters: PropertyFilters = {}): Promise<PagedResult<Property>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    const response = await this.request<PropertyListResponse>(`/properties.php?${params.toString()}`);
    return {
      data: response.data.map(normalizeProperty),
      meta: response.meta ?? defaultMeta,
    };
  }

  async getPropertyBySlug(slug: string): Promise<Property> {
    const response = await this.request<PropertyPayload>(`/properties.php?slug=${encodeURIComponent(slug)}`);
    return normalizeProperty(response);
  }

  async createProperty(property: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/properties.php", {
      method: "POST",
      body: JSON.stringify(property),
    });
  }

  async updateProperty(id: string, property: Record<string, unknown>) {
    return this.request<{ message: string }>(`/properties.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(property),
    });
  }

  async deleteProperty(id: string) {
    return this.request<{ message: string }>(`/properties.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async getAgents(): Promise<Agent[]> {
    const response = await this.request<Record<string, unknown>[]>("/agents.php");
    return response.map(normalizeAgent);
  }

  async getAgent(id: string): Promise<Agent> {
    const response = await this.request<Record<string, unknown>>(`/agents.php?id=${id}`);
    return normalizeAgent(response);
  }

  async createAgent(agent: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/agents.php", {
      method: "POST",
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: Record<string, unknown>) {
    return this.request<{ message: string }>(`/agents.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string) {
    return this.request<{ message: string }>(`/agents.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async getInquiries(): Promise<Lead[]> {
    const response = await this.request<Record<string, unknown>[]>("/inquiries.php");
    return response.map(normalizeLead);
  }

  async createInquiry(inquiry: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/inquiries.php", {
      method: "POST",
      body: JSON.stringify(inquiry),
    });
  }

  async updateInquiry(id: string, inquiry: Record<string, unknown>) {
    return this.request<{ message: string }>(`/inquiries.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(inquiry),
    });
  }

  async getValuations(): Promise<ValuationRequest[]> {
    const response = await this.request<Record<string, unknown>[]>("/valuations.php");
    return response.map(normalizeValuation);
  }

  async createValuation(payload: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/valuations.php", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateValuation(id: string, payload: Record<string, unknown>) {
    return this.request<{ message: string }>(`/valuations.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteValuation(id: string) {
    return this.request<{ message: string }>(`/valuations.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async getAppointments(): Promise<Appointment[]> {
    const response = await this.request<Record<string, unknown>[]>("/appointments.php");
    return response.map(normalizeAppointment);
  }

  async createAppointment(payload: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/appointments.php", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateAppointment(id: string, payload: Record<string, unknown>) {
    return this.request<{ message: string }>(`/appointments.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteAppointment(id: string) {
    return this.request<{ message: string }>(`/appointments.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async getFaqs(admin = false): Promise<FAQ[]> {
    const response = await this.request<Record<string, unknown>[]>(`/faqs.php${admin ? "?admin=1" : ""}`);
    return response.map(normalizeFaq);
  }

  async createFaq(faq: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/faqs.php", {
      method: "POST",
      body: JSON.stringify(faq),
    });
  }

  async updateFaq(id: string, faq: Record<string, unknown>) {
    return this.request<{ message: string }>(`/faqs.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(faq),
    });
  }

  async deleteFaq(id: string) {
    return this.request<{ message: string }>(`/faqs.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async getSettings(): Promise<SiteSettings> {
    const response = await this.request<Record<string, string>>("/settings.php");
    return normalizeSettings(response);
  }

  async updateSettings(settings: Record<string, string>) {
    return this.request<{ message: string }>("/settings.php", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async getOffices(): Promise<Office[]> {
    const response = await this.request<Record<string, unknown>[]>("/offices.php");
    return response.map(normalizeOffice);
  }

  async createOffice(office: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/offices.php", {
      method: "POST",
      body: JSON.stringify(office),
    });
  }

  async updateOffice(id: string, office: Record<string, unknown>) {
    return this.request<{ message: string }>(`/offices.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(office),
    });
  }

  async deleteOffice(id: string) {
    return this.request<{ message: string }>(`/offices.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async getBlogPosts(admin = false): Promise<BlogPost[]> {
    const response = await this.request<BlogPayload[]>(`/blog.php${admin ? "?admin=1" : ""}`);
    return response.map(normalizeBlogPost);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost> {
    const response = await this.request<BlogPayload>(`/blog.php?slug=${encodeURIComponent(slug)}`);
    return normalizeBlogPost(response);
  }

  async createBlogPost(post: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/blog.php", {
      method: "POST",
      body: JSON.stringify(post),
    });
  }

  async updateBlogPost(id: string, post: Record<string, unknown>) {
    return this.request<{ message: string }>(`/blog.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(post),
    });
  }

  async deleteBlogPost(id: string) {
    return this.request<{ message: string }>(`/blog.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async getTestimonials(admin = false): Promise<Testimonial[]> {
    const response = await this.request<Record<string, unknown>[]>(`/testimonials.php${admin ? "?admin=1" : ""}`);
    return response.map(normalizeTestimonial);
  }

  async createTestimonial(payload: Record<string, unknown>) {
    return this.request<{ id: number; message: string }>("/testimonials.php", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateTestimonial(id: string, payload: Record<string, unknown>) {
    return this.request<{ message: string }>(`/testimonials.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteTestimonial(id: string) {
    return this.request<{ message: string }>(`/testimonials.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async getTaxonomies(): Promise<TaxonomyCollection> {
    const response = await this.request<TaxonomyCollectionResponse>("/taxonomies.php");
    return {
      categories: response.categories.map(normalizeTaxonomyItem),
      types: response.types.map(normalizeTaxonomyItem),
      features: response.features.map(normalizeTaxonomyItem),
    };
  }

  async createTaxonomy(kind: "categories" | "types" | "features", name: string) {
    return this.request<{ id: number; message: string }>("/taxonomies.php", {
      method: "POST",
      body: JSON.stringify({ kind, name }),
    });
  }

  async updateTaxonomy(kind: "categories" | "types" | "features", id: string, name: string) {
    return this.request<{ message: string }>(`/taxonomies.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify({ kind, name }),
    });
  }

  async deleteTaxonomy(kind: "categories" | "types" | "features", id: string) {
    return this.request<{ message: string }>(`/taxonomies.php?id=${id}&kind=${kind}`, {
      method: "DELETE",
    });
  }

  async seedTaxonomyDefaults() {
    return this.request<{ message: string }>("/taxonomies.php", {
      method: "POST",
      body: JSON.stringify({ action: "seed-defaults" }),
    });
  }

  async uploadMedia(file: File, type: "agent" | "property" | "blog") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    return this.request<{ path: string; url: string; message: string }>("/uploads.php", {
      method: "POST",
      body: formData,
    });
  }

  async getSession() {
    return this.request<{ user: Admin | null; csrf_token?: string }>("/auth.php");
  }

  async getSetupStatus() {
    return this.request<{ has_admin: boolean }>("/auth.php?action=setup-status");
  }

  async login(username: string, password: string) {
    return this.request<{ user: Admin; csrf_token?: string }>("/auth.php", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async bootstrapAdmin(payload: {
    username: string;
    display_name: string;
    email?: string;
    password: string;
  }) {
    return this.request<{ user: Admin; csrf_token?: string; message?: string }>("/auth.php", {
      method: "POST",
      body: JSON.stringify({
        action: "bootstrap-admin",
        ...payload,
      }),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>("/auth.php", {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    });
  }
}

export const api = new ApiClient();
