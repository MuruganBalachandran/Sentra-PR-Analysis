import PageHeader from "@/components/common/PageHeader";
import { Footer } from "@/components/dashboard/Footer";

export default function TermsOfServicePage() {
  return (
    <main>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 20px 20px" }}>
        <PageHeader title="Terms of Service" />
        
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 0, marginBottom: 16, color: "var(--text-primary)" }}>1. Agreement to Terms</h2>
          <p>
            By accessing and using the Sentra website and application, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on Sentra's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on the website</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>3. Disclaimer</h2>
          <p>
            The materials on Sentra's website are provided on an 'as is' basis. Sentra makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>4. Limitations</h2>
          <p>
            In no event shall Sentra or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Sentra's website.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on Sentra's website could include technical, typographical, or photographic errors. Sentra does not warrant that any of the materials on its website are accurate, complete, or current. Sentra may make changes to the materials contained on its website at any time without notice.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>6. Links</h2>
          <p>
            Sentra has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Sentra of the site. Use of any such linked website is at the user's own risk.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>7. Modifications</h2>
          <p>
            Sentra may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Sentra operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>9. Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at <a href="mailto:legal@sentra.dev" style={{ color: "#4f46e5", textDecoration: "none" }}>legal@sentra.dev</a>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
