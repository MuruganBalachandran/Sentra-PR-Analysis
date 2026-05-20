export const SEV: Record<string, { badgeCls: string; label: string; barColor: string; borderColor: string }> = {
  high:   { badgeCls: "bg-red-100 text-red-700",    label: "🔴 High",   barColor: "#ef4444", borderColor: "#fca5a5" },
  medium: { badgeCls: "bg-indigo-100 text-indigo-700", label: "🟡 Medium", barColor: "#4f46e5", borderColor: "#a5b4fc" },
  low:    { badgeCls: "bg-green-100 text-green-700", label: "🟢 Low",    barColor: "#059669", borderColor: "#6ee7b7" },
};

export function SeverityBadge({ sev }: { sev: string }) {
  const d = SEV[sev];
  if (!d) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${d.badgeCls}`}>
      {d.label}
    </span>
  );
}

export function SeverityBar({ sev }: { sev: string }) {
  const levels = ["low", "medium", "high"];
  const idx = levels.indexOf(sev);
  return (
    <div className="flex gap-1 items-center">
      {levels.map((l, i) => (
        <div
          key={l}
          className="h-1.5 w-5 rounded-sm"
          style={{ background: i <= idx ? (SEV[l]?.barColor || "#e5e7eb") : "#e5e7eb" }}
        />
      ))}
    </div>
  );
}

export function fmtDate(raw: string) {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return raw; }
}
