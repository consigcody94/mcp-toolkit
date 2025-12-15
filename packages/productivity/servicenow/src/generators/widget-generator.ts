/**
 * ServiceNow Widget Generator
 * Generates XML, JavaScript, and CSS for ServiceNow widgets
 */

import type {
  DashboardConfig,
  WidgetConfig,
  GeneratedCode,
  TableWidgetConfig,
  ListWidgetConfig,
} from '../types.js';

export class WidgetGenerator {
  /**
   * Generate complete widget code from dashboard configuration
   */
  generateWidget(config: DashboardConfig): GeneratedCode {
    const xml = this.generateWidgetXML(config);
    const clientScript = this.generateClientScript(config);
    const serverScript = this.generateServerScript(config);
    const css = this.generateCSS(config);
    const html = this.generateHTML(config);

    return {
      xml,
      clientScript,
      serverScript,
      css,
      html,
    };
  }

  /**
   * Generate ServiceNow Widget XML definition
   */
  private generateWidgetXML(config: DashboardConfig): string {
    const { name, title, description, type } = config;

    return `<?xml version="1.0" encoding="UTF-8"?>
<record>
  <sys_class_name>sp_widget</sys_class_name>
  <name>${name}_widget</name>
  <id>${name}_widget</id>
  <template><![CDATA[
    <div class="dashboard-container ${name}-dashboard">
      <div class="dashboard-header">
        <h2 class="dashboard-title">{{c.data.title}}</h2>
        ${description ? `<p class="dashboard-description">{{c.data.description}}</p>` : ''}
      </div>

      <div class="dashboard-grid" ng-class="{'responsive': c.data.responsive}">
        ${config.widgets.map((widget, index) => this.generateWidgetHTML(widget, index)).join('\n        ')}
      </div>

      ${config.refreshInterval ? `
      <div class="dashboard-footer">
        <span class="refresh-indicator" ng-if="c.data.lastRefresh">
          Last updated: {{c.data.lastRefresh | date:'short'}}
        </span>
      </div>` : ''}
    </div>
  ]]></template>

  <option_schema><![CDATA[
    [
      {
        "name": "dashboard_id",
        "label": "Dashboard ID",
        "type": "string"
      },
      {
        "name": "auto_refresh",
        "label": "Auto Refresh (seconds)",
        "type": "integer",
        "default_value": ${config.refreshInterval || 0}
      }
    ]
  ]]></option_schema>

  <public>false</public>
  <roles></roles>
  <data_table>sp_instance</data_table>
  <description>${description || title}</description>
  <category>${type}</category>
</record>`;
  }

  /**
   * Generate HTML for individual widget
   */
  private generateWidgetHTML(widget: WidgetConfig, index: number): string {
    const { id, type, size } = widget;
    const widthClass = `col-md-${size.width}`;

    if (type === 'table' || type === 'list') {
      return `
<div class="dashboard-widget ${widthClass}" id="${id}">
  <div class="widget-card">
    <div class="widget-header">
      <h3 class="widget-title">{{c.data.widgets[${index}].title}}</h3>
      <div class="widget-actions">
        <button class="btn btn-sm btn-icon" ng-click="c.refreshWidget(${index})"
                title="Refresh">
          <i class="fa fa-refresh"></i>
        </button>
        ${widget.interactions?.export ? `
        <button class="btn btn-sm btn-icon" ng-click="c.exportWidget(${index})"
                title="Export">
          <i class="fa fa-download"></i>
        </button>` : ''}
      </div>
    </div>

    <div class="widget-body">
      ${this.generateTableHTML(widget, index)}
    </div>
  </div>
</div>`;
    }

    if (type === 'stat') {
      return `
<div class="dashboard-widget ${widthClass}" id="${id}">
  <div class="widget-card stat-card">
    <div class="stat-content">
      <div class="stat-value">{{c.data.widgets[${index}].value}}</div>
      <div class="stat-label">{{c.data.widgets[${index}].label}}</div>
      ${widget.config && (widget.config as any).trend ? `
      <div class="stat-trend" ng-class="c.data.widgets[${index}].trendClass">
        <i class="fa" ng-class="c.data.widgets[${index}].trendIcon"></i>
        <span>{{c.data.widgets[${index}].trendValue}}</span>
      </div>` : ''}
    </div>
  </div>
</div>`;
    }

    return `<div class="dashboard-widget ${widthClass}" id="${id}">
  <div class="widget-card">
    <h3>{{c.data.widgets[${index}].title}}</h3>
    <p>Widget type: ${type}</p>
  </div>
</div>`;
  }

  /**
   * Generate table HTML with advanced features
   */
  private generateTableHTML(widget: WidgetConfig, index: number): string {
    const config = widget.config as TableWidgetConfig | ListWidgetConfig;
    const { sortable, filterable } = config;

    return `
<div class="table-widget">
  ${filterable ? `
  <div class="table-filters">
    <input type="text" class="form-control search-input"
           ng-model="c.widgets[${index}].searchTerm"
           ng-change="c.filterTable(${index})"
           placeholder="Search...">
  </div>` : ''}

  <div class="table-responsive">
    <table class="table table-hover table-striped widget-table">
      <thead>
        <tr>
          ${config.columns.map((col) => `
          <th ng-click="${sortable ? `c.sortTable(${index}, '${col.field}')` : ''}"
              class="${sortable ? 'sortable' : ''}">
            ${col.label}
            ${sortable ? `
            <i class="fa sort-icon"
               ng-class="c.widgets[${index}].sortField === '${col.field}' ?
                        (c.widgets[${index}].sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') :
                        'fa-sort'"></i>` : ''}
          </th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="row in c.data.widgets[${index}].rows |
                       ${filterable ? `filter:c.widgets[${index}].searchTerm | ` : ''}
                       ${sortable ? `orderBy:c.widgets[${index}].sortField:c.widgets[${index}].sortDir | ` : ''}
                       limitTo:c.widgets[${index}].pageSize:((c.widgets[${index}].currentPage-1)*c.widgets[${index}].pageSize)"
            ng-click="c.onRowClick(${index}, row)">
          ${config.columns.map((col) => {
      if (col.renderer === 'badge') {
        return `
          <td>
            <span class="badge" ng-class="c.getBadgeClass(row.${col.field})">
              {{row.${col.field}}}
            </span>
          </td>`;
      }
      if (col.renderer === 'link') {
        return `
          <td>
            <a href="{{c.getRecordUrl(row.sys_id)}}" target="_blank">
              {{row.${col.field}}}
            </a>
          </td>`;
      }
      return `
          <td>{{row.${col.field}}}</td>`;
    }).join('')}
        </tr>
      </tbody>
    </table>
  </div>

  ${(config as any).showPagination !== false || (config as any).paginated !== false ? `
  <div class="table-pagination">
    <div class="pagination-info">
      Showing {{((c.widgets[${index}].currentPage-1) * c.widgets[${index}].pageSize) + 1}}
      to {{c.widgets[${index}].currentPage * c.widgets[${index}].pageSize > c.data.widgets[${index}].total ?
            c.data.widgets[${index}].total :
            c.widgets[${index}].currentPage * c.widgets[${index}].pageSize}}
      of {{c.data.widgets[${index}].total}} records
    </div>
    <div class="pagination-controls">
      <button class="btn btn-sm"
              ng-click="c.changePage(${index}, c.widgets[${index}].currentPage - 1)"
              ng-disabled="c.widgets[${index}].currentPage === 1">
        Previous
      </button>
      <span class="page-number">Page {{c.widgets[${index}].currentPage}}</span>
      <button class="btn btn-sm"
              ng-click="c.changePage(${index}, c.widgets[${index}].currentPage + 1)"
              ng-disabled="c.widgets[${index}].currentPage * c.widgets[${index}].pageSize >= c.data.widgets[${index}].total">
        Next
      </button>
    </div>
  </div>` : ''}
</div>`;
  }

  /**
   * Generate client-side controller JavaScript
   */
  private generateClientScript(config: DashboardConfig): string {
    return `(function() {
  'use strict';

  angular.module('ng').controller('${config.name}Controller', function($scope, $interval, spUtil) {
    var c = this;

    // Initialize data
    c.data = {
      title: ${JSON.stringify(config.title)},
      description: ${JSON.stringify(config.description)},
      responsive: ${config.layout.responsive},
      widgets: [],
      lastRefresh: null
    };

    // Initialize widget states
    c.widgets = [];
    ${config.widgets.map((widget, index) => `
    c.widgets[${index}] = {
      currentPage: 1,
      pageSize: ${widget.dataSource.limit || 10},
      sortField: null,
      sortDir: 'asc',
      searchTerm: ''
    };`).join('')}

    /**
     * Load all widget data
     */
    c.loadData = function() {
      c.server.get({
        dashboard_id: c.options.dashboard_id
      }).then(function(response) {
        c.data.widgets = response.data.widgets;
        c.data.lastRefresh = new Date();
      });
    };

    /**
     * Refresh specific widget
     */
    c.refreshWidget = function(widgetIndex) {
      c.server.update({
        action: 'refresh_widget',
        widget_index: widgetIndex
      }).then(function(response) {
        c.data.widgets[widgetIndex] = response.data.widget;
      });
    };

    /**
     * Sort table by column
     */
    c.sortTable = function(widgetIndex, field) {
      var widget = c.widgets[widgetIndex];

      if (widget.sortField === field) {
        // Toggle sort direction
        widget.sortDir = widget.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        // New field, default to ascending
        widget.sortField = field;
        widget.sortDir = 'asc';
      }
    };

    /**
     * Filter table data
     */
    c.filterTable = function(widgetIndex) {
      // Reset to first page when filtering
      c.widgets[widgetIndex].currentPage = 1;
    };

    /**
     * Change page
     */
    c.changePage = function(widgetIndex, newPage) {
      c.widgets[widgetIndex].currentPage = newPage;
    };

    /**
     * Handle row click
     */
    c.onRowClick = function(widgetIndex, row) {
      if (row.sys_id) {
        spUtil.recordWatch(row.sys_class_name || 'task', row.sys_id);
      }
    };

    /**
     * Export widget data
     */
    c.exportWidget = function(widgetIndex) {
      var widget = c.data.widgets[widgetIndex];
      var csv = c.convertToCSV(widget.rows, widget.columns);
      c.downloadCSV(csv, widget.title + '.csv');
    };

    /**
     * Convert data to CSV
     */
    c.convertToCSV = function(rows, columns) {
      var header = columns.map(function(col) { return col.label; }).join(',');
      var body = rows.map(function(row) {
        return columns.map(function(col) {
          return '"' + (row[col.field] || '') + '"';
        }).join(',');
      }).join('\\n');

      return header + '\\n' + body;
    };

    /**
     * Download CSV file
     */
    c.downloadCSV = function(csv, filename) {
      var blob = new Blob([csv], { type: 'text/csv' });
      var link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    };

    /**
     * Get badge class based on value
     */
    c.getBadgeClass = function(value) {
      var valueStr = String(value).toLowerCase();

      // Priority badges
      if (valueStr === '1' || valueStr === 'critical') return 'badge-danger';
      if (valueStr === '2' || valueStr === 'high') return 'badge-warning';
      if (valueStr === '3' || valueStr === 'medium') return 'badge-info';
      if (valueStr === '4' || valueStr === 'low') return 'badge-success';

      // State badges
      if (valueStr === 'new' || valueStr === '1') return 'badge-primary';
      if (valueStr === 'in progress' || valueStr === '2') return 'badge-info';
      if (valueStr === 'resolved' || valueStr === '6') return 'badge-success';
      if (valueStr === 'closed' || valueStr === '7') return 'badge-secondary';

      return 'badge-secondary';
    };

    /**
     * Get record URL
     */
    c.getRecordUrl = function(sysId) {
      return '?id=form&table=task&sys_id=' + sysId;
    };

    // Auto-refresh setup
    ${config.refreshInterval ? `
    var refreshInterval = $interval(function() {
      c.loadData();
    }, ${config.refreshInterval * 1000});

    $scope.$on('$destroy', function() {
      $interval.cancel(refreshInterval);
    });` : ''}

    // Initial load
    c.loadData();
  });
})();`;
  }

  /**
   * Generate server-side script (GlideAjax)
   */
  private generateServerScript(config: DashboardConfig): string {
    return `(function() {
  'use strict';

  /**
   * Server-side data provider for ${config.title}
   */
  data.dashboard_id = input.dashboard_id;
  data.widgets = [];

  ${config.widgets.map((widget, index) => `
  // Widget ${index}: ${widget.title}
  data.widgets.push(getWidget${index}Data());`).join('')}

  ${config.widgets.map((widget, index) => this.generateWidgetServerFunction(widget, index)).join('\n  ')}

  /**
   * Get widget data by index
   */
  function getWidgetByIndex(widgetIndex) {
    switch(parseInt(widgetIndex)) {
      ${config.widgets.map((_widget, index) => `
      case ${index}:
        return getWidget${index}Data();`).join('')}
      default:
        return null;
    }
  }

  // Handle refresh action
  if (input.action === 'refresh_widget' && input.widget_index !== undefined) {
    data.widget = getWidgetByIndex(input.widget_index);
  }

})();`;
  }

  /**
   * Generate server function for specific widget
   */
  private generateWidgetServerFunction(widget: WidgetConfig, index: number): string {
    const { dataSource, config: widgetConfig } = widget;
    const columns = (widgetConfig as TableWidgetConfig | ListWidgetConfig).columns;

    return `
  /**
   * Get data for widget: ${widget.title}
   */
  function getWidget${index}Data() {
    var gr = new GlideRecord('${dataSource.table}');

    // Apply filters
    ${dataSource.filter ? `gr.addEncodedQuery('${dataSource.filter}');` : ''}

    // Apply ordering
    ${dataSource.orderBy ? `gr.orderBy('${dataSource.orderBy}');` : ''}

    // Set limit
    gr.setLimit(${dataSource.limit || 100});
    gr.query();

    var rows = [];
    var total = gr.getRowCount();

    while (gr.next()) {
      var row = {
        sys_id: gr.getUniqueValue(),
        sys_class_name: gr.getTableName()
      };

      ${columns ? columns.map((col) => `
      row.${col.field} = gr.getValue('${col.field}') || '';`).join('') : ''}

      rows.push(row);
    }

    return {
      title: '${widget.title}',
      rows: rows,
      total: total,
      columns: ${JSON.stringify(columns)}
    };
  }`;
  }

  /**
   * Generate CSS for amazing table styling
   */
  private generateCSS(config: DashboardConfig): string {
    const theme = config.theme;
    const primaryColor = theme?.primaryColor || '#0066cc';
    const backgroundColor = theme?.backgroundColor || '#f5f5f5';
    const cardShadow = theme?.cardShadow !== false;

    return `/* ${config.title} - Dashboard Styles */

.${config.name}-dashboard {
  background-color: ${backgroundColor};
  padding: 20px;
  min-height: 100vh;
}

/* Dashboard Header */
.dashboard-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid ${primaryColor};
}

.dashboard-title {
  color: ${theme?.headerColor || '#333333'};
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.dashboard-description {
  color: ${theme?.textColor || '#666666'};
  font-size: 16px;
  margin: 0;
}

/* Dashboard Grid */
.dashboard-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 0 -10px;
}

.dashboard-grid.responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Widget Cards */
.dashboard-widget {
  padding: 0 10px;
  margin-bottom: 20px;
}

.widget-card {
  background: white;
  border-radius: 8px;
  ${cardShadow ? 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);' : 'border: 1px solid #e0e0e0;'}
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.widget-card:hover {
  ${cardShadow ? 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);' : ''}
}

/* Widget Header */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
  border-bottom: 1px solid ${theme?.borderColor || '#dddddd'};
}

.widget-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.widget-actions {
  display: flex;
  gap: 8px;
}

.widget-actions .btn-icon {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.widget-actions .btn-icon:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Widget Body */
.widget-body {
  padding: 20px;
}

/* Table Widget Styles */
.table-widget {
  width: 100%;
}

.table-filters {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid ${theme?.borderColor || '#dddddd'};
  border-radius: 4px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: ${primaryColor};
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

/* Table Styles */
.table-responsive {
  overflow-x: auto;
  border-radius: 4px;
  border: 1px solid ${theme?.borderColor || '#dddddd'};
}

.widget-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.widget-table thead {
  background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
}

.widget-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid ${theme?.borderColor || '#dddddd'};
  position: relative;
  user-select: none;
}

.widget-table th.sortable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.widget-table th.sortable:hover {
  background-color: #dee2e6;
}

.widget-table .sort-icon {
  margin-left: 8px;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.widget-table th.sortable:hover .sort-icon {
  opacity: 1;
}

.widget-table tbody tr {
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s ease;
}

.widget-table tbody tr:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}

.widget-table tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}

.widget-table tbody tr:nth-child(even):hover {
  background-color: #e9ecef;
}

.widget-table td {
  padding: 12px 16px;
  color: #212529;
  font-size: 14px;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-primary { background-color: ${primaryColor}; color: white; }
.badge-success { background-color: #28a745; color: white; }
.badge-danger { background-color: #dc3545; color: white; }
.badge-warning { background-color: #ffc107; color: #212529; }
.badge-info { background-color: #17a2b8; color: white; }
.badge-secondary { background-color: #6c757d; color: white; }

/* Pagination */
.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid ${theme?.borderColor || '#dddddd'};
}

.pagination-info {
  color: #6c757d;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-controls .btn {
  padding: 6px 12px;
  border: 1px solid ${theme?.borderColor || '#dddddd'};
  background: white;
  color: ${primaryColor};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-controls .btn:hover:not(:disabled) {
  background: ${primaryColor};
  color: white;
  border-color: ${primaryColor};
}

.pagination-controls .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number {
  font-weight: 600;
  color: #495057;
}

/* Stat Card Styles */
.stat-card {
  text-align: center;
  padding: 30px 20px;
}

.stat-value {
  font-size: 48px;
  font-weight: 700;
  color: ${primaryColor};
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-trend {
  margin-top: 15px;
  font-size: 14px;
  font-weight: 600;
}

.stat-trend.positive { color: #28a745; }
.stat-trend.negative { color: #dc3545; }

/* Dashboard Footer */
.dashboard-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid ${theme?.borderColor || '#dddddd'};
  text-align: center;
}

.refresh-indicator {
  color: #6c757d;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-title {
    font-size: 24px;
  }

  .widget-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .widget-actions {
    width: 100%;
    justify-content: center;
  }

  .table-responsive {
    border: none;
  }

  .widget-table {
    font-size: 12px;
  }

  .widget-table th,
  .widget-table td {
    padding: 8px;
  }

  .table-pagination {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .stat-value {
    font-size: 36px;
  }
}

/* Print Styles */
@media print {
  .widget-actions,
  .table-filters,
  .table-pagination {
    display: none;
  }

  .widget-card {
    box-shadow: none;
    border: 1px solid #dddddd;
    page-break-inside: avoid;
  }
}`;
  }

  /**
   * Generate HTML template
   */
  private generateHTML(config: DashboardConfig): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${config.title}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${config.name}.css">
</head>
<body>
  <div id="${config.name}-root" ng-controller="${config.name}Controller as c">
    <!-- Widget content will be rendered here by ServiceNow -->
  </div>
  <script src="${config.name}.js"></script>
</body>
</html>`;
  }

  /**
   * Utility: Adjust color brightness
   */
  private adjustColor(color: string, amount: number): string {
    // Remove # if present
    color = color.replace('#', '');

    // Convert to RGB
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    const rr = r.toString(16).padStart(2, '0');
    const gg = g.toString(16).padStart(2, '0');
    const bb = b.toString(16).padStart(2, '0');

    return `#${rr}${gg}${bb}`;
  }
}
