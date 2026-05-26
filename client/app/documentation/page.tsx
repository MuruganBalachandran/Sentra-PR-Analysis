import PageHeader from "@/components/common/PageHeader";
import { Footer } from "@/components/dashboard/Footer";

export default function DocumentationPage() {
  return (
    <main>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 20px 20px" }}>
        <PageHeader title="Documentation" />
        
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 0, marginBottom: 16, color: "var(--text-primary)" }}>Getting Started</h2>
          <p>
            Welcome to Sentra! This guide will help you get started with analyzing pull requests for security vulnerabilities.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>1. Create an Account</h3>
          <p>
            Sign up for a Sentra account to get started. You'll need a GitHub account to authenticate.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>2. Analyze a Pull Request</h3>
          <p>
            Navigate to the "Analyze PR" page and choose one of two modes:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li><strong>GitHub PR URL:</strong> Paste a GitHub PR URL for quick analysis</li>
            <li><strong>Manual Code Diff:</strong> Paste code diff for detailed analysis with context</li>
          </ul>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>3. Review Results</h3>
          <p>
            Sentra will analyze your code and provide:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>🔒 Security Issues - Potential vulnerabilities and risks</li>
            <li>💡 Suggestions - Actionable fixes with code examples</li>
            <li>📊 Risk Assessment - Overall severity and impact</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Analysis Categories</h2>
          <p>
            Sentra analyzes code across four main categories:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li><strong>Security Issues:</strong> SQL injection, XSS, authentication flaws, etc.</li>
            <li><strong>Performance Issues:</strong> N+1 queries, memory leaks, inefficient algorithms</li>
            <li><strong>Readability Issues:</strong> Code clarity, naming conventions, documentation</li>
            <li><strong>Architecture Issues:</strong> Design patterns, scalability, maintainability</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Need Help?</h2>
          <p>
            Check out our <a href="/support" style={{ color: "#4f46e5", textDecoration: "none" }}>Support page</a> or contact us at support@sentra.dev
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
