"use client";

type Card = { icon: string; title: string; desc: string; accent: string; bg: string };

export function DashCard({ icon, title, desc, accent, bg }: Card) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "20px",
        background: "white",
        border: "1px solid #f3f4f6",
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
          background: bg,
          color: accent,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", marginBottom: "4px", margin: 0 }}>
          {title}
        </p>
        <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.6", margin: 0 }}>
          {desc}
        </p>
      </div>
    </div>
  );
}
