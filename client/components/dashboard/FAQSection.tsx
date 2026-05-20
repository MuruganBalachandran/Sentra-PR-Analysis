"use client";
import { useState } from "react";

const FAQ_DATA = {
  general: [
    { q: "What is Sentra?", a: "Sentra is an AI-powered code risk intelligence platform that analyzes pull requests to identify potential risks, security issues, and code quality concerns." },
    { q: "How does Sentra work?", a: "Sentra integrates with your GitHub repositories, analyzes PR changes using AI, and provides detailed risk assessments with severity ratings." },
    { q: "Is Sentra free to use?", a: "Sentra offers both free and premium plans. The free plan includes basic PR analysis features, while premium plans offer advanced features and higher usage limits." },
    { q: "What programming languages does Sentra support?", a: "Sentra supports all major programming languages including JavaScript, TypeScript, Python, Java, Go, Ruby, PHP, and more." },
    { q: "How do I get started with Sentra?", a: "Simply sign up for an account, connect your GitHub repository, and start analyzing pull requests immediately." },
    { q: "Can I use Sentra for private repositories?", a: "Yes, Sentra fully supports private repositories with enterprise-grade security and privacy." },
    { q: "Does Sentra store my code?", a: "Sentra only analyzes code temporarily and does not permanently store your source code. All analysis is done securely." },
    { q: "How accurate is Sentra's risk assessment?", a: "Sentra uses advanced AI models trained on millions of code samples, providing highly accurate risk assessments with continuous improvements." },
    { q: "Can I customize risk assessment rules?", a: "Yes, premium plans allow you to customize risk thresholds, severity levels, and analysis rules to match your team's needs." },
    { q: "Is there a mobile app for Sentra?", a: "Currently, Sentra is web-based and optimized for desktop browsers. Mobile support is planned for future releases." },
  ],
  github: [
    { q: "How do I connect my GitHub repository?", a: "Go to your profile settings, click 'Connect GitHub', authorize the Sentra app, and select the repositories you want to analyze." },
    { q: "What permissions does Sentra need?", a: "Sentra requires read access to repository contents and pull requests. We never request write access to your code." },
    { q: "Can I analyze PRs from multiple repositories?", a: "Yes, you can connect and analyze PRs from unlimited repositories on your account." },
    { q: "Does Sentra work with GitHub Enterprise?", a: "Yes, Sentra supports GitHub Enterprise with custom deployment options for enterprise customers." },
    { q: "How do I set up webhook integration?", a: "Install the Sentra GitHub App on your repository, and webhooks will be automatically configured to trigger analysis on new PRs." },
    { q: "Can I analyze PRs manually without webhooks?", a: "Yes, you can paste any GitHub PR URL into the Analyze page to get an instant risk assessment." },
    { q: "What happens when a PR is opened?", a: "Sentra automatically receives a webhook notification, analyzes the changes, and posts a risk assessment comment on the PR." },
    { q: "Can I disable automatic PR comments?", a: "Yes, you can configure notification settings to control when and how Sentra comments on your PRs." },
    { q: "Does Sentra work with GitHub Actions?", a: "Yes, Sentra can be integrated into your GitHub Actions workflows for automated PR analysis." },
    { q: "How do I disconnect a repository?", a: "Go to your profile settings, find the connected repository, and click 'Disconnect' to remove the integration." },
  ],
  gemini: [
    { q: "What is Gemini AI?", a: "Gemini is Google's advanced AI model that powers Sentra's intelligent code analysis and risk assessment capabilities." },
    { q: "Why does Sentra use Gemini?", a: "Gemini provides state-of-the-art natural language understanding and code analysis, enabling highly accurate risk detection." },
    { q: "How does Gemini analyze my code?", a: "Gemini processes code changes, understands context, identifies patterns, and generates detailed risk assessments based on best practices." },
    { q: "Is my code sent to Google?", a: "Code analysis is performed securely through Google's API with enterprise-grade encryption and privacy protections." },
    { q: "Can I use a different AI model?", a: "Currently, Sentra is optimized for Gemini. Support for additional AI models may be added in future releases." },
    { q: "How fast is Gemini analysis?", a: "Most PR analyses complete within 10-30 seconds, depending on the size and complexity of the changes." },
    { q: "Does Gemini learn from my code?", a: "No, Gemini does not train on your private code. Each analysis is independent and your code remains private." },
    { q: "What makes Gemini better than other AI models?", a: "Gemini excels at understanding code context, identifying subtle risks, and providing actionable insights with high accuracy." },
    { q: "Can Gemini detect security vulnerabilities?", a: "Yes, Gemini can identify common security issues, vulnerable patterns, and potential exploits in code changes." },
    { q: "How often is Gemini updated?", a: "Sentra uses the latest Gemini models, which are continuously improved by Google with regular updates." },
  ],
  security: [
    { q: "Is Sentra secure?", a: "Yes, Sentra implements enterprise-grade security with encryption, secure API access, and compliance with industry standards." },
    { q: "How is my data protected?", a: "All data is encrypted in transit and at rest. We follow SOC 2 and GDPR compliance standards." },
    { q: "Who can access my PR analyses?", a: "Only users with access to your Sentra account can view your PR analyses. Data is never shared with third parties." },
    { q: "Does Sentra comply with GDPR?", a: "Yes, Sentra is fully GDPR compliant with data protection, privacy controls, and user rights management." },
    { q: "Can I delete my data?", a: "Yes, you can delete your account and all associated data at any time from your profile settings." },
    { q: "How long is data retained?", a: "PR analyses are retained for 90 days by default. Enterprise plans offer custom retention policies." },
    { q: "Is two-factor authentication supported?", a: "Yes, Sentra supports 2FA with phone verification, authenticator apps, and backup codes for enhanced security." },
    { q: "What happens if there's a security breach?", a: "We have incident response procedures and will notify affected users immediately in compliance with regulations." },
    { q: "Can I audit Sentra's security?", a: "Enterprise customers can request security audits and compliance documentation. Contact our security team for details." },
    { q: "Does Sentra have a bug bounty program?", a: "Yes, we welcome responsible disclosure of security vulnerabilities. Visit our security page for details." },
  ],
};

export function FAQSection() {
  const [activeTab, setActiveTab] = useState<keyof typeof FAQ_DATA>("general");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const tabs: { key: keyof typeof FAQ_DATA; label: string; icon: string }[] = [
    { key: "general", label: "General", icon: "💡" },
    { key: "github", label: "GitHub PR", icon: "🔗" },
    { key: "gemini", label: "Gemini AI", icon: "🤖" },
    { key: "security", label: "Security", icon: "🔒" },
  ];

  return (
    <section style={{ width: "100%", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
          Frequently Asked Questions
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-muted)", maxWidth: 600, margin: "0 auto" }}>
          Find answers to common questions about Sentra, GitHub integration, AI analysis, and security.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        marginBottom: 32, 
        borderBottom: "2px solid var(--border)",
        overflowX: "auto",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setOpenIndex(null);
            }}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.key ? "3px solid #4f46e5" : "3px solid transparent",
              color: activeTab === tab.key ? "#4f46e5" : "var(--text-muted)",
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontSize: 15,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              marginBottom: -2,
            }}
          >
            <span style={{ marginRight: 8 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {FAQ_DATA[activeTab].map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              style={{
                marginBottom: 12,
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                background: "white",
              }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: isOpen ? "#f9fafb" : "white",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  transition: "background 0.2s",
                }}
              >
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: 15, 
                  color: "var(--text-primary)",
                  flex: 1
                }}>
                  {faq.q}
                </span>
                <span style={{ 
                  fontSize: 20, 
                  color: "var(--text-muted)",
                  transition: "transform 0.2s",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
                }}>
                  ⌄
                </span>
              </button>
              {isOpen && (
                <div style={{ 
                  padding: "16px 20px", 
                  borderTop: "1px solid var(--border)",
                  background: "white"
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: 14, 
                    lineHeight: 1.6, 
                    color: "var(--text-secondary)" 
                  }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
