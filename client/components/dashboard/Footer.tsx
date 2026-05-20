"use client";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      marginTop: 80,
      paddingTop: 40,
      paddingBottom: 40,
      borderTop: "2px solid var(--border)",
      background: "#f9fafb"
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 20px"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 40,
          marginBottom: 40
        }}>
          {/* About Section */}
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16
            }}>
              About Sentra
            </h3>
            <p style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              marginBottom: 16
            }}>
              AI-powered code risk intelligence platform that helps teams identify and prevent security vulnerabilities in pull requests.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 24,
                color: "var(--text-muted)",
                transition: "color 0.2s"
              }}>
                🔗
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 24,
                color: "var(--text-muted)",
                transition: "color 0.2s"
              }}>
                🐦
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 24,
                color: "var(--text-muted)",
                transition: "color 0.2s"
              }}>
                💼
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16
            }}>
              Quick Links
            </h3>
            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0
            }}>
              {[
                { href: "/", label: "Dashboard" },
                { href: "/analyze", label: "Analyze PR" },
                { href: "/pr-analyses", label: "PR Analyses" },
                { href: "/profile", label: "My Profile" },
              ].map((link) => (
                <li key={link.href} style={{ marginBottom: 12 }}>
                  <Link href={link.href} style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.2s"
                  }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16
            }}>
              Resources
            </h3>
            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0
            }}>
              {[
                { href: "/about", label: "About Us" },
                { href: "#", label: "Documentation" },
                { href: "#", label: "API Reference" },
                { href: "#", label: "Support" },
              ].map((link) => (
                <li key={link.href} style={{ marginBottom: 12 }}>
                  <Link href={link.href} style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.2s"
                  }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16
            }}>
              Legal
            </h3>
            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0
            }}>
              {[
                { href: "#", label: "Privacy Policy" },
                { href: "#", label: "Terms of Service" },
                { href: "#", label: "Cookie Policy" },
                { href: "#", label: "Security" },
              ].map((link) => (
                <li key={link.href} style={{ marginBottom: 12 }}>
                  <Link href={link.href} style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.2s"
                  }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: 32,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16
        }}>
          <p style={{
            fontSize: 14,
            color: "var(--text-muted)",
            margin: 0
          }}>
            © {currentYear} Sentra. All rights reserved.
          </p>
          <p style={{
            fontSize: 14,
            color: "var(--text-muted)",
            margin: 0
          }}>
            Powered by <span style={{ fontWeight: 600, color: "#4f46e5" }}>Gemini AI</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
