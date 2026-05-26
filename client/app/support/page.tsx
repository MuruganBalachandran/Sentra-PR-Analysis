import PageHeader from "@/components/common/PageHeader";
import { Footer } from "@/components/dashboard/Footer";

export default function SupportPage() {
  return (
    <main>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 20px 20px" }}>
        <PageHeader title="Support" />
        
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p>
            We're here to help! If you have any questions or issues, please reach out to us.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Contact Us</h2>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li><strong>Email:</strong> <a href="mailto:support@sentra.dev" style={{ color: "#4f46e5", textDecoration: "none" }}>support@sentra.dev</a></li>
            <li><strong>GitHub Issues:</strong> <a href="https://github.com/sentra/issues" target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", textDecoration: "none" }}>Report an issue</a></li>
            <li><strong>Twitter:</strong> <a href="https://twitter.com/sentra" target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", textDecoration: "none" }}>@sentra</a></li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Frequently Asked Questions</h2>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>How does Sentra analyze code?</h3>
          <p>
            Sentra uses Google's Gemini AI to analyze code for security vulnerabilities, performance issues, readability problems, and architectural concerns. Our AI models are trained on millions of code samples and security best practices.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>Is my code secure?</h3>
          <p>
            Yes! We take security seriously. Your code is analyzed in real-time and never stored permanently. We use industry-standard encryption and follow GDPR compliance guidelines.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>What programming languages are supported?</h3>
          <p>
            Sentra supports analysis of code in JavaScript, TypeScript, Python, Java, C#, Go, Rust, and more. Our AI can understand most popular programming languages.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>How long does analysis take?</h3>
          <p>
            Most analyses complete within 15-30 seconds. Complex PRs with large diffs may take up to 60 seconds.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>Can I integrate Sentra with my CI/CD pipeline?</h3>
          <p>
            Yes! You can use our REST API to integrate Sentra into your CI/CD workflow. Check our <a href="/api-reference" style={{ color: "#4f46e5", textDecoration: "none" }}>API Reference</a> for details.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Response Time</h2>
          <p>
            We typically respond to support inquiries within 24 hours during business days.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
