# 🏗️ Infra Sage

**AI-powered Terraform infrastructure management - generate modules, validate configs, plan changes, and detect drift**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/anthropics/mcp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Terraform](https://img.shields.io/badge/Terraform-Compatible-7B42BC?logo=terraform)](https://www.terraform.io/)

---

## 🤔 The Infrastructure Challenge

**"Writing Terraform boilerplate is tedious and error-prone"**

Every new module requires the same setup - provider blocks, variable definitions, output configurations. Then there's the constant need to validate, plan, and check for drift.

- 📝 Repetitive module scaffolding
- ✅ Validation before every change
- 🔍 Planning and reviewing diffs
- 🔄 Drift detection across environments

**Infra Sage automates the tedious parts** - generate complete modules, validate configs, preview changes, and detect drift, all through natural language.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧱 **Module Generation** | Create complete Terraform modules with best practices baked in |
| ✅ **Config Validation** | Syntax and semantic validation without leaving your editor |
| 📋 **Change Planning** | Preview infrastructure changes before applying |
| 📦 **Resource Listing** | Query resources in your Terraform state |
| 🔍 **Drift Detection** | Compare actual infrastructure against your configuration |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Terraform CLI installed
- Claude Desktop

### Installation

```bash
git clone https://github.com/consigcody94/infra-sage.git
cd infra-sage
npm install
npm run build
```

### Install Terraform

```bash
# macOS
brew install terraform

# Ubuntu/Debian
sudo apt-get install terraform

# Or download from https://www.terraform.io/downloads
```

### Configure Claude Desktop

Add to your config file:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "infra-sage": {
      "command": "node",
      "args": ["/absolute/path/to/infra-sage/build/index.js"]
    }
  }
}
```

### Restart Claude Desktop
Completely quit and reopen Claude Desktop to load the MCP server.

---

## 💬 Usage Examples

### Generate a Module
```
"Generate an AWS VPC module with variables for region and cidr_block"
→ Creates complete module with main.tf, variables.tf, outputs.tf, README.md

"Create a Kubernetes deployment module with namespace and replicas variables"
→ Scaffolds K8s module with provider config and best practices
```

### Validate Configuration
```
"Validate my Terraform configuration in ./infrastructure"
→ Checks syntax, references, and provider requirements

"Are there any errors in my staging config?"
→ Returns detailed validation results with file locations
```

### Plan Changes
```
"Show me what changes will be applied to production"
→ Runs terraform plan and summarizes additions, changes, deletions

"Preview changes for the database module only"
→ Targeted plan for specific resources
```

### Manage State
```
"List all AWS instances in my state"
→ Filters and displays matching resources

"Check for drift in production"
→ Compares state against actual infrastructure
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `generate_module` | Create a complete Terraform module with best-practice structure |
| `validate_config` | Validate Terraform configuration files for errors |
| `plan_changes` | Run terraform plan to preview infrastructure changes |
| `list_resources` | List all resources in Terraform state |
| `check_drift` | Detect configuration drift between state and infrastructure |

---

## 📊 Tool Details

### generate_module

Generate a complete Terraform module with best-practice structure.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `moduleName` | string | Yes | Name of the module (e.g., `vpc`, `eks-cluster`) |
| `provider` | string | Yes | Cloud provider: `aws`, `azure`, `gcp`, or `kubernetes` |
| `variables` | array | No | Input variables for the module |
| `outputs` | array | No | Output values from the module |

**Variable object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Variable name |
| `type` | string | Yes | Terraform type (`string`, `number`, `list(string)`, etc.) |
| `description` | string | No | Variable description |
| `default` | string | No | Default value |

**Generated files:**
- `main.tf` - Main resource definitions with provider block
- `variables.tf` - Input variable declarations
- `outputs.tf` - Output value definitions
- `README.md` - Module documentation

### validate_config

Validate Terraform configuration files for syntax and semantic errors.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Path to Terraform files (default: current directory) |

### plan_changes

Run `terraform plan` to preview infrastructure changes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Path to Terraform files |
| `varFile` | string | No | Path to `.tfvars` file |
| `target` | string | No | Target specific resource |

### list_resources

List all resources in Terraform state.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Path to Terraform files |
| `filter` | string | No | Filter by resource type or name pattern |

### check_drift

Detect configuration drift between state and actual infrastructure.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Path to Terraform files |
| `detailed` | boolean | No | Show detailed drift information |

---

## 🏗️ Provider Templates

### AWS Module
- AWS provider configuration
- Default tags support
- Region variable
- Common AWS resource patterns

### Azure Module
- AzureRM provider configuration
- Resource group integration
- Location variable
- Naming conventions

### GCP Module
- Google provider configuration
- Project ID integration
- Region/zone variables
- Labels support

### Kubernetes Module
- Kubernetes provider configuration
- Namespace support
- Labels and annotations
- Resource quotas

---

## 🎯 Workflow Examples

### Creating a New Module

1. **Generate the module:**
   ```
   generate_module with moduleName: "api-gateway", provider: "aws", variables: [...]
   ```

2. **Review generated files** in `./modules/api-gateway/`

3. **Validate the configuration:**
   ```
   validate_config with directory: "./modules/api-gateway"
   ```

### Planning Infrastructure Changes

1. **Check current state:**
   ```
   list_resources with directory: "./infrastructure"
   ```

2. **Preview changes:**
   ```
   plan_changes with directory: "./infrastructure", varFile: "./prod.tfvars"
   ```

3. **Check for drift before applying:**
   ```
   check_drift with directory: "./infrastructure", detailed: true
   ```

---

## 🔒 Security Notes

| Principle | Description |
|-----------|-------------|
| Read-only operations | Never commits or modifies infrastructure automatically |
| No auto-apply | All destructive operations require manual `terraform apply` |
| Workspace isolation | Supports multiple workspaces |
| No credential storage | Uses your existing Terraform/cloud provider credentials |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "terraform not found" | Ensure Terraform is installed and in PATH: `which terraform` |
| Validation fails | Run `terraform init` in target directory first |
| Module path issues | Use absolute paths or ensure correct working directory |
| State commands fail | Initialize backend: `terraform init` |

---

## 📚 Best Practices

1. **Always validate before planning** - Catch syntax errors early
2. **Use variable files** - Keep environment configs separate
3. **Check for drift regularly** - Especially before major changes
4. **Use modules** - Generated modules follow Terraform best practices
5. **Review plans carefully** - AI assistance doesn't replace human review

---

## 📋 Requirements

- Node.js 18 or higher
- Terraform CLI (for plan, validate, and state operations)
- Initialized Terraform workspace (`terraform init`)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👤 Author

**consigcody94**

---

<p align="center">
  <i>Infrastructure as code, powered by conversation.</i>
</p>
