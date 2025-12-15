/**
 * ServiceNow Dashboard Generator
 * Main entry point and public API
 */

export { QuestionEngine } from './questions/question-engine.js';
export { WidgetGenerator } from './generators/widget-generator.js';
export { TableGenerator } from './generators/table-generator.js';

export type {
  DashboardConfig,
  DashboardType,
  WidgetConfig,
  WidgetType,
  TableWidgetConfig,
  TableColumn,
  TableStyle,
  ChartWidgetConfig,
  ChartType,
  GaugeWidgetConfig,
  StatWidgetConfig,
  TimelineWidgetConfig,
  LayoutConfig,
  ThemeConfig,
  DataSource,
  Question,
  QuestionType,
  QuestionFlow,
  QuestionOption,
  ValidationRule,
  Answer,
  GeneratedCode,
  CodeSection,
  MCPRequest,
  MCPResponse,
  MCPTool,
  DashboardTemplate,
  OperationResult,
} from './types.js';
