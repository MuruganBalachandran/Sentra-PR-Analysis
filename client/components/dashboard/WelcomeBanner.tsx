import Link from "next/link";

type Props = { displayName: string; isAdmin: boolean };

export function WelcomeBanner({ displayName, isAdmin }: Props) {
  return (
    <div
      className="relative rounded-2xl p-7 text-white overflow-hidden mb-7"
      style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-5 -right-5 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 right-16 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80 mb-1.5">
          {isAdmin ? "Administrator" : "User"} Dashboard
        </p>
        <h1 className="text-[26px] font-extrabold mb-2 tracking-tight">
          Welcome back, {displayName} 👋
        </h1>
        <p className="text-sm opacity-85 mb-5 max-w-lg">
          Sentra helps your team catch high-risk pull requests before they reach production, using architectural context and business logic awareness.
        </p>
        <Link
          href="/analyze"
          className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-white/30 transition no-underline"
        >
          🔍 Analyze a PR →
        </Link>
      </div>
    </div>
  );
}
