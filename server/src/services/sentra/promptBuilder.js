const normalizeBlock = (v) => {
    if (v === null || v === undefined) return "N/A";
    if (Array.isArray(v)) return v.length ? v.join("\n") : "N/A";
    if (typeof v === "object") return JSON.stringify(v, null, 2);
    const s = String(v).trim();
    return s.length ? s : "N/A";
};

const buildRiskAnalysisPrompt = (ctx = {}) => {
    const repoSummary = normalizeBlock(ctx.repoSummary);
    const criticalModules = normalizeBlock(ctx.criticalModules);
    const ownershipMap = normalizeBlock(ctx.ownershipMap);
    const fragileModules = normalizeBlock(ctx.fragileModules);
    const dependencyGraph = normalizeBlock(ctx.dependencyGraph);
    const prTitle = normalizeBlock(ctx.prTitle);
    const prDescription = normalizeBlock(ctx.prDescription);
    const changedFiles = normalizeBlock(ctx.changedFiles);
    const codeDiff = normalizeBlock(ctx.codeDiff);

    const header =
        "You are Sentra, a context-aware pull request review assistant designed to evaluate the architectural and business impact of code changes within a software system.\n\n" +
        "You do not review code for formatting or stylistic issues.\n\n" +
        "You evaluate pull requests based on:\n\n" +
        "- system dependencies\n" +
        "- architectural boundaries\n" +
        "- ownership awareness\n" +
        "- business logic flow\n" +
        "- critical execution paths\n" +
        "- removal of safeguards\n" +
        "- downstream module impact\n" +
        "- behavioral consistency\n\n" +
        "Your objective is to identify whether the proposed code changes may introduce functional instability or affect critical workflows such as authentication, billing, payments, inventory, or settlement logic.\n\n" +
        "Focus only on logic-level and system-level risks.\n\n" +
        "Ignore naming conventions or formatting.\n\n";

    const dynamic =
        "Repository Summary:\n" +
        repoSummary +
        "\n\n" +
        "Critical Modules:\n" +
        criticalModules +
        "\n\n" +
        "Module Ownership Map:\n" +
        ownershipMap +
        "\n\n" +
        "Previously Fragile Modules:\n" +
        fragileModules +
        "\n\n" +
        "Dependency Graph:\n" +
        dependencyGraph +
        "\n\n" +
        "Pull Request Title:\n" +
        prTitle +
        "\n\n" +
        "Pull Request Description:\n" +
        prDescription +
        "\n\n" +
        "Changed Files:\n" +
        changedFiles +
        "\n\n" +
        "Code Diff:\n" +
        codeDiff +
        "\n\n";

    const instruction =
        "Analyze the pull request using the repository context provided above.\n\n" +
        "Identify:\n\n" +
        "1. Changes affecting critical business or execution flows\n" +
        "2. Dependency impact across modules or services\n" +
        "3. Ownership boundary violations\n" +
        "4. Removal of safeguards introduced in prior fixes\n" +
        "5. Business logic sequencing risks\n" +
        "6. Public API or DB interaction changes\n" +
        "7. Behavioral inconsistencies across modules\n\n" +
        "Return the response in a clean, standard Markdown format using headings (H3), bullet points, and bold text for better readability.\n\n" +
        "Include the following sections:\n\n" +
        "### 🔍 Risk Assessment\n" +
        "- **Risk Type:**\n" +
        "- **Affected Module:**\n" +
        "- **Possible System Impact:**\n" +
        "- **Severity Level:** (Low / Medium / High)\n\n" +
        "### 🛠 Mistakes & Suggestions\n" +
        "(Provide clear, bulleted feedback on what is wrong or risky, and actionable suggestions to fix it)\n\n" +
        "### 🚀 Improvements\n" +
        "(Provide architectural or code-level improvements to make the change safer, faster, or more scalable)\n";

    return header + dynamic + instruction;
};

const buildPrCommentPrompt = (riskAnalysis = "") => {
    const normalized = normalizeBlock(riskAnalysis);
    const prompt =
        "Convert the following pull request risk assessment into a clean, well-formatted GitHub PR comment.\n\n" +
        "Explain clearly using standard Markdown (use headings like ###, bullet points, bolding for emphasis):\n\n" +
        "### ⚠️ Detected Change\n" +
        "(Summarize what was detected)\n\n" +
        "### 🚨 Why it Matters\n" +
        "(Explain the system behavior that may be affected)\n\n" +
        "### 💡 Mistakes & Suggestions\n" +
        "(Explicitly list what mistakes were made and suggest how to resolve them)\n\n" +
        "### ✨ Improvements\n" +
        "(Provide recommendations to improve the architecture or logic)\n\n" +
        "Keep the tone professional, objective, and highly structured so it is easy to read.\n\n" +
        "Context to base the comment on:\n" +
        normalized +
        "\n";
    return prompt;
};

export { buildRiskAnalysisPrompt, buildPrCommentPrompt };

