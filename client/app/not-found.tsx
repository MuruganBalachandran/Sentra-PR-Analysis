import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        textAlign: "center",
        color: "white",
        maxWidth: "600px"
      }}>
        <h1 style={{
          fontSize: "120px",
          fontWeight: "bold",
          margin: "0",
          lineHeight: "1"
        }}>404</h1>
        <h2 style={{
          fontSize: "32px",
          fontWeight: "600",
          margin: "20px 0",
        }}>Page Not Found</h2>
        <p style={{
          fontSize: "18px",
          marginBottom: "40px",
          opacity: 0.9
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            background: "white",
            color: "#667eea",
            borderRadius: "8px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
