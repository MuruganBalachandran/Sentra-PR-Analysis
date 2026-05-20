import { redirect } from "next/navigation";
import { serverAxios } from "@/lib/serverApi";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { DashCard } from "@/components/dashboard/DashCard";
import { HowItWorksSection } from "@/components/dashboard/HowItWorksSection";
import { FAQSection } from "@/components/dashboard/FAQSection";
import { Footer } from "@/components/dashboard/Footer";

const FEATURES = [
  { 
    icon: "🔍", 
    title: "Analyze a PR", 
    desc: "Paste a GitHub PR link or code diff to get an instant AI risk assessment.", 
    accent: "#d97706", 
    bg: "#fef3c7" 
  },
  { 
    icon: "📋", 
    title: "PR Analyses", 
    desc: "View all past pull request risk assessments for your repositories.", 
    accent: "#4f46e5", 
    bg: "#eef2ff" 
  },
  { 
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
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            background: "white",
            border: "1px solid #f3f4f6",
            borderRadius: "12px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid #f3f4f6"
            }}>
              <p style={{ 
                fontSize: "15px", 
                fontWeight: 600, 
                color: "#111827",
                margin: 0
              }}>
                Features
              </p>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "0"
            }}>
              {FEATURES.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    padding: "24px",
                    borderRight: index < FEATURES.length - 1 ? "1px solid #f3f4f6" : "none"
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      background: feature.bg,
                      color: feature.accent,
                      marginBottom: "12px"
                    }}
                  >
                    {feature.icon}
                  </div>
                  <p style={{ 
                    fontSize: "13px", 
                    fontWeight: 600, 
                    color: "#111827", 
                    marginBottom: "6px",
                    margin: "0 0 6px 0"
                  }}>
                    {feature.title}
                  </p>
                  <p style={{ 
                    fontSize: "12px", 
                    color: "#6b7280", 
                    lineHeight: "1.6", 
                    margin: 0 
                  }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
