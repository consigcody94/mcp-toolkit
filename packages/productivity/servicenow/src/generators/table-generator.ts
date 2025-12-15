/**
 * Advanced Table Configuration Generator
 * Creates beautiful, feature-rich tables for ServiceNow
 */

import type {
  TableWidgetConfig,
  TableColumn,
  TableStyle,
  WidgetConfig,
} from '../types.js';

export class TableGenerator {
  /**
   * Generate enhanced table configuration with advanced features
   */
  generateTableConfig(widget: WidgetConfig): TableWidgetConfig {
    const baseConfig = widget.config as Partial<TableWidgetConfig>;

    return {
      columns: this.enhanceColumns(baseConfig.columns || []),
      style: baseConfig.style || 'list',
      striped: baseConfig.striped !== false,
      bordered: baseConfig.bordered !== false,
      hover: baseConfig.hover !== false,
      compact: baseConfig.compact || false,
      sortable: baseConfig.sortable !== false,
      filterable: baseConfig.filterable !== false,
      paginated: baseConfig.paginated !== false,
      rowsPerPage: baseConfig.rowsPerPage || 10,
      selectable: baseConfig.selectable || false,
    };
  }

  /**
   * Enhance columns with smart defaults
   */
  private enhanceColumns(columns: TableColumn[]): TableColumn[] {
    return columns.map((col) => this.enhanceColumn(col));
  }

  /**
   * Enhance individual column with intelligent configuration
   */
  private enhanceColumn(column: Partial<TableColumn>): TableColumn {
    const field = column.field || '';
    const type = column.type || this.inferColumnType(field);
    const renderer = column.renderer || this.inferRenderer(field, type);

    return {
      field,
      label: column.label || this.generateLabel(field),
      width: column.width,
      align: column.align || this.inferAlignment(type),
      sortable: column.sortable !== false,
      filterable: column.filterable !== false,
      type,
      format: column.format || this.getDefaultFormat(type),
      renderer,
      colorCoding: column.colorCoding || this.inferColorCoding(field),
    };
  }

  /**
   * Infer column type from field name
   */
  private inferColumnType(field: string): TableColumn['type'] {
    const fieldLower = field.toLowerCase();

    // Date fields
    if (fieldLower.includes('date') || fieldLower.includes('time') ||
        fieldLower.endsWith('_at') || fieldLower.endsWith('_on')) {
      return fieldLower.includes('time') || fieldLower.includes('_at') ? 'datetime' : 'date';
    }

    // Number fields
    if (fieldLower.includes('count') || fieldLower.includes('number') ||
        fieldLower.includes('amount') || fieldLower.includes('quantity') ||
        fieldLower.includes('total') || fieldLower.includes('price')) {
      return 'number';
    }

    // Reference fields
    if (fieldLower.endsWith('_by') || fieldLower.endsWith('_to') ||
        fieldLower.includes('assigned') || fieldLower.includes('requested') ||
        fieldLower.includes('opened') || fieldLower.includes('closed')) {
      return 'reference';
    }

    // Boolean fields
    if (fieldLower.startsWith('is_') || fieldLower.startsWith('has_') ||
        fieldLower === 'active' || fieldLower === 'enabled') {
      return 'boolean';
    }

    // Choice fields (common ServiceNow fields)
    if (['state', 'priority', 'urgency', 'impact', 'severity', 'status'].includes(fieldLower)) {
      return 'choice';
    }

    return 'text';
  }

  /**
   * Infer appropriate renderer for field
   */
  private inferRenderer(field: string, type: TableColumn['type']): TableColumn['renderer'] {
    const fieldLower = field.toLowerCase();

    // Priority, state, status should use badges
    if (['priority', 'state', 'status', 'urgency', 'impact', 'severity'].includes(fieldLower)) {
      return 'badge';
    }

    // Number field should use default
    if (fieldLower === 'number' || fieldLower.endsWith('_number')) {
      return 'link';
    }

    // Boolean fields should use icons
    if (type === 'boolean') {
      return 'icon';
    }

    // Progress fields
    if (fieldLower.includes('progress') || fieldLower.includes('completion') ||
        fieldLower.includes('percent')) {
      return 'progress';
    }

    return 'default';
  }

  /**
   * Infer text alignment based on type
   */
  private inferAlignment(type: TableColumn['type']): 'left' | 'center' | 'right' {
    if (type === 'number') return 'right';
    if (type === 'boolean' || type === 'choice') return 'center';
    return 'left';
  }

  /**
   * Generate human-readable label from field name
   */
  private generateLabel(field: string): string {
    return field
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get default format for column type
   */
  private getDefaultFormat(type: TableColumn['type']): string | undefined {
    switch (type) {
      case 'date':
        return 'MM/dd/yyyy';
      case 'datetime':
        return 'MM/dd/yyyy HH:mm:ss';
      case 'number':
        return '0,0';
      default:
        return undefined;
    }
  }

  /**
   * Infer color coding for common ServiceNow fields
   */
  private inferColorCoding(field: string): TableColumn['colorCoding'] | undefined {
    const fieldLower = field.toLowerCase();

    // Priority color coding
    if (fieldLower === 'priority') {
      return {
        field: 'priority',
        mapping: [
          { value: '1', color: '#dc3545' }, // Critical - Red
          { value: '2', color: '#fd7e14' }, // High - Orange
          { value: '3', color: '#ffc107' }, // Medium - Yellow
          { value: '4', color: '#28a745' }, // Low - Green
          { value: '5', color: '#6c757d' }, // Planning - Gray
        ],
      };
    }

    // State color coding for incidents
    if (fieldLower === 'state') {
      return {
        field: 'state',
        mapping: [
          { value: '1', color: '#17a2b8' }, // New - Blue
          { value: '2', color: '#ffc107' }, // In Progress - Yellow
          { value: '3', color: '#fd7e14' }, // On Hold - Orange
          { value: '6', color: '#28a745' }, // Resolved - Green
          { value: '7', color: '#6c757d' }, // Closed - Gray
          { value: '8', color: '#dc3545' }, // Canceled - Red
        ],
      };
    }

    // Urgency/Impact color coding
    if (fieldLower === 'urgency' || fieldLower === 'impact') {
      return {
        field: fieldLower,
        mapping: [
          { value: '1', color: '#dc3545' }, // High - Red
          { value: '2', color: '#ffc107' }, // Medium - Yellow
          { value: '3', color: '#28a745' }, // Low - Green
        ],
      };
    }

    // Severity color coding
    if (fieldLower === 'severity') {
      return {
        field: 'severity',
        mapping: [
          { value: '1', color: '#dc3545' }, // Critical - Red
          { value: '2', color: '#fd7e14' }, // Major - Orange
          { value: '3', color: '#ffc107' }, // Moderate - Yellow
          { value: '4', color: '#17a2b8' }, // Minor - Blue
        ],
      };
    }

    return undefined;
  }

  /**
   * Generate CSS for table styles
   */
  generateTableCSS(style: TableStyle, config: TableWidgetConfig): string {
    const baseCSS = this.getBaseTableCSS();
    const styleCSS = this.getStyleSpecificCSS(style, config);

    return `${baseCSS}\n\n${styleCSS}`;
  }

  /**
   * Get base table CSS
   */
  private getBaseTableCSS(): string {
    return `/* Base Table Styles */
.amazing-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.amazing-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
}

.amazing-table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
  padding: 16px;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.amazing-table tbody tr {
  transition: all 0.2s ease-in-out;
}

.amazing-table tbody tr:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.amazing-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

/* Column Renderers */
.cell-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.cell-link {
  color: #0066cc;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.cell-link:hover {
  color: #004499;
  text-decoration: underline;
}

.cell-icon {
  font-size: 18px;
  text-align: center;
}

.cell-icon.true {
  color: #28a745;
}

.cell-icon.false {
  color: #dc3545;
}

.cell-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar-container {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0066cc 0%, #0088ff 100%);
  transition: width 0.3s ease;
}

.progress-value {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  min-width: 40px;
  text-align: right;
}

/* Sortable Headers */
.sortable-header {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 30px;
}

.sortable-header::after {
  content: '⇅';
  position: absolute;
  right: 10px;
  opacity: 0.3;
  transition: opacity 0.2s ease;
}

.sortable-header:hover::after {
  opacity: 0.6;
}

.sortable-header.sorted-asc::after {
  content: '↑';
  opacity: 1;
}

.sortable-header.sorted-desc::after {
  content: '↓';
  opacity: 1;
}

/* Filterable Headers */
.filter-input {
  width: 100%;
  padding: 6px 10px;
  margin-top: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

/* Selection */
.selectable-row {
  cursor: pointer;
}

.selection-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Loading State */
.table-loading {
  position: relative;
  opacity: 0.6;
  pointer-events: none;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0066cc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.table-empty {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-message {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #adb5bd;
}`;
  }

  /**
   * Get style-specific CSS
   */
  private getStyleSpecificCSS(style: TableStyle, config: TableWidgetConfig): string {
    switch (style) {
      case 'list':
        return this.getListStyleCSS(config);
      case 'grid':
        return this.getGridStyleCSS(config);
      case 'card':
        return this.getCardStyleCSS(config);
      case 'compact':
        return this.getCompactStyleCSS(config);
      default:
        return '';
    }
  }

  /**
   * List style CSS
   */
  private getListStyleCSS(config: TableWidgetConfig): string {
    return `/* List Style */
.amazing-table.style-list {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.amazing-table.style-list tbody tr {
  background: white;
}

${config.striped ? `
.amazing-table.style-list tbody tr:nth-child(even) {
  background: #f8f9fa;
}` : ''}

${config.hover ? `
.amazing-table.style-list tbody tr:hover {
  background: #e9ecef;
}` : ''}`;
  }

  /**
   * Grid style CSS
   */
  private getGridStyleCSS(config: TableWidgetConfig): string {
    return `/* Grid Style */
.amazing-table.style-grid {
  border: none;
}

.amazing-table.style-grid th,
.amazing-table.style-grid td {
  border: 1px solid #dee2e6;
}

.amazing-table.style-grid tbody tr {
  background: white;
}

${config.hover ? `
.amazing-table.style-grid tbody tr:hover td {
  background: #f8f9fa;
  border-color: #0066cc;
}` : ''}`;
  }

  /**
   * Card style CSS
   */
  private getCardStyleCSS(config: TableWidgetConfig): string {
    return `/* Card Style */
.table-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.table-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

${config.hover ? `
.table-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-color: #0066cc;
}` : ''}

.table-card-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f3f5;
}

.table-card-field:last-child {
  border-bottom: none;
}

.table-card-label {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: #6c757d;
  letter-spacing: 0.5px;
}

.table-card-value {
  font-size: 14px;
  color: #212529;
}`;
  }

  /**
   * Compact style CSS
   */
  private getCompactStyleCSS(config: TableWidgetConfig): string {
    return `/* Compact Style */
.amazing-table.style-compact th,
.amazing-table.style-compact td {
  padding: 8px 12px;
  font-size: 13px;
}

.amazing-table.style-compact th {
  padding: 10px 12px;
}

.amazing-table.style-compact {
  border: 1px solid #dee2e6;
}

.amazing-table.style-compact tbody tr {
  background: white;
}

${config.striped ? `
.amazing-table.style-compact tbody tr:nth-child(even) {
  background: #fafbfc;
}` : ''}

${config.hover ? `
.amazing-table.style-compact tbody tr:hover {
  background: #e9ecef;
}` : ''}`;
  }

  /**
   * Generate pagination HTML
   */
  generatePaginationHTML(config: TableWidgetConfig): string {
    if (!config.paginated) return '';

    return `
<div class="table-pagination-advanced">
  <div class="pagination-summary">
    <span class="pagination-text">
      Showing
      <strong>{{startRecord}}</strong>
      to
      <strong>{{endRecord}}</strong>
      of
      <strong>{{totalRecords}}</strong>
      records
    </span>
    <span class="pagination-page-size">
      <label>Rows per page:</label>
      <select ng-model="pageSize" ng-change="onPageSizeChange()">
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </span>
  </div>

  <div class="pagination-navigation">
    <button class="pagination-btn" ng-click="goToFirstPage()" ng-disabled="currentPage === 1">
      <i class="fa fa-angle-double-left"></i>
    </button>
    <button class="pagination-btn" ng-click="goToPreviousPage()" ng-disabled="currentPage === 1">
      <i class="fa fa-angle-left"></i>
    </button>

    <div class="pagination-pages">
      <button class="pagination-page"
              ng-repeat="page in visiblePages"
              ng-click="goToPage(page)"
              ng-class="{'active': page === currentPage}">
        {{page}}
      </button>
    </div>

    <button class="pagination-btn" ng-click="goToNextPage()" ng-disabled="currentPage === totalPages">
      <i class="fa fa-angle-right"></i>
    </button>
    <button class="pagination-btn" ng-click="goToLastPage()" ng-disabled="currentPage === totalPages">
      <i class="fa fa-angle-double-right"></i>
    </button>
  </div>

  <div class="pagination-jump">
    <label>Go to page:</label>
    <input type="number"
           min="1"
           max="{{totalPages}}"
           ng-model="jumpToPage"
           ng-change="onJumpToPage()"
           class="page-jump-input">
  </div>
</div>`;
  }

  /**
   * Generate advanced pagination CSS
   */
  generatePaginationCSS(): string {
    return `/* Advanced Pagination */
.table-pagination-advanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  border-radius: 0 0 8px 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.pagination-text {
  font-size: 14px;
  color: #495057;
}

.pagination-page-size {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
}

.pagination-page-size select {
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.pagination-navigation {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn {
  padding: 6px 10px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  color: #495057;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #0066cc;
  border-color: #0066cc;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 4px;
  padding: 0 8px;
}

.pagination-page {
  min-width: 36px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  color: #495057;
  font-weight: 500;
  transition: all 0.2s ease;
}

.pagination-page:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.pagination-page.active {
  background: #0066cc;
  border-color: #0066cc;
  color: white;
}

.pagination-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
}

.page-jump-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.page-jump-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

@media (max-width: 768px) {
  .table-pagination-advanced {
    flex-direction: column;
    gap: 15px;
  }

  .pagination-summary,
  .pagination-navigation,
  .pagination-jump {
    width: 100%;
    justify-content: center;
  }
}`;
  }
}
