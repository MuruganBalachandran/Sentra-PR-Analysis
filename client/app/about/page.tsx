import { serverAxios } from "@/lib/serverApi";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

const FEATURES = [
  { icon: "🧠", title: "System Context Graph", desc: "Sentra constructs a dynamic model of your repository — modules, services, APIs and their relationships." },
  { icon: "🔍", title: "Risk Assessment", desc: "Each PR is evaluated against the system context to detect downstream impact, ownership violations, and safeguard removal." },
  { icon: "📊", title: "Impact-Based Scoring", desc: "Analyses are scored by severity (High / Medium / Low) based on architectural stability and business impact." },
  { icon: "🔔", title: "GitHub Integration", desc: "Connect your repositories via GitHub webhook to receive automated analyses on every pull request." },
  { icon: "⚡", title: "Gemini AI Powered", desc: "Leverages Google Gemini's advanced language models to understand code semantics and architectural patterns." },
  { icon: "🛡️", title: "Team Safety Net", desc: "Acts as a last-mile guardrail that catches risky PRs before they merge and cause production incidents." },
];

const STACK = [
  { label: "Frontend", value: "Next.js 15 (App Router) + TypeScript + Tailwind CSS" },
  { label: "Backend", value: "Node.js + Express + MongoDB" },
  { label: "AI", value: "Google Gemini Pro" },
  { label: "Auth", value: "JWT cookies (HTTP-only)" },
  { label: "State", value: "Redux Toolkit" },
  { label: "GitHub", value: "GitHub Webhooks + REST API" },
];

export default async function AboutPage() {
  const api = await serverAxios();
  try { await api.get("/auth/profile"); } catch { redirect("/login"); }

  return (
    <div>
      <PageHeader title="About Sentra" subtitle="Architectural risk intelligence for engineering teams." />

      {/* Hero */}
      <div
        className="relative rounded-2xl p-8 text-white overflow-hidden mb-6"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-24 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative max-w-2xl">
          <div className="text-4xl mb-4">🛡️</div>
          <h2 className="text-2xl font-extrabold mb-3 tracking-tight">What is Sentra?</h2>
          <p className="text-base opacity-90 leading-relaxed">
            Sentra is an AI-powered pull request risk analysis platform that helps engineering teams catch dangerous code changes before they reach production. Unlike traditional linters, Sentra understands your system's architecture — it knows which modules are fragile, who owns which services, and how components depend on each other.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[15px] font-semibold text-gray-900">Core Capabilities</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`p-5 flex gap-4 items-start ${i % 3 !== 2 ? "border-r border-gray-50" : ""} ${i < FEATURES.length - 3 ? "border-b border-gray-50" : ""}`}
            >
              <div className="text-2xl shrink-0">{f.icon}</div>
              <div>
                <p className="font-semibold text-[13px] text-gray-900 mb-1">{f.title}</p>
                <p className="text-[12px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Tech stack */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[15px] font-semibold text-gray-900">Technology Stack</p>
          </div>
          <div className="divide-y divide-gray-50">
            {STACK.map((s) => (
              <div key={s.label} className="flex items-start gap-5 px-5 py-3.5">
                <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">{s.label}</span>
                <span className="text-[13px] text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[15px] font-semibold text-gray-900">How It Works</p>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {[
              { n: "1", t: "Connect", d: "Install the Sentra GitHub App or configure webhooks for your repository." },
              { n: "2", t: "Build Context", d: "Sentra maps your codebase — modules, services, ownership, dependencies — into a structured System Context." },
              { n: "3", t: "Analyze PRs", d: "When a PR opens, Sentra cross-references changed files against the system context using Gemini AI." },
              { n: "4", t: "Get Reports", d: "Receive severity-rated risk reports with specific callouts for dangerous patterns." },
            ].map(({ n, t, d }) => (
              <div key={n} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[12px] font-bold shrink-0">{n}</div>
                <div>
                  <p className="font-semibold text-[13px] text-gray-900 mb-0.5">{t}</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-semibold text-gray-900">Ready to start catching risky PRs?</p>
          <p className="text-sm text-gray-500 mt-0.5">Run your first PR analysis in seconds — no configuration needed.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/analyze" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition no-underline">
            🔍 Analyze a PR
          </Link>
          <Link href="/pr-analyses" className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition no-underline">
            View past analyses
          </Link>
        </div>
      </div>
    </div>
  );
}
