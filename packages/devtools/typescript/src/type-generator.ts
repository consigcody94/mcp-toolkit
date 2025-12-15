/**
 * TypeScript type generation from data
 */

export interface TypeGenerationOptions {
  name?: string;
  strict?: boolean;
  readonly?: boolean;
  exactOptionalPropertyTypes?: boolean;
}

export class TypeGenerator {
  generate(data: any, options: TypeGenerationOptions = {}): string {
    const name = options.name || 'Generated';
    const strict = options.strict !== false; // Default true

    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return this.generateInterface(name, parsed, strict, options);
    } catch (error) {
      throw new Error(`Invalid JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateInterface(name: string, obj: any, strict: boolean, options: TypeGenerationOptions): string {
    if (obj === null) return `type ${name} = null;`;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return `type ${name} = unknown[];`;
      const itemType = this.inferType(obj[0], strict, options);
      return `type ${name} = ${itemType}[];`;
    }
    if (typeof obj !== 'object') {
      return `type ${name} = ${this.inferType(obj, strict, options)};`;
    }

    const properties = Object.entries(obj).map(([key, value]) => {
      const propType = this.inferType(value, strict, options);
      const readonly = options.readonly ? 'readonly ' : '';
      const safeKey = this.needsQuotes(key) ? `"${key}"` : key;
      return `  ${readonly}${safeKey}: ${propType};`;
    });

    return `interface ${name} {\n${properties.join('\n')}\n}`;
  }

  private inferType(value: any, strict: boolean, options: TypeGenerationOptions): string {
    if (value === null) {
      return strict ? 'null' : 'null | undefined';
    }
    if (value === undefined) {
      return 'undefined';
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return strict ? 'never[]' : 'unknown[]';
      }

      // Check if all elements are the same type
      const types = [...new Set(value.map(v => this.inferPrimitiveType(v)))];
      if (types.length === 1) {
        return `${types[0]}[]`;
      }

      // Mixed types - create union
      return `(${types.join(' | ')})[]`;
    }
    if (typeof value === 'object') {
      // Anonymous object - generate inline type
      const props = Object.entries(value).map(([k, v]) => {
        const safeKey = this.needsQuotes(k) ? `"${k}"` : k;
        return `${safeKey}: ${this.inferType(v, strict, options)}`;
      });
      return `{ ${props.join('; ')} }`;
    }

    return this.inferPrimitiveType(value);
  }

  private inferPrimitiveType(value: any): string {
    const type = typeof value;
    if (type === 'string') {
      // Check if it's a specific string literal pattern
      if (this.isURL(value)) return 'string'; // Could be URL type
      if (this.isEmail(value)) return 'string'; // Could be `${string}@${string}.${string}`
      if (this.isUUID(value)) return 'string'; // Could be branded UUID type
      return 'string';
    }
    if (type === 'number') {
      return Number.isInteger(value) ? 'number' : 'number';
    }
    if (type === 'boolean') return 'boolean';
    if (type === 'bigint') return 'bigint';
    if (type === 'symbol') return 'symbol';
    return 'unknown';
  }

  private needsQuotes(key: string): boolean {
    // Check if key needs quotes (contains special chars or is a reserved word)
    return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || this.isReservedWord(key);
  }

  private isReservedWord(word: string): boolean {
    const reserved = ['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'as', 'implements', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static', 'yield', 'any', 'boolean', 'constructor', 'declare', 'get', 'module', 'require', 'number', 'set', 'string', 'symbol', 'type', 'from', 'of'];
    return reserved.includes(word);
  }

  private isURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isUUID(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  /**
   * Analyze common type errors and suggest fixes
   */
  analyzeTypeError(error: string): { fixes: string[]; explanation: string } {
    const fixes: string[] = [];
    let explanation = '';

    // Type 'X | undefined' is not assignable to type 'X'
    if (error.includes('| undefined') && error.includes('not assignable')) {
      fixes.push('Add null check: if (value !== undefined) { ... }');
      fixes.push('Use non-null assertion if guaranteed: value!');
      fixes.push('Provide default value: value ?? defaultValue');
      fixes.push('Update type to accept undefined: Type | undefined');
      explanation = 'The value may be undefined. Either guard against it, assert it\'s defined, provide a default, or update the type signature.';
    }

    // Type 'null' is not assignable to type 'X'
    else if (error.includes('null') && error.includes('not assignable')) {
      fixes.push('Add null check: if (value !== null) { ... }');
      fixes.push('Use nullish coalescing: value ?? defaultValue');
      fixes.push('Update type to accept null: Type | null');
      explanation = 'The value may be null. Handle it explicitly or update the type signature.';
    }

    // Property 'X' does not exist on type 'Y'
    else if (error.includes('Property') && error.includes('does not exist')) {
      const match = error.match(/Property '([^']+)' does not exist on type '([^']+)'/);
      if (match) {
        const [, prop, type] = match;
        fixes.push(`Add property to interface: ${prop}: Type`);
        fixes.push(`Use type assertion: (obj as any).${prop}`);
        fixes.push(`Optional chaining: obj?.${prop}`);
        fixes.push(`Type guard: if ('${prop}' in obj) { ... }`);
        explanation = `The property '${prop}' is not defined on type '${type}'. Add it to the type definition or use runtime checks.`;
      }
    }

    // Argument of type 'X' is not assignable to parameter of type 'Y'
    else if (error.includes('Argument of type') && error.includes('not assignable')) {
      fixes.push('Type assertion: value as ExpectedType');
      fixes.push('Type guard to narrow type before call');
      fixes.push('Update function parameter type');
      fixes.push('Convert value to expected type');
      explanation = 'The argument type doesn\'t match the parameter type. Convert the value or update type signatures.';
    }

    // Type 'any' is not allowed
    else if (error.includes('any') && (error.includes('implicitly') || error.includes('not allowed'))) {
      fixes.push('Add explicit type annotation');
      fixes.push('Use unknown instead of any');
      fixes.push('Define proper interface for the object');
      explanation = 'Using "any" defeats TypeScript\'s type safety. Add explicit types or use "unknown" with type guards.';
    }

    // Cannot find name 'X'
    else if (error.includes('Cannot find name')) {
      const match = error.match(/Cannot find name '([^']+)'/);
      if (match) {
        fixes.push(`Import the identifier: import { ${match[1]} } from '...'`);
        fixes.push(`Define the identifier: const ${match[1]} = ...`);
        fixes.push('Check for typos in the identifier name');
      }
      explanation = 'The identifier is not defined in the current scope. Import it or define it.';
    }

    // Generic fallback
    else {
      fixes.push('Review type signatures and ensure compatibility');
      fixes.push('Use type assertions if you\'re certain of the type');
      fixes.push('Add type guards for runtime type checking');
      explanation = 'Type mismatch detected. Review the types involved and ensure they\'re compatible.';
    }

    return { fixes, explanation };
  }
}
