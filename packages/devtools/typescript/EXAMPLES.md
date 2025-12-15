# 📖 TS Pilot Examples

Real-world examples of using TS Pilot's MCP tools for TypeScript development.

## 🎯 1. generate_types - Type Generation from API Responses

### Example: User API Response

**Input JSON:**
```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "roles": ["admin", "user"],
  "metadata": {
    "lastLogin": "2025-01-15T10:30:00Z",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

**Claude Code Usage:**
```
You: "Generate TypeScript types for this API response"
Claude: (uses generate_types tool)
```

**Generated Output:**
```typescript
interface UserResponse {
  id: number;
  name: string;
  email: string;
  roles: string[];
  metadata: {
    lastLogin: string;
    preferences: { theme: string; notifications: boolean }
  };
}
```

### Example: Readonly Types for Immutable Data

**Usage:**
```
You: "Generate readonly types for this config object"
```

**Output:**
```typescript
interface AppConfig {
  readonly apiUrl: string;
  readonly timeout: number;
  readonly retries: number;
}
```

---

## 🔧 2. fix_type_errors - Type Error Diagnosis and Fixes

### Example: Undefined Property Access

**Error:**
```
Property 'email' does not exist on type 'User | undefined'
```

**Claude Code Usage:**
```
You: "Fix this type error: Property 'email' does not exist on type 'User | undefined'"
Claude: (uses fix_type_errors tool)
```

**Suggested Fixes:**
1. Add null check: `if (user !== undefined) { user.email }`
2. Use optional chaining: `user?.email`
3. Use non-null assertion if guaranteed: `user!.email`
4. Provide default: `user ?? defaultUser`

### Example: Type Assignment Error

**Error:**
```
Type 'string | null' is not assignable to type 'string'
```

**Suggested Fixes:**
1. Add null check: `if (value !== null) { ... }`
2. Use nullish coalescing: `value ?? 'default'`
3. Update type to accept null: `Type | null`

---

## 🔄 3. refactor_safe - Type-Preserving Refactoring

### Example: Unsafe Code with `any`

**Input Code:**
```typescript
function processData(data: any) {
  return data.map((item: any) => item.value);
}
```

**Claude Code Usage:**
```
You: "Suggest refactoring improvements for this code"
Claude: (uses refactor_safe tool)
```

**Suggestions:**
1. ⚠️  Replace `any` types with specific types or `unknown`
2. ⚠️  Remove unsafe type assertions (`as any`) and use proper type guards
3. 📝 Add return type annotations to functions for better type safety

**Improved Code:**
```typescript
interface DataItem {
  value: string;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value);
}
```

### Example: Optional Chaining Improvements

**Input Code:**
```typescript
const userName = user?.name?.first;
```

**Suggestion:**
💡 Consider using nullish coalescing (`??`) with optional chaining for defaults

**Improved:**
```typescript
const userName = user?.name?.first ?? 'Unknown';
```

---

## 🎯 4. suggest_generics - Generic Type Suggestions

### Example: Making Functions Generic

**Input Code:**
```typescript
function getFirst(items: unknown[]): unknown {
  return items[0];
}
```

**Claude Code Usage:**
```
You: "How can I make this function more type-safe with generics?"
Claude: (uses suggest_generics tool)
```

**Suggested Generic Version:**
```typescript
function getFirst<T>(items: T[]): T | undefined {
  return items[0];
}

// Usage with type inference
const numbers = [1, 2, 3];
const first = getFirst(numbers); // Type: number | undefined

const strings = ['a', 'b', 'c'];
const firstStr = getFirst(strings); // Type: string | undefined
```

### Example: Generic Repository Pattern

**Suggestion:**
```typescript
interface Repository<T extends { id: number }> {
  findById(id: number): Promise<T>;
  save(entity: T): Promise<T>;
  delete(id: number): Promise<void>;
}

// Usage
interface User {
  id: number;
  name: string;
  email: string;
}

class UserRepository implements Repository<User> {
  async findById(id: number): Promise<User> {
    // Implementation
  }
  async save(entity: User): Promise<User> {
    // Implementation
  }
  async delete(id: number): Promise<void> {
    // Implementation
  }
}
```

---

## ⚙️ 5. check_strict - Strict Mode Compliance

### Example: Non-Strict Code

**Input Code:**
```typescript
function calculate(x, y) {
  const result: any = x + y;
  return result as any;
}
```

**Claude Code Usage:**
```
You: "Check if this code is strict mode compliant"
Claude: (uses check_strict tool)
```

**Issues Found:**
1. ❌ Explicit `any` type found - violates strict mode
2. ❌ Unsafe type assertion `as any` - defeats type safety
3. ⚠️  Missing type annotations on function parameters
4. ⚠️  Missing return type annotations on functions

**Strict-Compliant Version:**
```typescript
function calculate(x: number, y: number): number {
  const result: number = x + y;
  return result;
}
```

### Example: Null Safety Issues

**Input Code:**
```typescript
let user = null;
function getUserName() {
  return user.name;
}
```

**Issues:**
1. ⚠️  Potential null values not reflected in types
2. ⚠️  Missing return type annotations on functions

**Fixed:**
```typescript
let user: User | null = null;

function getUserName(): string | null {
  return user?.name ?? null;
}
```

---

## 📚 6. framework_patterns - Framework-Specific Patterns

### Example: React Component Props

**Claude Code Usage:**
```
You: "Show me React TypeScript patterns for components"
Claude: (uses framework_patterns tool with framework='react')
```

**Pattern: Component Props**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

export function Button({
  variant,
  size = 'md',
  disabled,
  onClick,
  children
}: ButtonProps) {
  return (
    <button
      className={`btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Example: Next.js Server Actions

**Claude Code Usage:**
```
You: "Show me Next.js TypeScript patterns"
Claude: (uses framework_patterns tool with framework='nextjs')
```

**Pattern: Type-Safe Server Actions**
```typescript
'use server';

import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof formSchema>;

export async function loginAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const validated = formSchema.safeParse(formData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.message
    };
  }

  // Process login with validated data
  return { success: true };
}
```

### Example: Express Route Handlers

**Claude Code Usage:**
```
You: "Show me Express TypeScript patterns"
Claude: (uses framework_patterns tool with framework='express')
```

**Pattern: Typed Request Handler**
```typescript
import { Request, Response, NextFunction } from 'express';

interface CreateUserRequest {
  name: string;
  email: string;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

app.post('/users', async (
  req: Request<{}, UserResponse, CreateUserRequest>,
  res: Response<UserResponse>,
  next: NextFunction
) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});
```

---

## 🔥 Real-World Workflow Examples

### Workflow 1: Building a Type-Safe API Client

```
1. You: "Generate types for this GitHub API response"
   → Uses generate_types to create GitHubUser interface

2. You: "Check this code for strict mode compliance"
   → Uses check_strict to find type issues

3. You: "Suggest generic improvements for my fetch wrapper"
   → Uses suggest_generics to create generic HTTP client

4. You: "Show me Node.js patterns for error handling"
   → Uses framework_patterns to implement Result<T, E> pattern
```

### Workflow 2: Refactoring Legacy JavaScript to TypeScript

```
1. You: "I'm getting this error: Type 'any' is not allowed"
   → Uses fix_type_errors to suggest proper types

2. You: "Suggest refactoring for this old JavaScript code"
   → Uses refactor_safe to identify type improvements

3. You: "Make this function generic to work with multiple types"
   → Uses suggest_generics to add type parameters

4. You: "Check if my refactored code is strict mode compliant"
   → Uses check_strict to verify type safety
```

### Workflow 3: Building a React Application

```
1. You: "Show me React TypeScript patterns for hooks"
   → Uses framework_patterns to see useState/useRef patterns

2. You: "Generate types for this REST API response"
   → Uses generate_types for API data interfaces

3. You: "I'm getting 'Property does not exist on type undefined'"
   → Uses fix_type_errors for null safety suggestions

4. You: "Check my component props for strict mode issues"
   → Uses check_strict to ensure type safety
```

---

## 💡 Tips and Best Practices

### Tip 1: Always Use Strict Mode
Enable strict TypeScript settings in your tsconfig.json:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Tip 2: Prefer Unknown Over Any
When you don't know the type, use `unknown` instead of `any`:
```typescript
// Bad
function process(data: any) { }

// Good
function process(data: unknown) {
  if (typeof data === 'string') {
    // Type narrowed to string
  }
}
```

### Tip 3: Use Type Guards for Runtime Safety
```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

if (isUser(data)) {
  // data is safely typed as User
  console.log(data.email);
}
```

### Tip 4: Leverage Discriminated Unions
```typescript
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

function handleResult<T>(result: Result<T, Error>) {
  if (result.success) {
    // result.data is available
    console.log(result.data);
  } else {
    // result.error is available
    console.error(result.error);
  }
}
```

### Tip 5: Use Branded Types for Validation
```typescript
type Email = string & { __brand: 'Email' };
type UUID = string & { __brand: 'UUID' };

function validateEmail(email: string): Email | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email as Email
    : null;
}

function sendEmail(to: Email) {
  // Only validated emails can be passed
}
```

---

## 🚀 Performance Tips

1. **Use Type Inference**: Let TypeScript infer types when obvious
2. **Avoid Deep Nesting**: Keep type definitions shallow for better performance
3. **Leverage Utility Types**: Use `Pick`, `Omit`, `Partial` instead of manual types
4. **Cache Type Computations**: For complex conditional types, cache results

---

## 📞 Get Help

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **TypeScript Deep Dive**: https://basarat.gitbook.io/typescript/
- **TS Pilot GitHub**: https://github.com/consigcody94/ts-pilot
