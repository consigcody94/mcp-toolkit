/**
 * Type system for ServiceNow Dashboard Generator
 */

// ============================================================================
// Dashboard Types
// ============================================================================

export type DashboardType = 'homepage' | 'performance' | 'service' | 'custom';

export type WidgetType =
  | 'list'
  | 'chart'
  | 'gauge'
  | 'stat'
  | 'table'
  | 'timeline'
  | 'report'
  | 'iframe'
  | 'html';

export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'donut'
  | 'area'
  | 'scatter'
  | 'heatmap';

export type TableStyle = 'list' | 'grid' | 'card' | 'compact';

export interface DashboardConfig {
  name: string;
  title: string;
  description?: string;
  type: DashboardType;
  layout: LayoutConfig;
  widgets: WidgetConfig[];
  theme?: ThemeConfig;
  refreshInterval?: number; // seconds
}

export interface LayoutConfig {
  columns: number; // 1-12
  rows: number;
  responsive: boolean;
}

export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  headerColor: string;
  textColor: string;
  borderColor: string;
  cardShadow: boolean;
}

// ============================================================================
// Widget Types
// ============================================================================

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  dataSource: DataSource;
  config: WidgetSpecificConfig;
  styling?: WidgetStyling;
  interactions?: WidgetInteractions;
}

export interface WidgetPosition {
  row: number;
  column: number;
}

export interface WidgetSize {
  width: number; // 1-12 columns
  height: number; // pixels or rows
}

export interface DataSource {
  table: string;
  fields: string[];
  filter?: string;
  orderBy?: string;
  limit?: number;
  aggregation?: AggregationConfig;
}

export interface AggregationConfig {
  groupBy: string[];
  functions: {
    field: string;
    function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  }[];
}

export interface WidgetStyling {
  backgroundColor?: string;
  headerColor?: string;
  borderRadius?: number;
  padding?: number;
  fontSize?: string;
  fontFamily?: string;
}

export interface WidgetInteractions {
  clickable: boolean;
  drilldown?: string; // URL or dashboard to navigate to
  tooltip?: boolean;
  export?: boolean;
}

// ============================================================================
// Widget-Specific Configurations
// ============================================================================

export type WidgetSpecificConfig =
  | ListWidgetConfig
  | ChartWidgetConfig
  | GaugeWidgetConfig
  | StatWidgetConfig
  | TableWidgetConfig
  | TimelineWidgetConfig;

export interface ListWidgetConfig {
  style: TableStyle;
  columns: TableColumn[];
  rowsPerPage: number;
  sortable: boolean;
  filterable: boolean;
  showPagination: boolean;
}

export interface ChartWidgetConfig {
  chartType: ChartType;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
  legend: boolean;
  tooltip: boolean;
  colors?: string[];
}

export interface AxisConfig {
  field: string;
  label: string;
  type: 'category' | 'numeric' | 'datetime';
  format?: string;
}

export interface SeriesConfig {
  name: string;
  field: string;
  type: ChartType;
  color?: string;
}

export interface GaugeWidgetConfig {
  minValue: number;
  maxValue: number;
  valueField: string;
  thresholds: {
    value: number;
    color: string;
    label?: string;
  }[];
  showValue: boolean;
  suffix?: string; // e.g., "%", "ms"
}

export interface StatWidgetConfig {
  valueField: string;
  label: string;
  format: 'number' | 'currency' | 'percent' | 'duration';
  icon?: string;
  trend?: {
    field: string;
    showArrow: boolean;
  };
  comparison?: {
    label: string;
    value: number;
  };
}

export interface TableWidgetConfig {
  columns: TableColumn[];
  style: TableStyle;
  striped: boolean;
  bordered: boolean;
  hover: boolean;
  compact: boolean;
  sortable: boolean;
  filterable: boolean;
  paginated: boolean;
  rowsPerPage: number;
  selectable: boolean;
}

export interface TableColumn {
  field: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'datetime' | 'reference' | 'choice' | 'boolean';
  format?: string;
  renderer?: 'default' | 'badge' | 'progress' | 'link' | 'icon' | 'custom';
  colorCoding?: {
    field: string;
    mapping: { value: string; color: string }[];
  };
}

export interface TimelineWidgetConfig {
  dateField: string;
  titleField: string;
  descriptionField: string;
  iconField?: string;
  colorField?: string;
  groupBy?: string;
  sortOrder: 'asc' | 'desc';
}

// ============================================================================
// Question System Types
// ============================================================================

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  validation?: ValidationRule;
  defaultValue?: unknown;
  dependsOn?: {
    questionId: string;
    value: unknown;
  };
}

export type QuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'choice'
  | 'multiple-choice'
  | 'table-selector'
  | 'field-selector'
  | 'color-picker';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: unknown) => boolean;
}

export interface Answer {
  questionId: string;
  value: unknown;
}

export interface QuestionFlow {
  category: string;
  questions: Question[];
}

// ============================================================================
// Code Generation Types
// ============================================================================

export interface GeneratedCode {
  xml: string; // Widget XML
  clientScript: string; // Client-side JavaScript
  serverScript: string; // Server-side JavaScript (GlideAjax)
  css: string; // Custom styling
  html?: string; // HTML template
}

export interface CodeSection {
  name: string;
  language: 'xml' | 'javascript' | 'css' | 'html';
  code: string;
  description: string;
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
// Template Types
// ============================================================================

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: DashboardConfig;
  preview?: string; // Base64 image
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
