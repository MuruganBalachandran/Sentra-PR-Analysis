/**
 * Quick test script to verify GitHub token authentication
 * Run with: node src/utils/testGitHubToken.js
 */

import { getGitHubAuthPrefix, detectGitHubTokenType, getGitHubAuthHeader } from "./githubTokenHelper.js";

// Test different token types
const testTokens = [
    { token: "gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", expected: "Bearer", type: "OAuth" },
    { token: "github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", expected: "Bearer", type: "Fine-grained PAT" },
    { token: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", expected: "token", type: "Classic PAT" },
    { token: "ghs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", expected: "token", type: "GitHub App" },
    { token: "ghr_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", expected: "token", type: "Refresh Token" },
    { token: "ghu_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", expected: "Bearer", type: "User-to-Server" },
];

console.log("🧪 Testing GitHub Token Authentication\n");
console.log("=" .repeat(80));

testTokens.forEach(({ token, expected, type }) => {
    const prefix = getGitHubAuthPrefix(token);
    const tokenType = detectGitHubTokenType(token);
    const fullHeader = getGitHubAuthHeader(token);
    const status = prefix === expected ? "✅ PASS" : "❌ FAIL";
    
    console.log(`\n${status} ${type}`);
    console.log(`  Token Prefix: ${token.substring(0, 10)}...`);
    console.log(`  Detected Type: ${tokenType}`);
    console.log(`  Auth Prefix: ${prefix} (expected: ${expected})`);
    console.log(`  Full Header: ${fullHeader.substring(0, 30)}...`);
});

console.log("\n" + "=".repeat(80));
console.log("\n✨ Test complete!\n");

// Test with actual token format from your .env
console.log("📝 Testing with your token format:\n");
const yourToken = process.env.GITHUB_TOKEN || "github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
console.log(`Token starts with: ${yourToken.substring(0, 15)}...`);
console.log(`Detected type: ${detectGitHubTokenType(yourToken)}`);
console.log(`Auth prefix: ${getGitHubAuthPrefix(yourToken)}`);
console.log(`Full header: ${getGitHubAuthHeader(yourToken).substring(0, 40)}...`);
console.log("\n✅ Your token should use: Bearer prefix\n");
