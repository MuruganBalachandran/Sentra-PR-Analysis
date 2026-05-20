import { redirect } from "next/navigation";
import { serverAxios } from "@/lib/serverApi";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { DashCard } from "@/components/dashboard/DashCard";
import { HowItWorksSection } from "@/components/dashboard/HowItWorksSection";
import { FAQSection } from "@/components/dashboard/FAQSection";
import { Footer } from "@/components/dashboard/Footer";

const FEATURES = [
  { 
    href: "/analyze", 
    icon: "🔍", 
    title: "Analyze a PR", 
    desc: "Paste a GitHub PR link or code diff to get an instant AI risk assessment.", 
    accent: "#d97706", 
    bg: "#fef3c7" 
  },
  { 
    href: "/pr-analyses", 
    icon: "📋", 
    title: "PR Analyses", 
    desc: "View all past pull request risk assessments for your repositories.", 
    accent: "#4f46e5", 
    bg: "#eef2ff" 
  },
  { 
    href: "/profile", 
    icon: "👤", 
    title: "My Profile", 
    desc: "Manage your account details and update your password.", 
    accent: "#7c3aed", 
    bg: "#f5f3ff" 
  },
];

const HOW_IT_WORKS = [
  { step: "01", icon: "🔗", title: "Connect your repo", desc: "Install the Sentra GitHub App on your repository to enable webhook-triggered analysis on every PR." },
  { step: "02", icon: "🧠", title: "System Context is built", desc: "Sentra maps your modules, services, APIs, ownership boundaries, and critical paths into a System Context Graph." },
  { step: "03", icon: "🔍", title: "PR is evaluated", desc: "When a PR is opened, Sentra analyzes the changed files against the full system context — not just the files in isolation." },
  { step: "04", icon: "⚠️", title: "Risk report is generated", desc: "A severity-rated risk report is generated highlighting downstream impact, ownership violations, and safeguard removal." },
];

export default async function Home() {
  const api = await serverAxios();
  let profile: any = null;
  try {
    const res = await api.get("/auth/profile");
    profile = res.data?.response || res.data;
  } catch {
    redirect("/login");
  }

  const role = profile?.Role || "USER";
  const isAdmin = role === "ADMIN";
  const displayName = profile?.Name || profile?.Email || "there";

  return (
    <>
      <div>
        <WelcomeBanner displayName={displayName} isAdmin={isAdmin} />
        
        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
          {FEATURES.map((feature) => (
            <DashCard key={feature.href} {...feature} />
          ))}
        </div>
        
        {/* How It Works */}
        <HowItWorksSection steps={HOW_IT_WORKS} />
      </div>
      
      {/* FAQ Section - Full Width */}
      <div style={{ 
        marginLeft: "calc(-1 * var(--page-padding))", 
        marginRight: "calc(-1 * var(--page-padding))",
        background: "var(--bg)",
        padding: "60px var(--page-padding)"
      }}>
        <FAQSection />
      </div>
      
      {/* Footer - Full Width */}
      <div style={{ 
        marginLeft: "calc(-1 * var(--page-padding))", 
        marginRight: "calc(-1 * var(--page-padding))",
        marginBottom: "calc(-1 * var(--page-padding))"
      }}>
        <Footer />
      </div>
    </>
  );
}
