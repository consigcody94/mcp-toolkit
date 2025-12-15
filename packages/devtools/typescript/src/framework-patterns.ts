/**
 * Framework-specific TypeScript patterns
 */

export type Framework = 'react' | 'nextjs' | 'express' | 'nodejs' | 'vue' | 'angular';

export interface FrameworkPattern {
  framework: Framework;
  pattern: string;
  code: string;
  description: string;
}

export class FrameworkPatterns {
  getPatterns(framework: Framework): FrameworkPattern[] {
    switch (framework) {
      case 'react':
        return this.getReactPatterns();
      case 'nextjs':
        return this.getNextJSPatterns();
      case 'express':
        return this.getExpressPatterns();
      case 'nodejs':
        return this.getNodeJSPatterns();
      case 'vue':
        return this.getVuePatterns();
      case 'angular':
        return this.getAngularPatterns();
      default:
        return [];
    }
  }

  private getReactPatterns(): FrameworkPattern[] {
    return [
      {
        framework: 'react',
        pattern: 'Component Props',
        code: `interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

export function Button({ variant, size = 'md', disabled, onClick, children }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
}`,
        description: 'Strict prop types with union literals and proper event handlers'
      },
      {
        framework: 'react',
        pattern: 'useState with explicit type',
        code: `interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return <div>{user?.name}</div>;
}`,
        description: 'Explicitly typed useState hooks prevent "any" types'
      },
      {
        framework: 'react',
        pattern: 'useRef with DOM elements',
        code: `function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    videoRef.current?.play();
  };

  return <video ref={videoRef} />;
}`,
        description: 'Properly typed refs with null safety'
      },
      {
        framework: 'react',
        pattern: 'Generic component',
        code: `interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
}

function Select<T>({ options, value, onChange, getLabel }: SelectProps<T>) {
  return (
    <select value={String(value)} onChange={(e) => {
      const option = options.find(o => String(o) === e.target.value);
      if (option) onChange(option);
    }}>
      {options.map((opt, i) => (
        <option key={i} value={String(opt)}>{getLabel(opt)}</option>
      ))}
    </select>
  );
}`,
        description: 'Generic components for reusable, type-safe UI elements'
      }
    ];
  }

  private getNextJSPatterns(): FrameworkPattern[] {
    return [
      {
        framework: 'nextjs',
        pattern: 'Page Props (App Router)',
        code: `interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Page({ params, searchParams }: PageProps) {
  const data = await fetchData(params.slug);
  return <div>{data.title}</div>;
}`,
        description: 'Properly typed Next.js App Router page props'
      },
      {
        framework: 'nextjs',
        pattern: 'Server Actions',
        code: `'use server';

import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof formSchema>;

export async function loginAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const validated = formSchema.safeParse(formData);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  // Process login
  return { success: true };
}`,
        description: 'Type-safe server actions with Zod validation'
      },
      {
        framework: 'nextjs',
        pattern: 'API Route Handler',
        code: `import { NextRequest, NextResponse } from 'next/server';

interface ResponseData {
  message: string;
  data?: unknown;
}

export async function GET(request: NextRequest): Promise<NextResponse<ResponseData>> {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  return NextResponse.json({ message: 'Success', data: { id } });
}

export async function POST(request: NextRequest): Promise<NextResponse<ResponseData>> {
  const body: unknown = await request.json();
  // Validate body
  return NextResponse.json({ message: 'Created' }, { status: 201 });
}`,
        description: 'Typed API route handlers with proper request/response types'
      }
    ];
  }

  private getExpressPatterns(): FrameworkPattern[] {
    return [
      {
        framework: 'express',
        pattern: 'Typed Request Handler',
        code: `import { Request, Response, NextFunction } from 'express';

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
});`,
        description: 'Fully typed Express route handlers with generics'
      },
      {
        framework: 'express',
        pattern: 'Custom Request Type',
        code: `import { Request } from 'express';

interface AuthenticatedRequest<T = unknown> extends Request {
  user?: {
    id: number;
    email: string;
    roles: string[];
  };
  body: T;
}

app.post('/protected', (req: AuthenticatedRequest<{ action: string }>, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log(req.user.id, req.body.action);
  res.json({ success: true });
});`,
        description: 'Extend Request type for authentication and custom properties'
      }
    ];
  }

  private getNodeJSPatterns(): FrameworkPattern[] {
    return [
      {
        framework: 'nodejs',
        pattern: 'Async Error Handling',
        code: `async function processData<T>(data: T): Promise<Result<ProcessedData, Error>> {
  try {
    const processed = await heavyOperation(data);
    return { success: true, data: processed };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };`,
        description: 'Type-safe error handling with discriminated unions'
      },
      {
        framework: 'nodejs',
        pattern: 'Environment Variables',
        code: `import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);`,
        description: 'Validated environment variables with type safety'
      }
    ];
  }

  private getVuePatterns(): FrameworkPattern[] {
    return [
      {
        framework: 'vue',
        pattern: 'Component Props (Composition API)',
        code: `import { defineComponent, PropType } from 'vue';

interface User {
  id: number;
  name: string;
}

export default defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    },
    showEmail: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // props.user is typed as User
    console.log(props.user.name);
  }
});`,
        description: 'Type-safe Vue component props with PropType'
      }
    ];
  }

  private getAngularPatterns(): FrameworkPattern[] {
    return [
      {
        framework: 'angular',
        pattern: 'Component with Service',
        code: `import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-list',
  template: \`<div *ngFor="let user of users$ | async">{{ user.name }}</div>\`
})
export class UserListComponent implements OnInit {
  users$: Observable<User[]>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.users$ = this.userService.getUsers();
  }
}`,
        description: 'Type-safe Angular component with RxJS observables'
      }
    ];
  }
}
