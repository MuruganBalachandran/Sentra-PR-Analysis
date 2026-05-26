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
        "You are Sentra, an expert code reviewer analyzing pull requests for specific mistakes and issues.\n\n" +
        "Your task is to identify concrete problems in the code organized by category.\n\n";

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
        "Analyze the code diff and identify SPECIFIC MISTAKES organized by category.\n\n" +
        "Return ONLY the following structure in Markdown:\n\n" +
        "## 🔒 Security Issues\n" +
        "If issues found, list each one:\n" +
        "- **Mistake**: [Specific security problem found]\n" +
        "- **Location**: [Where in code]\n" +
        "- **Risk**: [Why this is dangerous]\n\n" +
        "If no issues found, write: 'No issues detected in this category.'\n\n" +
        "## ⚡ Performance Issues\n" +
        "If issues found, list each one:\n" +
        "- **Mistake**: [Specific performance problem found]\n" +
        "- **Location**: [Where in code]\n" +
        "- **Impact**: [Why this matters]\n\n" +
        "If no issues found, write: 'No issues detected in this category.'\n\n" +
        "## 📖 Readability Issues\n" +
        "If issues found, list each one:\n" +
        "- **Mistake**: [Specific readability problem found]\n" +
        "- **Location**: [Where in code]\n" +
        "- **Impact**: [Why this matters]\n\n" +
        "If no issues found, write: 'No issues detected in this category.'\n\n" +
        "## 🏗️ Architecture Issues\n" +
        "If issues found, list each one:\n" +
        "- **Mistake**: [Specific architecture problem found]\n" +
        "- **Location**: [Where in code]\n" +
        "- **Impact**: [Why this matters]\n\n" +
        "If no issues found, write: 'No issues detected in this category.'\n\n" +
        "Be specific and concrete. Reference actual code patterns from the diff.\n";

    return header + dynamic + instruction;
};

const buildPrCommentPrompt = (riskAnalysis = "") => {
    const normalized = normalizeBlock(riskAnalysis);
    const prompt =
        "Based on the following code analysis, provide actionable suggestions for improvement.\n\n" +
        "IMPORTANT: For each category, provide specific 'Current Code' and 'Suggested Code' examples.\n" +
        "Even if no issues are detected in a category, provide best practice suggestions.\n\n" +
        "Format the response as follows:\n\n" +
        "## 🔒 Security Suggestions\n" +
        "For each security concern (from the analysis or best practices):\n" +
        "- **Suggestion**: [What to improve]\n" +
        "- **Current Code**: ```javascript\\n[show the problematic pattern or typical pattern]\\n```\n" +
        "- **Suggested Code**: ```javascript\\n[show the improved pattern]\\n```\n" +
        "- **Why**: [Explanation of the improvement]\n\n" +
        "## ⚡ Performance Suggestions\n" +
        "For each performance concern (from the analysis or best practices):\n" +
        "- **Suggestion**: [What to improve]\n" +
        "- **Current Code**: ```javascript\\n[show the problematic pattern or typical pattern]\\n```\n" +
        "- **Suggested Code**: ```javascript\\n[show the improved pattern]\\n```\n" +
        "- **Why**: [Explanation of the improvement]\n\n" +
        "## 📖 Readability Suggestions\n" +
        "For each readability concern (from the analysis or best practices):\n" +
        "- **Suggestion**: [What to improve]\n" +
        "- **Current Code**: ```javascript\\n[show the problematic pattern or typical pattern]\\n```\n" +
        "- **Suggested Code**: ```javascript\\n[show the improved pattern]\\n```\n" +
        "- **Why**: [Explanation of the improvement]\n\n" +
        "## 🏗️ Architecture Suggestions\n" +
        "For each architecture concern (from the analysis or best practices):\n" +
        "- **Suggestion**: [What to improve]\n" +
        "- **Current Code**: ```javascript\\n[show the problematic pattern or typical pattern]\\n```\n" +
        "- **Suggested Code**: ```javascript\\n[show the improved pattern]\\n```\n" +
        "- **Why**: [Explanation of the improvement]\n\n" +
        "---\n\n" +
        "**Note**: This analysis is AI-generated. Please review suggestions with your team before implementing.\n\n" +
        "Based on analysis:\n" +
        normalized +
        "\n";
    return prompt;
};

export { buildRiskAnalysisPrompt, buildPrCommentPrompt };

