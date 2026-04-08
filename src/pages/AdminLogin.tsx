import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const { login, bootstrapAdmin, isAuthenticated, isBootstrapping } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [setupForm, setSetupForm] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    document.title = "Admin Login | GenieHub Realty";
  }, []);

  useEffect(() => {
    const loadSetupStatus = async () => {
      setCheckingSetup(true);
      try {
        const response = await api.getSetupStatus();
        setHasAdmin(response.has_admin);
      } catch (error) {
        setHasAdmin(true);
      } finally {
        setCheckingSetup(false);
      }
    };

    loadSetupStatus();
  }, []);

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const success = await login(loginForm.username, loginForm.password);
      if (success) {
        toast({ title: "Login successful", description: "Welcome back to the GenieHub admin workspace." });
        navigate("/admin", { replace: true });
      } else {
        toast({ title: "Login failed", description: "Invalid username or password.", variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (setupForm.password !== setupForm.confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please make sure both password fields are the same.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const success = await bootstrapAdmin({
        username: setupForm.username,
        displayName: setupForm.displayName,
        email: setupForm.email || undefined,
        password: setupForm.password,
      });

      if (success) {
        toast({ title: "Admin account created", description: "Your first admin login is now ready and you have been signed in." });
        navigate("/admin", { replace: true });
      } else {
        toast({ title: "Setup failed", description: "The first admin account could not be created.", variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showingSetup = !checkingSetup && !hasAdmin;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-border bg-card shadow-sm lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-primary px-8 py-10 text-primary-foreground lg:px-10 lg:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Admin Access
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-tight lg:text-4xl">GenieHub Realty Admin Console</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/80">
            {showingSetup
              ? "This installation does not have an admin account yet. Create the first login to unlock the dashboard."
              : "Sign in with your admin username and password to manage listings, agents, leads, FAQs, offices, and site settings."}
          </p>
          <div className="mt-10 grid gap-4 text-sm text-primary-foreground/78">
            <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/6 p-4">
              <p className="font-semibold text-primary-foreground">Session-based access</p>
              <p className="mt-1">Your admin session is restored automatically after refresh, following the same session flow used in your school project.</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/6 p-4">
              <p className="font-semibold text-primary-foreground">First-time setup</p>
              <p className="mt-1">A seeded admin is no longer required. The first user creates the local admin account from this screen.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              {showingSetup ? "First Admin Setup" : "Admin Login"}
            </p>
            <h2 className="mt-3 text-2xl font-bold text-foreground">
              {showingSetup ? "Create the first admin account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {checkingSetup
                ? "Checking installation status..."
                : showingSetup
                  ? "Set the username and password that should own this installation."
                  : "Sign in with your existing admin username."}
            </p>

            {showingSetup ? (
              <form onSubmit={handleSetupSubmit} className="mt-8 space-y-5">
                <div>
                  <Label htmlFor="setup-username">Username</Label>
                  <Input
                    id="setup-username"
                    value={setupForm.username}
                    onChange={(event) => setSetupForm((prev) => ({ ...prev, username: event.target.value }))}
                    autoComplete="username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="setup-display-name">Display Name</Label>
                  <Input
                    id="setup-display-name"
                    value={setupForm.displayName}
                    onChange={(event) => setSetupForm((prev) => ({ ...prev, displayName: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="setup-email">Email</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={setupForm.email}
                    onChange={(event) => setSetupForm((prev) => ({ ...prev, email: event.target.value }))}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="setup-password">Password</Label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={setupForm.password}
                    onChange={(event) => setSetupForm((prev) => ({ ...prev, password: event.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="setup-confirm-password">Confirm Password</Label>
                  <Input
                    id="setup-confirm-password"
                    type="password"
                    value={setupForm.confirmPassword}
                    onChange={(event) => setSetupForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting || checkingSetup || isBootstrapping} className="w-full bg-primary text-primary-foreground hover:bg-secondary">
                  {submitting ? "Creating account..." : "Create Admin Account"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="mt-8 space-y-5">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={loginForm.username}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                    autoComplete="username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting || checkingSetup || isBootstrapping} className="w-full bg-primary text-primary-foreground hover:bg-secondary">
                  {submitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/" className="font-medium text-primary hover:text-secondary">
                Return to website
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
