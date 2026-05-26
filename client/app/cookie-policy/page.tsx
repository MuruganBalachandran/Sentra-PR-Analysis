import PageHeader from "@/components/common/PageHeader";
import { Footer } from "@/components/dashboard/Footer";

export default function CookiePolicyPage() {
  return (
    <main>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 20px 20px" }}>
        <PageHeader title="Cookie Policy" />
        
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 0, marginBottom: 16, color: "var(--text-primary)" }}>1. What Are Cookies?</h2>
          <p>
            Cookies are small pieces of data stored on your device when you visit a website. They help websites remember information about you, such as your login status and preferences.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>2. How We Use Cookies</h2>
          <p>
            Sentra uses cookies for the following purposes:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li><strong>Authentication:</strong> To keep you logged in to your account</li>
            <li><strong>Preferences:</strong> To remember your settings and preferences</li>
            <li><strong>Analytics:</strong> To understand how you use our service</li>
            <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>3. Types of Cookies We Use</h2>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>Performance Cookies</h3>
          <p>
            These cookies collect information about how you use our website, such as which pages you visit and how long you spend on them. This helps us improve our service.
          </p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>Functional Cookies</h3>
          <p>
            These cookies remember your choices to provide a personalized experience, such as your language preference or login information.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>4. Managing Cookies</h2>
          <p>
            You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit our website.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>5. Third-Party Cookies</h2>
          <p>
            In some special cases, we also use cookies provided by trusted third parties. The following third parties may set cookies on your device:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>Google Analytics - for website analytics</li>
            <li>GitHub - for authentication</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>6. Contact Us</h2>
          <p>
            If you have any questions about our Cookie Policy, please contact us at <a href="mailto:privacy@sentra.dev" style={{ color: "#4f46e5", textDecoration: "none" }}>privacy@sentra.dev</a>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
