import PageHeader from "@/components/common/PageHeader";
import { Footer } from "@/components/dashboard/Footer";

export default function APIReferencePage() {
  return (
    <main>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 20px 20px" }}>
        <PageHeader title="API Reference" />
        
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p>
            Sentra provides a REST API for programmatic access to PR analysis functionality.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Authentication</h2>
          <p>
            All API requests require authentication via JWT token in cookies. Include your authentication token with each request.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Endpoints</h2>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>Analyze Pull Request</h3>
          <p><strong>POST</strong> /api/pr-analyses/analyze</p>
          <p>Analyze a pull request for security vulnerabilities and code issues.</p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>List PR Analyses</h3>
          <p><strong>GET</strong> /api/pr-analyses</p>
          <p>Retrieve a list of PR analyses with optional filtering and pagination.</p>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12, color: "var(--text-primary)" }}>Delete PR Analysis</h3>
          <p><strong>DELETE</strong> /api/pr-analyses/:id</p>
          <p>Delete a specific PR analysis by ID.</p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Response Format</h2>
          <p>
            All responses are returned in JSON format with the following structure:
          </p>
          <pre style={{
            background: "#f3f4f6",
            padding: 16,
            borderRadius: 8,
            overflow: "auto",
            fontSize: 13,
            fontFamily: "monospace"
          }}>
{`{
  "status": "SUCCESS",
  "message": "Operation completed",
  "response": {
    "riskAnalysis": "...",
    "prComment": "...",
    "severity": "High|Medium|Low"
  }
}`}
          </pre>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Rate Limiting</h2>
          <p>
            API requests are rate-limited to 100 requests per hour per user. Exceeding this limit will return a 429 status code.
          </p>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Error Handling</h2>
          <p>
            Errors are returned with appropriate HTTP status codes and error messages in the response body.
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li><strong>400:</strong> Bad Request - Invalid parameters</li>
            <li><strong>401:</strong> Unauthorized - Invalid or expired token</li>
            <li><strong>403:</strong> Forbidden - Access denied</li>
            <li><strong>404:</strong> Not Found - Resource not found</li>
            <li><strong>500:</strong> Server Error - Internal server error</li>
          </ul>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16, color: "var(--text-primary)" }}>Need Help?</h2>
          <p>
            For detailed API documentation and examples, visit our <a href="/documentation" style={{ color: "#4f46e5", textDecoration: "none" }}>Documentation</a> or contact <a href="mailto:support@sentra.dev" style={{ color: "#4f46e5", textDecoration: "none" }}>support@sentra.dev</a>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
