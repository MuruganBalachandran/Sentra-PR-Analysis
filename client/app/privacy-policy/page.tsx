import PageHeader from "@/components/common/PageHeader";
import { Footer } from "@/components/dashboard/Footer";

export default function PrivacyPolicyPage() {
  return (
    <main>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 20px 20px" }}>
        <PageHeader title="Privacy Policy" />
        
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 0, marginBottom: 16, color: "var(--text-primary)" }}>1. Introduction</h2>
          <p>
            Sentra ("we", "us", "our", or "Company") operates the Sentra website and application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>2. Information Collection and Use</h2>
          <p>
            We collect several different types of information for various purposes to provide and improve our Service to you.
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li><strong>Personal Data:</strong> Email address, name, GitHub username</li>
            <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time spent</li>
            <li><strong>Code Data:</strong> Pull request content for analysis purposes</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>3. Use of Data</h2>
          <p>
            Sentra uses the collected data for various purposes:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information to improve our Service</li>
            <li>To monitor the usage of our Service</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>4. Security of Data</h2>
          <p>
            The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>5. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@sentra.dev" style={{ color: "#4f46e5", textDecoration: "none" }}>privacy@sentra.dev</a>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
