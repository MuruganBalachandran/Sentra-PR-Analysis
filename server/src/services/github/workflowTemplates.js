/**
 * Workflow templates for common CI/CD scenarios
 */

/**
 * Node.js CI workflow template
 */
const nodejsCITemplate = (nodeVersion = "18") => `name: Node.js CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [${nodeVersion}]

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint --if-present
    
    - name: Run tests
      run: npm test --if-present
    
    - name: Build
      run: npm run build --if-present
`;

/**
 * Python CI workflow template
 */
const pythonCITemplate = (pythonVersion = "3.11") => `name: Python CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: ["${pythonVersion}"]

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python \${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: \${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install flake8 pytest
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
    
    - name: Lint with flake8
      run: |
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
        flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
    
    - name: Test with pytest
      run: |
        pytest
`;

/**
 * Docker build and push workflow template
 */
const dockerBuildTemplate = (imageName = "myapp") => `name: Docker Build and Push

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
`;

/**
 * Automated PR analysis workflow (Sentra integration)
 */
const sentraPRAnalysisTemplate = (sentraWebhookUrl = "") => `name: Sentra PR Analysis

on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Trigger Sentra Analysis
      run: |
        curl -X POST "${sentraWebhookUrl}" \\
          -H "Content-Type: application/json" \\
          -d '{
            "repository": "\${{ github.repository }}",
            "pr_number": "\${{ github.event.pull_request.number }}",
            "pr_title": "\${{ github.event.pull_request.title }}",
            "pr_url": "\${{ github.event.pull_request.html_url }}",
            "head_sha": "\${{ github.event.pull_request.head.sha }}"
          }'
    
    - name: Comment on PR
      uses: actions/github-script@v7
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '🤖 Sentra AI analysis has been triggered for this PR. Results will be posted shortly.'
          })
`;

/**
 * Code quality and security scan workflow
 */
const securityScanTemplate = () => `name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy results to GitHub Security
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run npm audit
      run: npm audit --audit-level=moderate
      continue-on-error: true
`;

/**
 * Deployment workflow template
 */
const deploymentTemplate = (environment = "production") => `name: Deploy to ${environment}

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${environment}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        NODE_ENV: production
    
    - name: Deploy to ${environment}
      run: |
        echo "Deploying to ${environment}..."
        # Add your deployment commands here
        # Example: npm run deploy:${environment}
      env:
        DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}
`;

/**
 * Get template by name
 */
const getTemplate = (templateName = "", options = {}) => {
    const templates = {
        "nodejs-ci": () => nodejsCITemplate(options?.nodeVersion),
        "python-ci": () => pythonCITemplate(options?.pythonVersion),
        "docker-build": () => dockerBuildTemplate(options?.imageName),
        "sentra-pr-analysis": () => sentraPRAnalysisTemplate(options?.sentraWebhookUrl),
        "security-scan": () => securityScanTemplate(),
        "deployment": () => deploymentTemplate(options?.environment),
    };

    const template = templates[templateName];
    if (!template) {
        throw new Error(`Template '${templateName}' not found`);
    }

    return template();
};

/**
 * List all available templates
 */
const listTemplates = () => [
    {
        id: "nodejs-ci",
        name: "Node.js CI",
        description: "Continuous Integration for Node.js projects with linting, testing, and building",
        category: "ci",
        options: [
            { name: "nodeVersion", type: "string", default: "18", description: "Node.js version" }
        ]
    },
    {
        id: "python-ci",
        name: "Python CI",
        description: "Continuous Integration for Python projects with flake8 and pytest",
        category: "ci",
        options: [
            { name: "pythonVersion", type: "string", default: "3.11", description: "Python version" }
        ]
    },
    {
        id: "docker-build",
        name: "Docker Build & Push",
        description: "Build and push Docker images to GitHub Container Registry",
        category: "build",
        options: [
            { name: "imageName", type: "string", default: "myapp", description: "Docker image name" }
        ]
    },
    {
        id: "sentra-pr-analysis",
        name: "Sentra PR Analysis",
        description: "Automated PR analysis using Sentra AI",
        category: "analysis",
        options: [
            { name: "sentraWebhookUrl", type: "string", required: true, description: "Sentra webhook URL" }
        ]
    },
    {
        id: "security-scan",
        name: "Security Scan",
        description: "Automated security scanning with Trivy and npm audit",
        category: "security",
        options: []
    },
    {
        id: "deployment",
        name: "Deployment",
        description: "Deploy application to specified environment",
        category: "deployment",
        options: [
            { name: "environment", type: "string", default: "production", description: "Deployment environment" }
        ]
    },
];

export {
    nodejsCITemplate,
    pythonCITemplate,
    dockerBuildTemplate,
    sentraPRAnalysisTemplate,
    securityScanTemplate,
    deploymentTemplate,
    getTemplate,
    listTemplates,
};
