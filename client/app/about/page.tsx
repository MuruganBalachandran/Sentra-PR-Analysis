import PageHeader from "@/components/common/PageHeader";
import { Footer } from "@/components/dashboard/Footer";

export default function AboutPage() {
  return (
    <main>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 20px 20px" }}>
        <PageHeader title="About Sentra" />
        
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 40 }}>
          <p>
            Sentra is an AI-powered code risk intelligence platform designed to help development teams identify and prevent security vulnerabilities in pull requests before they reach production.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Our Mission</h2>
          <p>
            We believe that security should be integrated into the development workflow, not added as an afterthought. By leveraging advanced AI analysis, we help teams catch vulnerabilities early, reduce security risks, and maintain code quality.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Key Features</h2>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>🔍 Intelligent PR Analysis - AI-powered code review for security issues</li>
            <li>⚡ Real-time Feedback - Get instant insights on code changes</li>
            <li>🛡️ Security First - Identify vulnerabilities before deployment</li>
            <li>📊 Risk Assessment - Comprehensive severity and impact analysis</li>
            <li>🔗 GitHub Integration - Seamless integration with your workflow</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Powered by Gemini AI</h2>
          <p>
            Sentra uses Google's Gemini AI to provide state-of-the-art code analysis. Our AI models are trained to understand security patterns, best practices, and potential vulnerabilities across multiple programming languages.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
