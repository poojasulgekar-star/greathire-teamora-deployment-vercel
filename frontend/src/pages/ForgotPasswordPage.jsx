
import { Lock } from "lucide-react";
import HeroPanel from "@/components/sections/HeroPanel";
import TopBar from "@/components/layout/TopBar";
import SiteFooter from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/card";
import ForgotPasswordForm from "@/components/sections/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <HeroPanel />
      <div className="flex h-full flex-col bg-white dark:bg-slate-900">
        <TopBar />
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 sm:px-10">
          <div className="w-full max-w-[430px]">
            <Card>
              <ForgotPasswordForm />
            </Card>
            <div className="mt-6 text-center">
              <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
                <Lock className="h-3 w-3" />
                ENTERPRISE-GRADE ENCRYPTION
              </p>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    </div>
  );
}
