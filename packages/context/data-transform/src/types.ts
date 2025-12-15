/**
 * Complete type system for universal data transformation
 */

// ============================================================================
// Data Format Types
// ============================================================================

export type DataFormat = 'csv' | 'json' | 'xml' | 'yaml' | 'tsv' | 'xlsx' | 'sql';

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'null' | 'object' | 'array';

// ============================================================================
// Data Structures
// ============================================================================

export interface DataRow {
  [key: string]: unknown;
}

export interface DataSet {
  headers: string[];
  rows: DataRow[];
  metadata: DataMetadata;
}

export interface DataMetadata {
  format: DataFormat;
  rowCount: number;
  columnCount: number;
  schema?: DataSchema;
  stats?: Record<string, ColumnStats>;
  encoding?: string;
  delimiter?: string;
}

// ============================================================================
// Schema Types
// ============================================================================

export interface DataSchema {
  [columnName: string]: ColumnSchema;
}

export interface ColumnSchema {
  type: DataType;
  required: boolean;
  unique?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  enum?: unknown[];
  format?: string;
}

export interface ColumnStats {
  type: DataType;
  nullCount: number;
  uniqueCount: number;
  min?: number | string | Date;
  max?: number | string | Date;
  avg?: number;
  median?: number;
  mode?: unknown;
  distribution?: Record<string, number>;
}

// ============================================================================
// Transformation Types
// ============================================================================

export interface TransformOptions {
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  options?: FormatOptions;
  mapping?: FieldMapping;
  filters?: DataFilter[];
  sort?: SortOptions;
  limit?: number;
  offset?: number;
}

export interface FormatOptions {
  // CSV/TSV options
  delimiter?: string;
  quoteChar?: string;
  escapeChar?: string;
  header?: boolean | string[];
  skipEmptyLines?: boolean;
  encoding?: string;

  // JSON options
  pretty?: boolean;
  indent?: number;
  arrayFormat?: 'single' | 'multiple';

  // XML options
  rootElement?: string;
  rowElement?: string;
  attributePrefix?: string;
  textNodeName?: string;

  // YAML options
  yamlVersion?: string;

  // Excel options
  sheetName?: string;
  sheetIndex?: number;

  // SQL options
  tableName?: string;
  batchSize?: number;
  includeSchema?: boolean;
}

export interface FieldMapping {
  [targetField: string]: string | MappingFunction;
}

export interface MappingFunction {
  source: string | string[];
  transform?: (value: unknown, row: DataRow) => unknown;
}

export interface DataFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
  caseSensitive?: boolean;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'matches';

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

export interface ValidationError {
  row: number;
  column?: string;
  message: string;
  value?: unknown;
  severity: 'error';
}

export interface ValidationWarning {
  row: number;
  column?: string;
  message: string;
  value?: unknown;
  severity: 'warning';
}

// ============================================================================
// Query Types
// ============================================================================

export interface QueryOptions {
  select?: string[];
  where?: DataFilter[];
  groupBy?: string[];
  orderBy?: SortOptions[];
  limit?: number;
  offset?: number;
  aggregate?: AggregateFunction[];
}

export interface AggregateFunction {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median' | 'mode';
  alias?: string;
}

export interface QueryResult {
  data: DataRow[];
  aggregates?: Record<string, unknown>;
  metadata: {
    totalRows: number;
    returnedRows: number;
    executionTime: number;
  };
}

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPRequest {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

export interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ============================================================================
// Operation Results
// ============================================================================

export interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}
