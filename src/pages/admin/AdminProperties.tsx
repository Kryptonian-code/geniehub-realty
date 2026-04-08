import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { GHANA_REGIONS } from "@/data/ghanaRegions";
import { adminHelpTextClass, adminInputClass, adminLabelClass } from "@/lib/adminForms";
import { resolveMediaUrl } from "@/lib/media";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import type { Property, PropertyTag } from "@/types";

const emptyProperty: Partial<Property> = {
  title: "",
  description: "",
  category: "houses",
  type: "house",
  region: "Greater Accra",
  city: "Accra",
  area: "",
  address: "",
  salePrice: undefined,
  rentPrice: undefined,
  rentAdvanceYears: undefined,
  bedrooms: 0,
  bathrooms: 0,
  toilets: 0,
  parkingSpaces: 0,
  landSize: "",
  hasKitchen: true,
  furnished: "unfurnished",
  hasAC: false,
  hasSecurityPost: false,
  isGatedCommunity: false,
  hasWater: true,
  hasElectricity: true,
  images: [],
  features: [],
  status: "available",
  tags: [],
  agentId: "",
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
  canonicalUrl: "",
};

const tags: PropertyTag[] = ["featured", "verified", "new", "hot-deal", "reduced"];
const defaultFeatures = ["kitchen", "air-conditioning", "security-post", "gated-community", "water", "electricity"];
const PAGE_SIZE = 8;

export default function AdminProperties() {
  const { properties, agents, propertyCategories, propertyTypes, propertyFeatures, createProperty, updateProperty, deleteProperty, loading } = useAdmin();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Property["status"] | "all">("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Partial<Property>>(emptyProperty);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [properties],
  );
  const categoryOptions = propertyCategories.length > 0 ? propertyCategories : [{ id: "houses", name: "houses" }];
  const typeOptions = propertyTypes.length > 0 ? propertyTypes : [{ id: "house", name: "house" }];
  const featureOptions = propertyFeatures.length > 0 ? propertyFeatures.map((item) => item.name) : defaultFeatures;
  const filteredProperties = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortedProperties.filter((property) => {
      const matchesSearch =
        term === "" ||
        property.title.toLowerCase().includes(term) ||
        property.city.toLowerCase().includes(term) ||
        property.area.toLowerCase().includes(term) ||
        property.region.toLowerCase().includes(term) ||
        property.type.toLowerCase().includes(term) ||
        property.category.toLowerCase().includes(term) ||
        property.description.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || property.status === statusFilter;
      const matchesRegion = regionFilter === "all" || property.region === regionFilter;
      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [sortedProperties, search, statusFilter, regionFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / PAGE_SIZE));
  const paginatedProperties = useMemo(() => filteredProperties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredProperties, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, regionFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyProperty, images: [] });
    setShowForm(true);
  };

  const openEdit = (property: Property) => {
    setEditing(property);
    setForm({ ...property, images: property.images ?? [] });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm({ ...emptyProperty, images: [] });
    setShowForm(false);
    setUploadingImages(false);
  };

  const toggleTag = (tag: PropertyTag) => {
    setForm((prev) => {
      const current = prev.tags || [];
      return {
        ...prev,
        tags: current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
      };
    });
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedPaths: string[] = [];
      for (const file of files) {
        const response = await api.uploadMedia(file, "property");
        uploadedPaths.push(response.path);
      }

      setForm((prev) => ({
        ...prev,
        images: [...(prev.images ?? []), ...uploadedPaths],
      }));

      toast({
        title: "Photos uploaded",
        description: `${uploadedPaths.length} property photo${uploadedPaths.length > 1 ? "s have" : " has"} been added to this listing.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "We could not upload the selected photo right now. Please try again.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
      setUploadingImages(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images ?? []).filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.area) {
      toast({ title: "Missing details", description: "Please complete the title, area, and description fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateProperty(editing.id, form);
        toast({ title: "Property updated", description: "The listing has been saved to the database." });
      } else {
        await createProperty(form);
        toast({ title: "Property created", description: "The new listing is now live in the admin catalogue." });
      }
      closeForm();
    } catch (error) {
      toast({
        title: "Unable to save property",
        description: error instanceof Error ? error.message : "Please review the form and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty(id);
      toast({ title: "Property removed", description: "The listing has been deleted." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "This listing could not be removed right now.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Properties</h1>
            <p className="text-sm text-muted-foreground">
              {sortedProperties.length} listings in the database
              {loading.adminData ? " | refreshing..." : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
            <Plus className="mr-1 h-4 w-4" />
            Add Property
          </Button>
        </div>

        {showForm && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Listing" : "New Listing"}</h2>
                <p className="text-sm text-muted-foreground">Complete the listing details below. Everything here appears in your admin records and property pages.</p>
              </div>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <Label className={adminLabelClass}>Property title</Label>
                <input value={form.title || ""} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Eg. Executive 4 bedroom home at East Legon" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Category</Label>
                <select value={form.category || "houses"} onChange={(event) => setForm({ ...form, category: event.target.value })} className={adminInputClass}>
                  {categoryOptions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>Property type</Label>
                <select value={form.type || "house"} onChange={(event) => setForm({ ...form, type: event.target.value })} className={adminInputClass}>
                  {typeOptions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>Region</Label>
                <select value={form.region || "Greater Accra"} onChange={(event) => setForm({ ...form, region: event.target.value })} className={adminInputClass}>
                  {GHANA_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>City</Label>
                <input value={form.city || ""} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Eg. Accra" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Area or suburb</Label>
                <input value={form.area || ""} onChange={(event) => setForm({ ...form, area: event.target.value })} placeholder="Eg. Cantonments" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Street address</Label>
                <input value={form.address || ""} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Street address" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Sale price</Label>
                <input value={form.salePrice || ""} onChange={(event) => setForm({ ...form, salePrice: event.target.value ? Number(event.target.value) : undefined })} placeholder="Sale price in GHS" type="number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Monthly rent</Label>
                <input value={form.rentPrice || ""} onChange={(event) => setForm({ ...form, rentPrice: event.target.value ? Number(event.target.value) : undefined })} placeholder="Rent price in GHS" type="number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Rent advance in years</Label>
                <input value={form.rentAdvanceYears || ""} onChange={(event) => setForm({ ...form, rentAdvanceYears: event.target.value ? Number(event.target.value) : undefined })} placeholder="Eg. 1 or 2" type="number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Bedrooms</Label>
                <input value={form.bedrooms ?? 0} onChange={(event) => setForm({ ...form, bedrooms: Number(event.target.value) })} placeholder="Bedrooms" type="number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Bathrooms</Label>
                <input value={form.bathrooms ?? 0} onChange={(event) => setForm({ ...form, bathrooms: Number(event.target.value) })} placeholder="Bathrooms" type="number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Toilets</Label>
                <input value={form.toilets ?? 0} onChange={(event) => setForm({ ...form, toilets: Number(event.target.value) })} placeholder="Toilets" type="number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Parking spaces</Label>
                <input value={form.parkingSpaces ?? 0} onChange={(event) => setForm({ ...form, parkingSpaces: Number(event.target.value) })} placeholder="Parking spaces" type="number" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Land size</Label>
                <input value={form.landSize || ""} onChange={(event) => setForm({ ...form, landSize: event.target.value })} placeholder="Eg. 100 x 80 feet" className={adminInputClass} />
              </div>
              <div>
                <Label className={adminLabelClass}>Furnishing level</Label>
                <select value={form.furnished || "unfurnished"} onChange={(event) => setForm({ ...form, furnished: event.target.value as Property["furnished"] })} className={adminInputClass}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi-furnished">Semi furnished</option>
                  <option value="fully-furnished">Fully furnished</option>
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>Listing status</Label>
                <select value={form.status || "available"} onChange={(event) => setForm({ ...form, status: event.target.value as Property["status"] })} className={adminInputClass}>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
              <div>
                <Label className={adminLabelClass}>Assigned agent</Label>
                <select value={form.agentId || ""} onChange={(event) => setForm({ ...form, agentId: event.target.value })} className={adminInputClass}>
                  <option value="">Assign agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className={adminLabelClass}>Property description</Label>
              <textarea
                value={form.description || ""}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Write a clear summary buyers or tenants can trust."
                rows={5}
                className={`${adminInputClass} resize-none`}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className={adminLabelClass}>Property photos</Label>
                  <p className={adminHelpTextClass}>Upload clear exterior, interior, and compound photos. The first image becomes the cover photo.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  {uploadingImages ? "Uploading..." : "Upload photos"}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                </label>
              </div>

              {(form.images ?? []).length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(form.images ?? []).map((image, index) => (
                    <div key={`${image}-${index}`} className="overflow-hidden rounded-xl border border-border bg-background">
                      <div className="aspect-[4/3] bg-muted">
                        <img src={resolveMediaUrl(image)} alt={`Property photo ${index + 1}`} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3">
                        <p className="text-xs text-muted-foreground">{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</p>
                        <button type="button" onClick={() => removeImage(index)} className="text-xs font-medium text-destructive">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                  No photos uploaded yet.
                </div>
              )}
            </div>

            <div>
              <Label className={adminLabelClass}>Features</Label>
              <div className="flex flex-wrap gap-3 text-sm">
                {featureOptions.map((feature) => {
                  const selected = form.features?.includes(feature) ?? false;
                  return (
                    <label key={feature} className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          const current = form.features ?? [];
                          setForm({
                            ...form,
                            features: event.target.checked ? [...current, feature] : current.filter((item) => item !== feature),
                          });
                        }}
                      />
                      {feature.replace(/-/g, " ")}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className={adminLabelClass}>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      form.tags?.includes(tag) ? "border-gold bg-gold text-accent-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Search and social preview</h3>
                <p className={adminHelpTextClass}>These fields help search engines and shared links describe this property clearly.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className={adminLabelClass}>Meta title</Label>
                  <input value={form.metaTitle || ""} onChange={(event) => setForm({ ...form, metaTitle: event.target.value })} placeholder="Search result title" className={adminInputClass} />
                </div>
                <div>
                  <Label className={adminLabelClass}>Canonical URL</Label>
                  <input value={form.canonicalUrl || ""} onChange={(event) => setForm({ ...form, canonicalUrl: event.target.value })} placeholder="Optional canonical URL" className={adminInputClass} />
                </div>
              </div>
              <div>
                <Label className={adminLabelClass}>Meta description</Label>
                <textarea value={form.metaDescription || ""} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} rows={3} className={`${adminInputClass} resize-none`} />
              </div>
              <div>
                <Label className={adminLabelClass}>Open Graph image</Label>
                <input value={form.ogImage || ""} onChange={(event) => setForm({ ...form, ogImage: event.target.value })} placeholder="Leave blank to use the cover photo" className={adminInputClass} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || uploadingImages} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update Property" : "Create Property"}
              </Button>
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, city, area, category, or type"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as Property["status"] | "all")}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
            <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
              <option value="all">All regions</option>
              {GHANA_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            {properties.length === 0 ? "No properties found in the database yet." : "No properties match your current filters."}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="p-3 font-medium text-muted-foreground">Title</th>
                      <th className="p-3 font-medium text-muted-foreground">Location</th>
                      <th className="p-3 font-medium text-muted-foreground">Category</th>
                      <th className="p-3 font-medium text-muted-foreground">Status</th>
                      <th className="p-3 font-medium text-muted-foreground">Price</th>
                      <th className="p-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProperties.map((property) => (
                      <tr key={property.id} className="border-b border-border/50 align-top">
                        <td className="p-3">
                          <p className="font-medium text-foreground">{property.title}</p>
                          <p className="mt-1 text-xs capitalize text-muted-foreground">{property.type.replace(/-/g, " ")}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {property.area}, {property.city}
                          <div className="mt-1 text-xs">{property.region}</div>
                        </td>
                        <td className="p-3 capitalize text-muted-foreground">{property.category.replace(/-/g, " ")}</td>
                        <td className="p-3">
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium capitalize text-accent-foreground">
                            {property.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">GHS {(property.salePrice || property.rentPrice || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(property)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit property">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setPendingDeleteId(property.id)}
                              className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                              aria-label="Delete property"
                            >
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
        <ConfirmActionDialog
          open={Boolean(pendingDeleteId)}
          title="Delete property listing?"
          description="This will remove the listing, its images, and its public property page. This action cannot be undone."
          confirmLabel="Delete Listing"
          onOpenChange={(open) => {
            if (!open) setPendingDeleteId(null);
          }}
          onConfirm={() => {
            if (pendingDeleteId) {
              void handleDelete(pendingDeleteId);
            }
            setPendingDeleteId(null);
          }}
        />
      </div>
    </AdminLayout>
  );
}
