import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function LoginForm() {
  let navigate = useNavigate();
  let { login } = useAuth();
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [showPassword, setShowPassword] = useState(false);
  let [rememberMe, setRememberMe] = useState(false);
  let [error, setError] = useState("");
  let [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    // Prevent multiple simultaneous login requests
    if (submitting) return;

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login({
        email: normalizedEmail,
        password,
        rememberMe,
      });

      if (!loggedInUser) {
        throw new Error("Login succeeded but user details were not returned.");
      }

      navigate(
        loggedInUser.role === "admin"
          ? "/dashboard"
          : "/employee-dashboard",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.message || "Unable to sign in. Please check your credentials and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 sm:p-9">
      <Badge className="bg-secondary text-primary">WELCOME BACK</Badge>

      <h2 className="mt-4 text-[26px] font-bold leading-tight text-slate-900 dark:text-white">
        Sign in to Teamora
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in using your company account.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-2">
        <Label htmlFor="email">Work Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200"
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-2.5">
        <Checkbox
          checked={rememberMe}
          onCheckedChange={setRememberMe}
        />
        <span className="text-sm text-slate-600 dark:text-slate-300">Remember me for 30 days</span>
      </label>

      <Button type="submit" size="lg" className="mt-6 w-full text-[15px]" disabled={submitting}>
        {submitting ? "Signing In..." : "Sign In"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
