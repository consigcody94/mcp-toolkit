/**
 * Change Management Dashboard Template
 * Pre-configured dashboard for change request tracking
 */

import type { DashboardTemplate } from '../types.js';

export const changeDashboardTemplate: DashboardTemplate = {
  id: 'change_dashboard',
  name: 'Change Management Dashboard',
  description: 'Track and manage change requests with approval status and risk assessment',
  category: 'IT Service Management',
  config: {
    name: 'change_dashboard',
    title: 'Change Management',
    description: 'Monitor and manage change requests',
    type: 'performance',
    layout: {
      columns: 12,
      rows: 2,
      responsive: true,
    },
    widgets: [
      {
        id: 'pending_changes',
        type: 'table',
        title: 'Pending Changes',
        position: { row: 0, column: 0 },
        size: { width: 8, height: 400 },
        dataSource: {
          table: 'change_request',
          fields: ['number', 'short_description', 'risk', 'priority', 'state', 'approval'],
          filter: 'state!=3^state!=4',
          orderBy: 'priority',
          limit: 15,
        },
        config: {
          columns: [
            {
              field: 'number',
              label: 'CHG Number',
              sortable: true,
              filterable: true,
              type: 'text',
              renderer: 'link',
            },
            {
              field: 'short_description',
              label: 'Description',
              sortable: true,
              filterable: true,
              type: 'text',
            },
            {
              field: 'risk',
              label: 'Risk',
              sortable: true,
              filterable: true,
              type: 'choice',
              renderer: 'badge',
              align: 'center',
              colorCoding: {
                field: 'risk',
                mapping: [
                  { value: '1', color: '#dc3545' }, // High
                  { value: '2', color: '#ffc107' }, // Medium
                  { value: '3', color: '#28a745' }, // Low
                ],
              },
            },
            {
              field: 'priority',
              label: 'Priority',
              sortable: true,
              filterable: true,
              type: 'choice',
              renderer: 'badge',
              align: 'center',
            },
            {
              field: 'state',
              label: 'State',
              sortable: true,
              filterable: true,
              type: 'choice',
              renderer: 'badge',
            },
            {
              field: 'approval',
              label: 'Approval',
              sortable: true,
              filterable: true,
              type: 'choice',
              renderer: 'badge',
            },
          ],
          style: 'list',
          striped: true,
          bordered: true,
          hover: true,
          compact: false,
          sortable: true,
          filterable: true,
          paginated: true,
          rowsPerPage: 15,
          selectable: false,
        },
        interactions: {
          clickable: true,
          export: true,
          tooltip: true,
        },
      },
      {
        id: 'change_stats',
        type: 'stat',
        title: 'Active Changes',
        position: { row: 0, column: 8 },
        size: { width: 4, height: 400 },
        dataSource: {
          table: 'change_request',
          fields: ['sys_id'],
          filter: 'state!=3^state!=4',
          aggregation: {
            groupBy: [],
            functions: [{ field: 'sys_id', function: 'COUNT' }],
          },
        },
        config: {
          valueField: 'count',
          label: 'Active',
          format: 'number',
          icon: 'fa-cog',
        },
      },
    ],
    theme: {
      primaryColor: '#28a745',
      backgroundColor: '#f5f5f5',
      headerColor: '#333333',
      textColor: '#333333',
      borderColor: '#dddddd',
      cardShadow: true,
    },
    refreshInterval: 120,
  },
};
