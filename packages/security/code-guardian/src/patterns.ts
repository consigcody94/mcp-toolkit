/**
 * Security patterns for detecting vulnerabilities in AI-generated code
 * Based on research showing 322% more privilege escalation and 153% more design flaws
 */

import { SecurityPattern } from './types.js';

export const SECURITY_PATTERNS: SecurityPattern[] = [
  // ==================== SECRETS & CREDENTIALS ====================
  {
    id: 'SEC-001',
    name: 'AWS Access Key',
    category: 'secrets',
    severity: 'critical',
    pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    description: 'Hardcoded AWS access key detected',
    recommendation: 'Use environment variables or AWS IAM roles',
    cwe: 'CWE-798',
    owasp: 'A07:2021 – Identification and Authentication Failures',
  },
  {
    id: 'SEC-002',
    name: 'AWS Secret Key',
    category: 'secrets',
    severity: 'critical',
    pattern: /aws_secret_access_key\s*=\s*['"][A-Za-z0-9/+=]{40}['"]/gi,
    description: 'Hardcoded AWS secret access key detected',
    recommendation: 'Use AWS Secrets Manager or environment variables',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-003',
    name: 'GitHub Token',
    category: 'secrets',
    severity: 'critical',
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
    description: 'GitHub personal access token detected',
    recommendation: 'Use GitHub Secrets or environment variables',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-004',
    name: 'Private Key',
    category: 'secrets',
    severity: 'critical',
    pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/gi,
    description: 'Private cryptographic key detected in code',
    recommendation: 'Store keys in secure key management system',
    cwe: 'CWE-321',
  },
  {
    id: 'SEC-005',
    name: 'Generic API Key',
    category: 'secrets',
    severity: 'high',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
    description: 'Hardcoded API key detected',
    recommendation: 'Use environment variables or secure vault',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-006',
    name: 'Database Password',
    category: 'hardcoded-credentials',
    severity: 'critical',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"](?!.*\$\{)[^'"]{3,}['"]/gi,
    description: 'Hardcoded database password detected',
    recommendation: 'Use environment variables or secret management',
    cwe: 'CWE-798',
    owasp: 'A07:2021 – Identification and Authentication Failures',
  },
  {
    id: 'SEC-007',
    name: 'JWT Secret',
    category: 'secrets',
    severity: 'critical',
    pattern: /(?:jwt[_-]?secret|secret[_-]?key)\s*[:=]\s*['"][^'"]{10,}['"]/gi,
    description: 'Hardcoded JWT secret key detected',
    recommendation: 'Use strong random secret from environment',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-008',
    name: 'Slack Token',
    category: 'secrets',
    severity: 'high',
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
    description: 'Slack API token detected',
    recommendation: 'Use environment variables for tokens',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-009',
    name: 'Stripe API Key',
    category: 'secrets',
    severity: 'critical',
    pattern: /(?:sk|pk)_live_[a-zA-Z0-9]{24,}/g,
    description: 'Stripe live API key detected',
    recommendation: 'Never commit live keys; use test keys for development',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-010',
    name: 'Generic Secret',
    category: 'secrets',
    severity: 'medium',
    pattern: /(?:secret|token|key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{32,}['"]/gi,
    description: 'Potential hardcoded secret detected',
    recommendation: 'Move secrets to environment variables',
    cwe: 'CWE-798',
  },

  // ==================== SQL INJECTION ====================
  {
    id: 'SQL-001',
    name: 'SQL Concatenation',
    category: 'sql-injection',
    severity: 'critical',
    pattern: /(?:execute|query|exec)\s*\(\s*['"`].*?\$\{|.*?\+.*?['"`]\s*\)/gi,
    description: 'SQL query with string concatenation (SQL injection risk)',
    recommendation: 'Use parameterized queries or prepared statements',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    id: 'SQL-002',
    name: 'Dynamic SQL Construction',
    category: 'sql-injection',
    severity: 'high',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*?(?:\$\{|\+\s*[a-zA-Z_])/gi,
    description: 'Dynamically constructed SQL query detected',
    recommendation: 'Use ORM or parameterized queries',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    id: 'SQL-003',
    name: 'Raw SQL Query',
    category: 'sql-injection',
    severity: 'medium',
    pattern: /\.raw\s*\(\s*['"`](?:SELECT|INSERT|UPDATE|DELETE)/gi,
    description: 'Raw SQL query detected - verify input sanitization',
    recommendation: 'Ensure all inputs are sanitized or use query builder',
    cwe: 'CWE-89',
  },

  // ==================== XSS (Cross-Site Scripting) ====================
  {
    id: 'XSS-001',
    name: 'dangerouslySetInnerHTML',
    category: 'xss',
    severity: 'high',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\{?\s*__html:/gi,
    description: 'Using dangerouslySetInnerHTML without sanitization',
    recommendation: 'Sanitize HTML with DOMPurify before rendering',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
  {
    id: 'XSS-002',
    name: 'innerHTML Assignment',
    category: 'xss',
    severity: 'high',
    pattern: /\.innerHTML\s*=\s*(?!['"`])[^;]+/gi,
    description: 'Direct innerHTML assignment with variable (XSS risk)',
    recommendation: 'Use textContent or sanitize HTML input',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
  {
    id: 'XSS-003',
    name: 'document.write',
    category: 'xss',
    severity: 'medium',
    pattern: /document\.write\s*\(/gi,
    description: 'Using document.write() can lead to XSS',
    recommendation: 'Use DOM manipulation methods instead',
    cwe: 'CWE-79',
  },

  // ==================== COMMAND INJECTION ====================
  {
    id: 'CMD-001',
    name: 'Shell Command Execution',
    category: 'command-injection',
    severity: 'critical',
    pattern: /(?:exec|spawn|execSync|spawnSync)\s*\(\s*(?!['"`])[^)]*\$\{/gi,
    description: 'Shell command with user input (command injection risk)',
    recommendation: 'Validate and sanitize all inputs; use array syntax',
    cwe: 'CWE-78',
    owasp: 'A03:2021 – Injection',
  },
  {
    id: 'CMD-002',
    name: 'eval() Usage',
    category: 'command-injection',
    severity: 'critical',
    pattern: /\beval\s*\(/gi,
    description: 'Using eval() is extremely dangerous',
    recommendation: 'Never use eval(); find alternative approach',
    cwe: 'CWE-95',
    owasp: 'A03:2021 – Injection',
  },
  {
    id: 'CMD-003',
    name: 'Function Constructor',
    category: 'command-injection',
    severity: 'high',
    pattern: /new\s+Function\s*\(/gi,
    description: 'Function constructor can execute arbitrary code',
    recommendation: 'Avoid Function constructor; use safer alternatives',
    cwe: 'CWE-95',
  },

  // ==================== PATH TRAVERSAL ====================
  {
    id: 'PATH-001',
    name: 'Path Traversal',
    category: 'path-traversal',
    severity: 'high',
    pattern: /(?:readFile|writeFile|unlink|mkdir).*?(?:\$\{|\+\s*[a-zA-Z_])/gi,
    description: 'File operation with unsanitized path (path traversal risk)',
    recommendation: 'Validate and sanitize file paths; use path.join()',
    cwe: 'CWE-22',
    owasp: 'A01:2021 – Broken Access Control',
  },
  {
    id: 'PATH-002',
    name: 'Unrestricted File Access',
    category: 'path-traversal',
    severity: 'medium',
    pattern: /req\.(?:query|params|body)\.[a-zA-Z_]+.*?(?:readFile|writeFile)/gi,
    description: 'File access using user-controlled input',
    recommendation: 'Restrict file access to specific directories',
    cwe: 'CWE-22',
  },

  // ==================== PRIVILEGE ESCALATION ====================
  {
    id: 'PRIV-001',
    name: 'Hardcoded Admin Check',
    category: 'privilege-escalation',
    severity: 'critical',
    pattern: /(?:if|when|where).*?(?:role|isAdmin|admin)\s*(?:===?|==)\s*(?:true|['"]admin['"])/gi,
    description: 'Hardcoded admin privilege check (easily bypassed)',
    recommendation: 'Use proper RBAC system with server-side verification',
    cwe: 'CWE-269',
    owasp: 'A01:2021 – Broken Access Control',
  },
  {
    id: 'PRIV-002',
    name: 'Client-Side Authorization',
    category: 'privilege-escalation',
    severity: 'high',
    pattern: /(?:localStorage|sessionStorage)\.getItem.*?(?:role|admin|permissions)/gi,
    description: 'Authorization based on client-side storage',
    recommendation: 'Always verify permissions on server side',
    cwe: 'CWE-602',
    owasp: 'A01:2021 – Broken Access Control',
  },
  {
    id: 'PRIV-003',
    name: 'Weak Permission Check',
    category: 'privilege-escalation',
    severity: 'medium',
    pattern: /if\s*\(\s*user\s*\)\s*\{.*?(?:delete|update|admin)/gis,
    description: 'Permission check only verifies user exists, not role',
    recommendation: 'Implement proper role-based access control',
    cwe: 'CWE-862',
  },

  // ==================== INSECURE DESERIALIZATION ====================
  {
    id: 'DESER-001',
    name: 'Unsafe Deserialization',
    category: 'insecure-deserialization',
    severity: 'high',
    pattern: /JSON\.parse\s*\(\s*(?:req\.body|req\.query|req\.params)/gi,
    description: 'Parsing untrusted JSON without validation',
    recommendation: 'Validate JSON schema before parsing',
    cwe: 'CWE-502',
    owasp: 'A08:2021 – Software and Data Integrity Failures',
  },
  {
    id: 'DESER-002',
    name: 'Object Deserialization',
    category: 'insecure-deserialization',
    severity: 'high',
    pattern: /(?:pickle|unserialize|yaml\.load)\s*\(/gi,
    description: 'Unsafe object deserialization detected',
    recommendation: 'Use safe deserialization methods',
    cwe: 'CWE-502',
  },

  // ==================== WEAK CRYPTOGRAPHY ====================
  {
    id: 'CRYPTO-001',
    name: 'Weak Hash Algorithm',
    category: 'weak-crypto',
    severity: 'high',
    pattern: /createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/gi,
    description: 'Using weak cryptographic hash (MD5/SHA1)',
    recommendation: 'Use SHA-256 or better (bcrypt for passwords)',
    cwe: 'CWE-327',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    id: 'CRYPTO-002',
    name: 'Weak Random',
    category: 'weak-crypto',
    severity: 'medium',
    pattern: /Math\.random\s*\(\s*\)/gi,
    description: 'Math.random() is not cryptographically secure',
    recommendation: 'Use crypto.randomBytes() for security purposes',
    cwe: 'CWE-338',
  },
  {
    id: 'CRYPTO-003',
    name: 'Hardcoded IV/Salt',
    category: 'weak-crypto',
    severity: 'high',
    pattern: /(?:iv|salt)\s*[:=]\s*['"][a-fA-F0-9]{16,}['"]/gi,
    description: 'Hardcoded initialization vector or salt',
    recommendation: 'Generate random IV/salt for each encryption',
    cwe: 'CWE-329',
  },

  // ==================== UNSAFE REGEX ====================
  {
    id: 'REGEX-001',
    name: 'ReDoS Vulnerable Pattern',
    category: 'unsafe-regex',
    severity: 'medium',
    pattern: /new RegExp\(.*?\(.*?\+.*?\*.*?\)/gi,
    description: 'Regular expression vulnerable to ReDoS attack',
    recommendation: 'Avoid nested quantifiers; test regex complexity',
    cwe: 'CWE-1333',
    owasp: 'A06:2021 – Vulnerable and Outdated Components',
  },
];

/**
 * AI-specific patterns that commonly appear in AI-generated code
 */
export const AI_PATTERNS = {
  // AI loves these descriptive but overly long function names
  longFunctionNames: /function\s+[a-zA-Z_][a-zA-Z0-9_]{50,}/g,

  // AI over-comments everything
  excessiveComments: /\/\*[\s\S]{200,}\*\/|\/\/.*?\n(?:\/\/.*?\n){5,}/g,

  // Common AI boilerplate
  boilerplate: /(?:TODO|FIXME|NOTE):\s*(?:implement|add|fix|update)/gi,

  // AI scaffold patterns
  scaffold: /\/\/ TODO: Add error handling|\/\/ TODO: Implement|\/\/ Placeholder/gi,
};

// Additional high-value patterns for AI-generated code

export const ADDITIONAL_PATTERNS: SecurityPattern[] = [
  // ==================== INSECURE RANDOM ====================
  {
    id: 'CRYPTO-004',
    name: 'Predictable Token Generation',
    category: 'weak-crypto',
    severity: 'high',
    pattern: /(?:token|sessionId|nonce)\s*=\s*Math\.random\(\)/gi,
    description: 'Using Math.random() for security tokens is not cryptographically secure',
    recommendation: 'Use crypto.randomBytes() or crypto.randomUUID()',
    cwe: 'CWE-338',
  },

  // ==================== XXEINJECTION ====================
  {
    id: 'XXE-001',
    name: 'XML External Entity',
    category: 'insecure-deserialization',
    severity: 'high',
    pattern: /new\s+DOMParser\(\)\.parseFromString|\.parseXML\(/gi,
    description: 'XML parsing without disabling external entities (XXE risk)',
    recommendation: 'Disable external entity processing in XML parser',
    cwe: 'CWE-611',
    owasp: 'A05:2021 – Security Misconfiguration',
  },

  // ==================== OPEN REDIRECT ====================
  {
    id: 'REDIR-001',
    name: 'Open Redirect',
    category: 'path-traversal',
    severity: 'medium',
    pattern: /(?:location\.href|window\.location)\s*=\s*(?:req\.query|req\.params|req\.body)/gi,
    description: 'Redirect using user-controlled input (open redirect risk)',
    recommendation: 'Validate redirect URL against whitelist',
    cwe: 'CWE-601',
  },

  // ==================== MASS ASSIGNMENT ====================
  {
    id: 'MASS-001',
    name: 'Mass Assignment',
    category: 'privilege-escalation',
    severity: 'high',
    pattern: /User\.update\(req\.body\)|\.save\(req\.body\)/gi,
    description: 'Direct assignment of request body to model (mass assignment risk)',
    recommendation: 'Explicitly define allowed fields for update',
    cwe: 'CWE-915',
  },

  // ==================== TIMING ATTACK ====================
  {
    id: 'TIMING-001',
    name: 'Timing Attack',
    category: 'weak-crypto',
    severity: 'medium',
    pattern: /(?:password|token|secret)\s*===?\s*(?:req\.|user\.)/gi,
    description: 'String comparison vulnerable to timing attacks',
    recommendation: 'Use crypto.timingSafeEqual() for sensitive comparisons',
    cwe: 'CWE-208',
  },

  // ==================== SSRF ====================
  {
    id: 'SSRF-001',
    name: 'Server-Side Request Forgery',
    category: 'command-injection',
    severity: 'high',
    pattern: /(?:axios|fetch|http\.get)\(.*?(?:req\.query|req\.params|req\.body)/gi,
    description: 'HTTP request with user-controlled URL (SSRF risk)',
    recommendation: 'Validate and whitelist allowed domains',
    cwe: 'CWE-918',
    owasp: 'A10:2021 – Server-Side Request Forgery',
  },
];

// Merge with main patterns
SECURITY_PATTERNS.push(...ADDITIONAL_PATTERNS);
