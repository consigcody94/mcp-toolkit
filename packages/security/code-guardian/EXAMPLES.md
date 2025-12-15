# 🔍 Code Guardian Examples

## Common Vulnerabilities Detected

### 1. Hardcoded AWS Credentials
```javascript
// ❌ BAD - Detected as SEC-001 (Critical)
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

// ✅ GOOD
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
```

### 2. SQL Injection
```javascript
// ❌ BAD - Detected as SQL-001 (Critical)
const userId = req.params.id;
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ GOOD
const userId = req.params.id;
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### 3. XSS Vulnerability
```javascript
// ❌ BAD - Detected as XSS-001 (High)
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ GOOD
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

### 4. Command Injection
```javascript
// ❌ BAD - Detected as CMD-001 (Critical)
const filename = req.query.file;
exec(`cat ${filename}`, callback);

// ✅ GOOD
const filename = req.query.file;
// Validate filename first
if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
  throw new Error('Invalid filename');
}
exec('cat', [filename], callback);
```

### 5. Weak Cryptography
```javascript
// ❌ BAD - Detected as CRYPTO-001 (High)
const hash = crypto.createHash('md5').update(password).digest('hex');

// ✅ GOOD
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 10);
```

### 6. Privilege Escalation
```javascript
// ❌ BAD - Detected as PRIV-001 (Critical)
if (user.role === 'admin') {
  // Client-side check only!
  allowAccess();
}

// ✅ GOOD
// Server-side verification
app.get('/admin', requireRole('admin'), (req, res) => {
  // Double-check on server
  if (req.user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }
  res.send('Admin panel');
});
```

## Real-World Scan Output

```
🛡️  Code Guardian Security Report
────────────────────────────────────────────────────────────────────────────────

┌────────────────┬────────┐
│ Metric         │ Value  │
├────────────────┼────────┤
│ Files Scanned  │ 247    │
│ Lines Scanned  │ 18,453 │
│ Duration       │ 342ms  │
│ Trust Score    │ 67/100 │
│ Risk Level     │ HIGH   │
└────────────────┴────────┘

┌──────────┬───────┐
│ Severity │ Count │
├──────────┼───────┤
│ Critical │ 3     │
│ High     │ 7     │
│ Medium   │ 12    │
│ Low      │ 5     │
│ Info     │ 2     │
│ Total    │ 29    │
└──────────┴───────┘

⚠️  Security Issues Found:

🔴 CRITICAL (3)

  src/api/auth.ts:45:12
  [secrets] AWS Access Key
  Hardcoded AWS access key detected
  💡 Use environment variables or AWS IAM roles
  ❯ const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
  CWE: CWE-798
  🤖 Likely AI-generated code

  src/db/users.ts:23:8
  [sql-injection] SQL Concatenation
  SQL query with string concatenation (SQL injection risk)
  💡 Use parameterized queries or prepared statements
  ❯ db.query("SELECT * FROM users WHERE id = " + userId);
  CWE: CWE-89
  OWASP: A03:2021 – Injection
```

## CI/CD Integration Examples

### GitHub Actions
```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npx code-guardian scan . --fail-on critical --format sarif --output results.sarif
      - uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: results.sarif
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🛡️  Running Code Guardian..."
npx code-guardian scan $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|jsx|tsx)$') --fail-on high

if [ $? -ne 0 ]; then
  echo "❌ Security issues found. Fix them before committing."
  exit 1
fi

echo "✅ Security scan passed"
```

### GitLab CI
```yaml
security-scan:
  stage: test
  script:
    - npm install -g code-guardian
    - code-guardian scan . --format json --output security-report.json
  artifacts:
    reports:
      code-guardian: security-report.json
```

## AI-Specific Patterns

### AI Boilerplate Detection
Code Guardian detects common AI-generated patterns:

```javascript
// Detected as AI-generated (90% confidence)
// TODO: Add error handling
// TODO: Implement validation
// TODO: Add logging

function handleUserAuthenticationWithProperValidation(userData) {
  // AI loves overly descriptive names
  const userAuthenticationValidationResult = validateUser(userData);
  // ... excessive comments and TODOs
}
```

## Trust Score Breakdown

- **90-100**: Safe - No critical issues
- **70-89**: Low Risk - Minor issues only
- **50-69**: Medium Risk - Some high-severity issues
- **30-49**: High Risk - Multiple critical issues
- **0-29**: Critical Risk - Immediate action required

## Common False Positives

Code Guardian is designed to minimize false positives, but here are edge cases:

```javascript
// May trigger SEC-005 but is actually safe
const API_KEY_DESCRIPTION = "Your API key should be 32 characters";

// May trigger SQL-001 but is safe (parameterized)
const query = sql`SELECT * FROM users WHERE id = ${userId}`; // Template literal with sql library
```

## Team Dashboards

Track security over time:

```bash
# Generate report for dashboard
code-guardian scan . --format json --output reports/$(date +%Y-%m-%d).json

# Compare with previous scan
code-guardian compare reports/2025-01-01.json reports/2025-01-15.json
```
