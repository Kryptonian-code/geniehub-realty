export type PropertyCategory =
  | "houses"
  | "apartments"
  | "land"
  | "commercial"
  | "short-stay"
  | "luxury"
  | "student-housing";

export type PropertyType =
  | "house"
  | "apartment"
  | "duplex"
  | "townhouse"
  | "studio"
  | "land"
  | "office-space"
  | "shop"
  | "warehouse"
  | "short-stay"
  | "hostel"
  | "semi-detached"
  | "detached-house"
  | "compound-house"
  | "penthouse";

export type PropertyTag = "featured" | "verified" | "new" | "hot-deal" | "reduced";
export type ListingStatus = "available" | "sold" | "rented" | "pending";
export type LeadStatus = "new" | "contacted" | "responded" | "closed";

export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  type: string;
  region: string;
  city: string;
  area: string;
  address: string;
  nearbyLandmarks: string[];
  salePrice?: number;
  rentPrice?: number;
  rentPeriod?: "month" | "year";
  rentAdvanceYears?: number;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  parkingSpaces: number;
  landSize?: string;
  hasKitchen: boolean;
  furnished: "unfurnished" | "semi-furnished" | "fully-furnished";
  hasAC: boolean;
  hasSecurityPost: boolean;
  isGatedCommunity: boolean;
  hasWater: boolean;
  hasElectricity: boolean;
  images: string[];
  status: ListingStatus;
  tags: PropertyTag[];
  agentId?: string;
  agent_name?: string;
  agent_phone?: string;
  agent_email?: string;
  features: string[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  photo: string;
  phone: string;
  email: string;
  bio: string;
  specialization: string;
  experienceYears: number;
  officeId?: string;
  office_name?: string;
  office_city?: string;
  createdAt?: string;
}

export interface Admin {
  id: number;
  username: string;
  display_name: string;
  name: string;
  email: string;
  role: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: LeadStatus;
  propertyId?: string;
  property_title?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  author: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  createdAt: string;
}

export interface Office {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  propertyId?: string;
  agentId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  date: string;
  time: string;
  message?: string;
  propertyTitle?: string;
  agentName?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export interface ValuationRequest {
  id: string;
  location: string;
  propertyType: string;
  size: string;
  condition: string;
  expectedPrice?: number;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  notes?: string;
  status?: "new" | "contacted" | "closed";
  createdAt: string;
  updatedAt?: string;
}

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  companyName: string;
  companyPhone: string;
  companyAltPhone: string;
  companyEmail: string;
  officeHours: string;
  mapEmbedUrl: string;
  whatsappNumber: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  footerText: string;
  trustSectionTitle: string;
  trustSectionIntro: string;
  homepageBadges: string[];
  popularLocations: string[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  seoTitle: string;
  seoDescription: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyTaxonomyItem {
  id: string;
  name: string;
  usageCount?: number;
  createdAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  photo?: string;
  content: string;
  rating: number;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
}
