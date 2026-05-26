import PageHeader from "@/components/common/PageHeader";
import { Footer } from "@/components/dashboard/Footer";

export default function SecurityPage() {
  return (
    <main>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 20px 20px" }}>
        <PageHeader title="Security" />
        
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p>
            At Sentra, security is our top priority. We implement industry-leading security practices to protect your data and ensure the integrity of our platform.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Security Measures</h2>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>🔐 Encryption</h3>
          <p>
            All data transmitted between your browser and our servers is encrypted using TLS 1.2 or higher. Sensitive data is encrypted at rest using AES-256 encryption.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>🔑 Authentication</h3>
          <p>
            We use secure JWT-based authentication with industry-standard practices. Passwords are hashed using bcrypt with a salt factor of 10.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>🛡️ Access Control</h3>
          <p>
            We implement role-based access control (RBAC) to ensure users can only access data they're authorized to view. All API endpoints require authentication.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>📊 Monitoring</h3>
          <p>
            Our systems are continuously monitored for suspicious activity. We maintain detailed audit logs of all user actions and API calls.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>🔄 Regular Updates</h3>
          <p>
            We regularly update our dependencies and apply security patches. Our infrastructure is regularly scanned for vulnerabilities.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Data Protection</h2>
          <p>
            Your code and analysis results are treated with the highest level of confidentiality. We:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>Never share your data with third parties without explicit consent</li>
            <li>Comply with GDPR and other data protection regulations</li>
            <li>Allow you to delete your data at any time</li>
            <li>Maintain regular backups for disaster recovery</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Reporting Security Issues</h2>
          <p>
            If you discover a security vulnerability, please report it responsibly to <a href="mailto:security@sentra.dev" style={{ color: "#4f46e5", textDecoration: "none" }}>security@sentra.dev</a>. We appreciate your help in keeping Sentra secure.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Compliance</h2>
          <p>
            Sentra complies with:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>GDPR (General Data Protection Regulation)</li>
            <li>CCPA (California Consumer Privacy Act)</li>
            <li>SOC 2 Type II standards</li>
            <li>OWASP Top 10 security guidelines</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Contact Us</h2>
          <p>
            For security-related questions, please contact us at <a href="mailto:security@sentra.dev" style={{ color: "#4f46e5", textDecoration: "none" }}>security@sentra.dev</a>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
