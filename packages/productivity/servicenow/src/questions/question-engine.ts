/**
 * Question Engine - Manages interactive dashboard configuration
 */

import type {
  Question,
  QuestionFlow,
  DashboardConfig,
  WidgetConfig,
} from '../types.js';

export class QuestionEngine {
  private answers: Map<string, unknown> = new Map();

  /**
   * Get all question flows
   */
  getAllFlows(): QuestionFlow[] {
    return [
      this.getBasicInfoFlow(),
      this.getLayoutFlow(),
      this.getWidgetFlow(),
      this.getThemeFlow(),
      this.getAdvancedFlow(),
    ];
  }

  /**
   * Basic dashboard information
   */
  private getBasicInfoFlow(): QuestionFlow {
    return {
      category: 'Basic Information',
      questions: [
        {
          id: 'dashboard_name',
          text: 'What is the technical name for your dashboard? (no spaces, lowercase)',
          type: 'text',
          validation: {
            required: true,
            pattern: '^[a-z][a-z0-9_]*$',
          },
          defaultValue: 'my_dashboard',
        },
        {
          id: 'dashboard_title',
          text: 'What is the display title for your dashboard?',
          type: 'text',
          validation: { required: true },
          defaultValue: 'My Dashboard',
        },
        {
          id: 'dashboard_description',
          text: 'Provide a brief description of your dashboard (optional)',
          type: 'text',
          validation: { required: false },
        },
        {
          id: 'dashboard_type',
          text: 'What type of dashboard are you creating?',
          type: 'choice',
          options: [
            {
              value: 'homepage',
              label: 'Homepage',
              description: 'User homepage with personalized widgets',
            },
            {
              value: 'performance',
              label: 'Performance Analytics',
              description: 'KPIs, metrics, and performance indicators',
            },
            {
              value: 'service',
              label: 'Service Portal',
              description: 'Public-facing service portal dashboard',
            },
            {
              value: 'custom',
              label: 'Custom',
              description: 'Custom dashboard for specific use case',
            },
          ],
          validation: { required: true },
          defaultValue: 'custom',
        },
      ],
    };
  }

  /**
   * Layout configuration
   */
  private getLayoutFlow(): QuestionFlow {
    return {
      category: 'Layout Configuration',
      questions: [
        {
          id: 'layout_columns',
          text: 'How many columns should your dashboard have? (1-12)',
          type: 'number',
          validation: { required: true, min: 1, max: 12 },
          defaultValue: 12,
        },
        {
          id: 'layout_responsive',
          text: 'Should the layout be responsive (adapt to screen size)?',
          type: 'boolean',
          defaultValue: true,
        },
      ],
    };
  }

  /**
   * Widget configuration
   */
  private getWidgetFlow(): QuestionFlow {
    return {
      category: 'Widget Configuration',
      questions: [
        {
          id: 'widget_count',
          text: 'How many widgets do you want to add?',
          type: 'number',
          validation: { required: true, min: 1, max: 20 },
          defaultValue: 3,
        },
        // Dynamic widget questions will be generated based on widget_count
      ],
    };
  }

  /**
   * Get questions for a specific widget
   */
  getWidgetQuestions(widgetIndex: number): Question[] {
    const prefix = `widget_${widgetIndex}_`;

    return [
      {
        id: `${prefix}type`,
        text: `Widget ${widgetIndex + 1}: What type of widget?`,
        type: 'choice',
        options: [
          { value: 'list', label: 'List', description: 'Display records in a list' },
          { value: 'table', label: 'Table', description: 'Advanced table with sorting and filtering' },
          { value: 'chart', label: 'Chart', description: 'Visualize data with charts' },
          { value: 'gauge', label: 'Gauge', description: 'Show single metric with gauge' },
          { value: 'stat', label: 'Stat', description: 'Display a key statistic' },
          { value: 'timeline', label: 'Timeline', description: 'Show events on a timeline' },
        ],
        validation: { required: true },
        defaultValue: 'table',
      },
      {
        id: `${prefix}title`,
        text: `Widget ${widgetIndex + 1}: Widget title`,
        type: 'text',
        validation: { required: true },
        defaultValue: `Widget ${widgetIndex + 1}`,
      },
      {
        id: `${prefix}table`,
        text: `Widget ${widgetIndex + 1}: Source table (e.g., incident, problem, change_request)`,
        type: 'text',
        validation: { required: true },
        defaultValue: 'incident',
      },
      {
        id: `${prefix}fields`,
        text: `Widget ${widgetIndex + 1}: Fields to display (comma-separated)`,
        type: 'text',
        validation: { required: true },
        defaultValue: 'number,short_description,state,priority,assigned_to',
      },
      {
        id: `${prefix}filter`,
        text: `Widget ${widgetIndex + 1}: Filter condition (optional, e.g., "active=true")`,
        type: 'text',
        validation: { required: false },
        defaultValue: 'active=true',
      },
      {
        id: `${prefix}limit`,
        text: `Widget ${widgetIndex + 1}: Maximum records to display`,
        type: 'number',
        validation: { required: true, min: 1, max: 1000 },
        defaultValue: 10,
      },
      {
        id: `${prefix}width`,
        text: `Widget ${widgetIndex + 1}: Width in columns (1-12)`,
        type: 'number',
        validation: { required: true, min: 1, max: 12 },
        defaultValue: 6,
      },
      {
        id: `${prefix}sortable`,
        text: `Widget ${widgetIndex + 1}: Allow sorting?`,
        type: 'boolean',
        defaultValue: true,
      },
      {
        id: `${prefix}filterable`,
        text: `Widget ${widgetIndex + 1}: Allow filtering?`,
        type: 'boolean',
        defaultValue: true,
      },
    ];
  }

  /**
   * Theme configuration
   */
  private getThemeFlow(): QuestionFlow {
    return {
      category: 'Theme & Styling',
      questions: [
        {
          id: 'theme_enabled',
          text: 'Do you want to customize the theme colors?',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'theme_primary',
          text: 'Primary color (hex code)',
          type: 'color-picker',
          validation: { required: false, pattern: '^#[0-9A-Fa-f]{6}$' },
          defaultValue: '#0066cc',
          dependsOn: { questionId: 'theme_enabled', value: true },
        },
        {
          id: 'theme_background',
          text: 'Background color (hex code)',
          type: 'color-picker',
          validation: { required: false, pattern: '^#[0-9A-Fa-f]{6}$' },
          defaultValue: '#f5f5f5',
          dependsOn: { questionId: 'theme_enabled', value: true },
        },
        {
          id: 'theme_card_shadow',
          text: 'Add shadow to widgets/cards?',
          type: 'boolean',
          defaultValue: true,
          dependsOn: { questionId: 'theme_enabled', value: true },
        },
      ],
    };
  }

  /**
   * Advanced settings
   */
  private getAdvancedFlow(): QuestionFlow {
    return {
      category: 'Advanced Settings',
      questions: [
        {
          id: 'refresh_interval',
          text: 'Auto-refresh interval in seconds (0 = disabled)',
          type: 'number',
          validation: { required: true, min: 0, max: 3600 },
          defaultValue: 0,
        },
        {
          id: 'enable_export',
          text: 'Enable data export functionality?',
          type: 'boolean',
          defaultValue: true,
        },
        {
          id: 'enable_print',
          text: 'Enable print-friendly view?',
          type: 'boolean',
          defaultValue: true,
        },
      ],
    };
  }

  /**
   * Record an answer
   */
  recordAnswer(questionId: string, value: unknown): void {
    this.answers.set(questionId, value);
  }

  /**
   * Get all answers
   */
  getAnswers(): Map<string, unknown> {
    return this.answers;
  }

  /**
   * Get answer by question ID
   */
  getAnswer(questionId: string): unknown {
    return this.answers.get(questionId);
  }

  /**
   * Check if a question should be displayed based on dependencies
   */
  shouldShowQuestion(question: Question): boolean {
    if (!question.dependsOn) {
      return true;
    }

    const dependentAnswer = this.answers.get(question.dependsOn.questionId);
    return dependentAnswer === question.dependsOn.value;
  }

  /**
   * Get filtered questions (accounting for dependencies)
   */
  getVisibleQuestions(flow: QuestionFlow): Question[] {
    return flow.questions.filter((q) => this.shouldShowQuestion(q));
  }

  /**
   * Convert answers to dashboard configuration
   */
  buildDashboardConfig(): DashboardConfig {
    const widgetCount = (this.getAnswer('widget_count') as number) || 1;
    const widgets: WidgetConfig[] = [];

    for (let i = 0; i < widgetCount; i++) {
      const prefix = `widget_${i}_`;
      const fields = ((this.getAnswer(`${prefix}fields`) as string) || '').split(',').map((f) => f.trim());

      const widget: WidgetConfig = {
        id: `widget_${i}`,
        type: (this.getAnswer(`${prefix}type`) as any) || 'table',
        title: (this.getAnswer(`${prefix}title`) as string) || `Widget ${i + 1}`,
        position: { row: Math.floor(i / 2), column: (i % 2) * 6 },
        size: {
          width: (this.getAnswer(`${prefix}width`) as number) || 6,
          height: 400,
        },
        dataSource: {
          table: (this.getAnswer(`${prefix}table`) as string) || 'incident',
          fields,
          filter: (this.getAnswer(`${prefix}filter`) as string) || undefined,
          limit: (this.getAnswer(`${prefix}limit`) as number) || 10,
        },
        config: {
          style: 'list',
          columns: fields.map((field) => ({
            field,
            label: field.replace(/_/g, ' ').toUpperCase(),
            sortable: this.getAnswer(`${prefix}sortable`) === true,
            filterable: this.getAnswer(`${prefix}filterable`) === true,
            type: 'text',
          })),
          rowsPerPage: (this.getAnswer(`${prefix}limit`) as number) || 10,
          sortable: this.getAnswer(`${prefix}sortable`) === true,
          filterable: this.getAnswer(`${prefix}filterable`) === true,
          showPagination: true,
        } as any,
      };

      widgets.push(widget);
    }

    const config: DashboardConfig = {
      name: (this.getAnswer('dashboard_name') as string) || 'my_dashboard',
      title: (this.getAnswer('dashboard_title') as string) || 'My Dashboard',
      description: (this.getAnswer('dashboard_description') as string) || undefined,
      type: (this.getAnswer('dashboard_type') as any) || 'custom',
      layout: {
        columns: (this.getAnswer('layout_columns') as number) || 12,
        rows: Math.ceil(widgetCount / 2),
        responsive: this.getAnswer('layout_responsive') !== false,
      },
      widgets,
      refreshInterval: (this.getAnswer('refresh_interval') as number) || undefined,
    };

    if (this.getAnswer('theme_enabled') === true) {
      config.theme = {
        primaryColor: (this.getAnswer('theme_primary') as string) || '#0066cc',
        backgroundColor: (this.getAnswer('theme_background') as string) || '#f5f5f5',
        headerColor: '#333333',
        textColor: '#333333',
        borderColor: '#dddddd',
        cardShadow: this.getAnswer('theme_card_shadow') !== false,
      };
    }

    return config;
  }
}
