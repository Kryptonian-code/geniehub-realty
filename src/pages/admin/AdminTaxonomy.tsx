import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, Tags, Trash2, WandSparkles, X } from "lucide-react";
import { adminInputClass, adminLabelClass } from "@/lib/adminForms";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import type { PropertyTaxonomyItem } from "@/types";

type TaxonomyKind = "categories" | "types" | "features";

const PAGE_SIZE = 8;

const taxonomyMeta: Record<TaxonomyKind, { title: string; help: string }> = {
  categories: { title: "Property Categories", help: "These are the broad groups used on listings and filters." },
  types: { title: "Property Types", help: "These define the actual property format, such as house or duplex." },
  features: { title: "Property Features", help: "These are the amenities and selling points editors can attach to listings." },
};

export default function AdminTaxonomy() {
  const { propertyCategories, propertyTypes, propertyFeatures, createTaxonomy, updateTaxonomy, deleteTaxonomy, seedTaxonomyDefaults } = useAdmin();
  const { toast } = useToast();
  const [activeKind, setActiveKind] = useState<TaxonomyKind>("categories");
  const [editing, setEditing] = useState<PropertyTaxonomyItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const collections: Record<TaxonomyKind, PropertyTaxonomyItem[]> = {
    categories: propertyCategories,
    types: propertyTypes,
    features: propertyFeatures,
  };

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = collections[activeKind];
    if (!term) return items;
    return items.filter((item) => item.name.toLowerCase().includes(term));
  }, [collections, activeKind, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredItems, page]);

  useEffect(() => {
    setPage(1);
  }, [activeKind, search]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setShowForm(true);
  };

  const openEdit = (item: PropertyTaxonomyItem) => {
    setEditing(item);
    setName(item.name);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setName("");
    setShowForm(false);
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await seedTaxonomyDefaults();
      toast({ title: "Ghana-ready starters added", description: "Categories, types, and useful property features have been added." });
    } catch (error) {
      toast({
        title: "Starter setup failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter a name before saving.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateTaxonomy(activeKind, editing.id, name.trim());
        toast({ title: "Item updated", description: "The change has been saved." });
      } else {
        await createTaxonomy(activeKind, name.trim());
        toast({ title: "Item created", description: "The new item is ready for use in property forms." });
      }
      closeForm();
    } catch (error) {
      toast({
        title: "Unable to save item",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTaxonomy(activeKind, id);
      toast({ title: "Item deleted", description: "The taxonomy item has been removed." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "The item could not be removed.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Property Taxonomy</h1>
            <p className="text-sm text-muted-foreground">Manage the categories, types, and features used throughout your property catalogue.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleSeedDefaults} disabled={seeding}>
              <WandSparkles className="mr-1 h-4 w-4" />
              {seeding ? "Adding..." : "Add Ghana-ready starters"}
            </Button>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-secondary">
              <Plus className="mr-1 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(taxonomyMeta) as TaxonomyKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                setActiveKind(kind);
                closeForm();
              }}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                activeKind === kind ? "border-gold bg-gold text-accent-foreground" : "border-border bg-card text-muted-foreground"
              }`}
            >
              {taxonomyMeta[kind].title}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <Tags className="mt-1 h-5 w-5 text-gold" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{taxonomyMeta[activeKind].title}</h2>
              <p className="text-sm text-muted-foreground">{taxonomyMeta[activeKind].help}</p>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Item" : "New Item"}</h2>
              <button onClick={closeForm} aria-label="Close form">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div>
              <Label className={adminLabelClass}>Name</Label>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter name" className={adminInputClass} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-secondary">
                {saving ? "Saving..." : editing ? "Update Item" : "Create Item"}
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
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${taxonomyMeta[activeKind].title.toLowerCase()}`} className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm" />
          </div>
          <p className="text-sm text-muted-foreground">{filteredItems.length} items</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-medium text-muted-foreground">Name</th>
                  <th className="p-3 font-medium text-muted-foreground">Usage</th>
                  <th className="p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="p-3 font-medium text-foreground">{item.name}</td>
                    <td className="p-3 text-muted-foreground">{item.usageCount ?? 0} linked records</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="rounded p-1.5 hover:bg-muted" aria-label="Edit item">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setPendingDeleteId(item.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete item">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      No items match your current view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        <ConfirmActionDialog
          open={Boolean(pendingDeleteId)}
          title="Delete taxonomy item?"
          description="This will remove the selected item from future property forms. Existing linked records may also lose that relationship."
          confirmLabel="Delete Item"
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
