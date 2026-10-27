import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import TopBar from "@/components/layout/TopBar";
import LoginForm from "./LoginForm";
import SiteFooter from "@/components/layout/SiteFooter";

export default function LoginPanel() {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <TopBar />

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <Card>
            <LoginForm />
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Need help?{" "}
              <Link
                to="/support"
                className="font-semibold text-primary hover:underline"
              >
                Contact Administrator
              </Link>
            </p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              GreatHire Teamora Internal Portal
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
