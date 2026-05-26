"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
};

export default function PageHeader({ title, subtitle, showBackButton = true }: Props) {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {showBackButton && (
          <button
            onClick={() => router.back()}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              background: isHovering ? "var(--surface-2)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            ← Back
          </button>
        )}
      </div>
      <h1 style={{ fontSize: 42, fontWeight: 700, margin: "0 0 8px 0" }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
