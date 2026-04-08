import { Link } from "react-router-dom";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary px-4">
      <SeoMeta title="Page Not Found | GenieHub Realty" description="The page you requested could not be found." robots="noindex, nofollow" />
      <div className="w-full max-w-xl rounded-3xl border border-primary-foreground/10 bg-card p-8 text-center shadow-xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-gold">404</p>
        <h1 className="mb-4 text-3xl font-bold text-foreground">We could not find that page</h1>
        <p className="mb-8 text-muted-foreground">
          The page may have moved, the link may be outdated, or the address may have been typed incorrectly.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/">
            <Button className="bg-primary text-primary-foreground hover:bg-secondary">Back to Homepage</Button>
          </Link>
          <Link to="/properties">
            <Button variant="outline">Browse Properties</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
