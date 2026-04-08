import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { adminHelpTextClass, adminInputClass, adminLabelClass } from "@/lib/adminForms";

export default function AdminSettings() {
  const { settings, updateSettings } = useAdmin();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(localSettings);
      toast({ title: "Settings updated", description: "Your website details have been saved." });
    } catch (error) {
      toast({ title: "Save failed", description: "Settings could not be updated right now.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Website Settings</h1>
          <p className="text-sm text-muted-foreground">Update the text and contact details people see on your website. No technical setup is needed here.</p>
        </div>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Homepage welcome message</h2>
            <p className="text-sm text-muted-foreground">This controls the main text people see first when they land on the website.</p>
          </div>
          <div>
            <Label className={adminLabelClass}>Main heading</Label>
            <input value={localSettings.heroTitle} onChange={(event) => setLocalSettings({ ...localSettings, heroTitle: event.target.value })} className={adminInputClass} />
          </div>
          <div>
            <Label className={adminLabelClass}>Short introduction</Label>
            <textarea
              value={localSettings.heroSubtitle}
              onChange={(event) => setLocalSettings({ ...localSettings, heroSubtitle: event.target.value })}
              rows={3}
              className={`${adminInputClass} resize-none`}
            />
            <p className={adminHelpTextClass}>Keep this clear and reassuring. It appears directly below the main heading.</p>
          </div>
          <div>
            <Label className={adminLabelClass}>About your company</Label>
            <textarea
              value={localSettings.aboutText}
              onChange={(event) => setLocalSettings({ ...localSettings, aboutText: event.target.value })}
              rows={5}
              className={`${adminInputClass} resize-none`}
            />
            <p className={adminHelpTextClass}>This is useful for your home page trust section and other company introductions.</p>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Business contact details</h2>
            <p className="text-sm text-muted-foreground">These details are used in the footer, contact sections, and enquiry prompts.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className={adminLabelClass}>Business name</Label>
              <input value={localSettings.companyName} onChange={(event) => setLocalSettings({ ...localSettings, companyName: event.target.value })} placeholder="Business name" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>Phone number</Label>
              <input value={localSettings.companyPhone} onChange={(event) => setLocalSettings({ ...localSettings, companyPhone: event.target.value })} placeholder="Phone number" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>Alternate phone number</Label>
              <input value={localSettings.companyAltPhone} onChange={(event) => setLocalSettings({ ...localSettings, companyAltPhone: event.target.value })} placeholder="Alternate phone number" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>Email address</Label>
              <input value={localSettings.companyEmail} onChange={(event) => setLocalSettings({ ...localSettings, companyEmail: event.target.value })} placeholder="Email address" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>WhatsApp number</Label>
              <input value={localSettings.whatsappNumber} onChange={(event) => setLocalSettings({ ...localSettings, whatsappNumber: event.target.value })} placeholder="WhatsApp number" className={adminInputClass} />
              <p className={adminHelpTextClass}>Use the full number so visitors can start a chat without errors.</p>
            </div>
            <div className="md:col-span-2">
              <Label className={adminLabelClass}>Office hours</Label>
              <input value={localSettings.officeHours} onChange={(event) => setLocalSettings({ ...localSettings, officeHours: event.target.value })} placeholder="Eg. Mon to Fri, 8:00 AM to 5:00 PM" className={adminInputClass} />
            </div>
            <div className="md:col-span-2">
              <Label className={adminLabelClass}>Google Maps embed URL</Label>
              <input value={localSettings.mapEmbedUrl} onChange={(event) => setLocalSettings({ ...localSettings, mapEmbedUrl: event.target.value })} placeholder="Paste the Google Maps embed URL here" className={adminInputClass} />
              <p className={adminHelpTextClass}>Use the iframe source URL only, not the full iframe code.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Homepage actions and trust content</h2>
            <p className="text-sm text-muted-foreground">These fields control the call to action buttons and trust-focused messaging on the public website.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className={adminLabelClass}>Primary button label</Label>
              <input value={localSettings.primaryCtaLabel} onChange={(event) => setLocalSettings({ ...localSettings, primaryCtaLabel: event.target.value })} placeholder="Browse Properties" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>Primary button link</Label>
              <input value={localSettings.primaryCtaLink} onChange={(event) => setLocalSettings({ ...localSettings, primaryCtaLink: event.target.value })} placeholder="/properties" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>Secondary button label</Label>
              <input value={localSettings.secondaryCtaLabel} onChange={(event) => setLocalSettings({ ...localSettings, secondaryCtaLabel: event.target.value })} placeholder="Speak to an Agent" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>Secondary button link</Label>
              <input value={localSettings.secondaryCtaLink} onChange={(event) => setLocalSettings({ ...localSettings, secondaryCtaLink: event.target.value })} placeholder="/contact" className={adminInputClass} />
            </div>
            <div className="md:col-span-2">
              <Label className={adminLabelClass}>Trust section heading</Label>
              <input value={localSettings.trustSectionTitle} onChange={(event) => setLocalSettings({ ...localSettings, trustSectionTitle: event.target.value })} placeholder="Why Clients Choose Us" className={adminInputClass} />
            </div>
            <div className="md:col-span-2">
              <Label className={adminLabelClass}>Trust section intro</Label>
              <textarea
                value={localSettings.trustSectionIntro}
                onChange={(event) => setLocalSettings({ ...localSettings, trustSectionIntro: event.target.value })}
                rows={3}
                className={`${adminInputClass} resize-none`}
              />
            </div>
            <div className="md:col-span-2">
              <Label className={adminLabelClass}>Footer text</Label>
              <textarea
                value={localSettings.footerText}
                onChange={(event) => setLocalSettings({ ...localSettings, footerText: event.target.value })}
                rows={3}
                className={`${adminInputClass} resize-none`}
              />
            </div>
            <div className="md:col-span-2">
              <Label className={adminLabelClass}>Homepage badges</Label>
              <textarea
                value={localSettings.homepageBadges.join("\n")}
                onChange={(event) => setLocalSettings({ ...localSettings, homepageBadges: event.target.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) })}
                rows={4}
                className={`${adminInputClass} resize-none`}
              />
              <p className={adminHelpTextClass}>Enter one badge per line. These appear above the main homepage buttons.</p>
            </div>
            <div className="md:col-span-2">
              <Label className={adminLabelClass}>Popular locations</Label>
              <textarea
                value={localSettings.popularLocations.join("\n")}
                onChange={(event) => setLocalSettings({ ...localSettings, popularLocations: event.target.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) })}
                rows={6}
                className={`${adminInputClass} resize-none`}
              />
              <p className={adminHelpTextClass}>Enter one location per line. These power the homepage locations section.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Social media links</h2>
            <p className="text-sm text-muted-foreground">Paste your full page links here. Leave any platform blank if you do not use it.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className={adminLabelClass}>Facebook page link</Label>
              <input value={localSettings.socialLinks.facebook || ""} onChange={(event) => setLocalSettings({ ...localSettings, socialLinks: { ...localSettings.socialLinks, facebook: event.target.value } })} placeholder="https://facebook.com/yourpage" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>Instagram page link</Label>
              <input value={localSettings.socialLinks.instagram || ""} onChange={(event) => setLocalSettings({ ...localSettings, socialLinks: { ...localSettings.socialLinks, instagram: event.target.value } })} placeholder="https://instagram.com/yourpage" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>X or Twitter link</Label>
              <input value={localSettings.socialLinks.twitter || ""} onChange={(event) => setLocalSettings({ ...localSettings, socialLinks: { ...localSettings.socialLinks, twitter: event.target.value } })} placeholder="https://x.com/yourpage" className={adminInputClass} />
            </div>
            <div>
              <Label className={adminLabelClass}>LinkedIn page link</Label>
              <input value={localSettings.socialLinks.linkedin || ""} onChange={(event) => setLocalSettings({ ...localSettings, socialLinks: { ...localSettings.socialLinks, linkedin: event.target.value } })} placeholder="https://linkedin.com/company/yourpage" className={adminInputClass} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Google search preview</h2>
            <p className="text-sm text-muted-foreground">These fields help search engines show a better title and summary for your website.</p>
          </div>
          <div>
            <Label className={adminLabelClass}>Search page title</Label>
            <input value={localSettings.seoTitle} onChange={(event) => setLocalSettings({ ...localSettings, seoTitle: event.target.value })} className={adminInputClass} />
          </div>
          <div>
            <Label className={adminLabelClass}>Search page description</Label>
            <textarea
              value={localSettings.seoDescription}
              onChange={(event) => setLocalSettings({ ...localSettings, seoDescription: event.target.value })}
              rows={3}
              className={`${adminInputClass} resize-none`}
            />
          </div>
        </section>

        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-secondary">
          {saving ? "Saving..." : "Save Website Settings"}
        </Button>
      </div>
    </AdminLayout>
  );
}
