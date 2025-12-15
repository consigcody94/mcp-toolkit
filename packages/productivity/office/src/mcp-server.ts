#!/usr/bin/env node
/**
 * Office Whisperer - MCP Server v4.0
 * 143 Professional Tools for Microsoft Office Suite Automation
 * Control Excel, Word, PowerPoint, and Outlook through natural language with Claude Desktop
 */

import { ExcelGenerator } from './generators/excel-generator.js';
import { WordGenerator } from './generators/word-generator.js';
import { PowerPointGenerator } from './generators/powerpoint-generator.js';
import { OutlookGenerator } from './generators/outlook-generator.js';
import type { MCPRequest, MCPResponse, MCPTool } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

class OfficeWhispererServer {
  private excelGen = new ExcelGenerator();
  private wordGen = new WordGenerator();
  private pptGen = new PowerPointGenerator();
  private outlookGen = new OutlookGenerator();

  private tools: MCPTool[] = [
    // ========== EXCEL TOOLS (21 tools) ==========
    {
      name: 'create_excel',
      description: '📊 Create Excel workbook with sheets, data, formulas, and charts',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Output filename (e.g., "report.xlsx")' },
          sheets: { type: 'array', description: 'Array of sheet configurations' },
          outputPath: { type: 'string', description: 'Optional output directory' },
        },
        required: ['filename', 'sheets'],
      },
    },
    {
      name: 'excel_add_pivot_table',
      description: '📈 Add pivot table with rows, columns, values, and filters',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          pivotTable: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'pivotTable'],
      },
    },
    {
      name: 'excel_add_chart',
      description: '📉 Add chart (line/bar/pie/scatter/area) with customization',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          chart: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'chart'],
      },
    },
    {
      name: 'excel_add_formula',
      description: '🔢 Add formulas (VLOOKUP, SUMIF, INDEX/MATCH, IF, etc)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          formulas: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'formulas'],
      },
    },
    {
      name: 'excel_conditional_formatting',
      description: '🎨 Apply conditional formatting (color scales, data bars, icon sets)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          range: { type: 'string' },
          rules: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'range', 'rules'],
      },
    },
    {
      name: 'excel_data_validation',
      description: '✅ Add dropdown lists and validation rules',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          range: { type: 'string' },
          validation: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'range', 'validation'],
      },
    },
    {
      name: 'excel_freeze_panes',
      description: '❄️ Freeze rows/columns for scrolling',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          row: { type: 'number' },
          column: { type: 'number' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName'],
      },
    },
    {
      name: 'excel_filter_sort',
      description: '🔍 Apply AutoFilter and sorting',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          range: { type: 'string' },
          sortBy: { type: 'array' },
          autoFilter: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName'],
      },
    },
    {
      name: 'excel_format_cells',
      description: '✨ Format cells (fonts, colors, borders, alignment, number formats)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          range: { type: 'string' },
          style: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'range', 'style'],
      },
    },
    {
      name: 'excel_named_range',
      description: '🏷️ Create and manage named ranges',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          name: { type: 'string' },
          range: { type: 'string' },
          sheetName: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'name', 'range'],
      },
    },
    {
      name: 'excel_protect_sheet',
      description: '🔒 Protect worksheets with passwords',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          password: { type: 'string' },
          options: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName'],
      },
    },
    {
      name: 'excel_merge_workbooks',
      description: '🔗 Merge multiple Excel files',
      inputSchema: {
        type: 'object',
        properties: {
          files: { type: 'array' },
          outputFilename: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['files', 'outputFilename'],
      },
    },
    {
      name: 'excel_find_replace',
      description: '🔎 Find and replace values/formulas',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          find: { type: 'string' },
          replace: { type: 'string' },
          matchCase: { type: 'boolean' },
          matchEntireCell: { type: 'boolean' },
          searchFormulas: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'find', 'replace'],
      },
    },
    {
      name: 'excel_to_json',
      description: '📋 Export Excel to JSON format',
      inputSchema: {
        type: 'object',
        properties: {
          excelPath: { type: 'string' },
          sheetName: { type: 'string' },
          outputPath: { type: 'string' },
          header: { type: 'boolean' },
        },
        required: ['excelPath'],
      },
    },
    {
      name: 'excel_to_csv',
      description: '📄 Convert Excel to CSV format',
      inputSchema: {
        type: 'object',
        properties: {
          excelPath: { type: 'string' },
          sheetName: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['excelPath'],
      },
    },
    {
      name: 'excel_add_sparklines',
      description: '✨ Add sparklines (mini charts in cells)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          dataRange: { type: 'string' },
          location: { type: 'string' },
          type: { type: 'string', enum: ['line', 'column', 'winLoss'] },
          options: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'dataRange', 'location', 'type'],
      },
    },
    {
      name: 'excel_array_formulas',
      description: '🔢 Add dynamic array formulas (UNIQUE, SORT, FILTER)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          formulas: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'formulas'],
      },
    },
    {
      name: 'excel_add_subtotals',
      description: '📊 Add subtotals with grouping',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          range: { type: 'string' },
          groupBy: { type: 'number' },
          summaryFunction: { type: 'string', enum: ['SUM', 'COUNT', 'AVERAGE', 'MAX', 'MIN'] },
          summaryColumns: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'range', 'groupBy', 'summaryFunction', 'summaryColumns'],
      },
    },
    {
      name: 'excel_add_hyperlinks',
      description: '🔗 Add hyperlinks to cells (URLs or internal links)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          links: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'links'],
      },
    },
    {
      name: 'excel_advanced_charts',
      description: '📈 Create advanced charts (waterfall, funnel, treemap, sunburst)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          chart: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'chart'],
      },
    },
    {
      name: 'excel_add_slicers',
      description: '🎛️ Add slicers for tables/pivot tables',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          tableName: { type: 'string' },
          slicers: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'tableName', 'slicers'],
      },
    },
    {
      name: 'excel_power_query',
      description: '📊 Power Query transformations (filter, sort, merge, pivot)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          queryName: { type: 'string' },
          source: { type: 'object' },
          transformations: { type: 'array' },
          loadTo: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'queryName', 'source'],
      },
    },
    {
      name: 'excel_goal_seek',
      description: '🎯 Goal Seek what-if analysis to find input value',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          setCell: { type: 'string' },
          toValue: { type: 'number' },
          byChangingCell: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'setCell', 'toValue', 'byChangingCell'],
      },
    },
    {
      name: 'excel_data_table',
      description: '📊 Create one/two variable data tables for scenarios',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          type: { type: 'string', enum: ['oneVariable', 'twoVariable'] },
          formulaCell: { type: 'string' },
          rowInputCell: { type: 'string' },
          columnInputCell: { type: 'string' },
          outputRange: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'type', 'formulaCell', 'outputRange'],
      },
    },
    {
      name: 'excel_scenario_manager',
      description: '📈 Scenario Manager with multiple what-if scenarios',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          scenarios: { type: 'array' },
          resultCells: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'scenarios'],
      },
    },
    {
      name: 'excel_create_table',
      description: '📊 Create Excel Tables with styles and features',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          tableName: { type: 'string' },
          range: { type: 'string' },
          hasHeaders: { type: 'boolean' },
          style: { type: 'string' },
          showTotalRow: { type: 'boolean' },
          showFilterButton: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'tableName', 'range'],
      },
    },
    {
      name: 'excel_table_formula',
      description: '📊 Add table structured reference formulas',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          tableName: { type: 'string' },
          columnName: { type: 'string' },
          formula: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'tableName', 'columnName', 'formula'],
      },
    },
    {
      name: 'excel_form_controls',
      description: '📊 Add form controls (button, checkbox, dropdown, spinner)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          controls: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'controls'],
      },
    },
    {
      name: 'excel_insert_images',
      description: '📊 Insert and position images in worksheets',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          images: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'images'],
      },
    },
    {
      name: 'excel_insert_shapes',
      description: '📊 Insert shapes and connectors',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          shapes: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'shapes'],
      },
    },
    {
      name: 'excel_smart_art',
      description: '📊 Insert SmartArt graphics (list, process, hierarchy)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          smartArt: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'smartArt'],
      },
    },
    {
      name: 'excel_page_setup',
      description: '📊 Page setup (orientation, margins, print area)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          pageSetup: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'pageSetup'],
      },
    },
    {
      name: 'excel_header_footer',
      description: '📊 Headers and footers with special codes',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          header: { type: 'object' },
          footer: { type: 'object' },
          differentFirstPage: { type: 'boolean' },
          differentOddEven: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName'],
      },
    },
    {
      name: 'excel_page_breaks',
      description: '📊 Configure page breaks for printing',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          horizontalBreaks: { type: 'array' },
          verticalBreaks: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName'],
      },
    },
    {
      name: 'excel_track_changes',
      description: '📊 Track changes and highlight modifications',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          enable: { type: 'boolean' },
          highlightChanges: { type: 'boolean' },
          listChangesOnNewSheet: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'enable'],
      },
    },
    {
      name: 'excel_share_workbook',
      description: '📊 Configure workbook sharing settings',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          share: { type: 'boolean' },
          allowChanges: { type: 'boolean' },
          protectSharing: { type: 'boolean' },
          password: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'share'],
      },
    },
    {
      name: 'excel_compare_versions',
      description: '📊 Compare two Excel files and highlight differences',
      inputSchema: {
        type: 'object',
        properties: {
          originalFile: { type: 'string' },
          revisedFile: { type: 'string' },
          outputPath: { type: 'string' },
          highlightDifferences: { type: 'boolean' },
        },
        required: ['originalFile', 'revisedFile'],
      },
    },
    {
      name: 'excel_add_comments',
      description: '📊 Add cell comments with author information',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sheetName: { type: 'string' },
          comments: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sheetName', 'comments'],
      },
    },

    // ========== WORD TOOLS (16 tools) ==========
    {
      name: 'create_word',
      description: '📝 Create Word document with paragraphs, tables, images, and formatting',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          title: { type: 'string' },
          sections: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sections'],
      },
    },
    {
      name: 'word_add_toc',
      description: '📑 Add table of contents',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          outputPath: { type: 'string' },
          title: { type: 'string' },
          hyperlinks: { type: 'boolean' },
          levels: { type: 'number' },
        },
        required: ['filename'],
      },
    },
    {
      name: 'word_mail_merge',
      description: '✉️ Mail merge with data source',
      inputSchema: {
        type: 'object',
        properties: {
          templatePath: { type: 'string' },
          dataSource: { type: 'array' },
          outputPath: { type: 'string' },
          outputFilename: { type: 'string' },
        },
        required: ['templatePath', 'dataSource'],
      },
    },
    {
      name: 'word_find_replace',
      description: '🔍 Find and replace text with formatting',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          find: { type: 'string' },
          replace: { type: 'string' },
          matchCase: { type: 'boolean' },
          matchWholeWord: { type: 'boolean' },
          formatting: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'find', 'replace'],
      },
    },
    {
      name: 'word_add_comment',
      description: '💬 Add comments and track changes',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          text: { type: 'string' },
          comment: { type: 'string' },
          author: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'text', 'comment'],
      },
    },
    {
      name: 'word_format_styles',
      description: '🎨 Apply and customize styles/themes',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          styles: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'styles'],
      },
    },
    {
      name: 'word_insert_image',
      description: '🖼️ Insert and position images with wrapping',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          imagePath: { type: 'string' },
          position: { type: 'object' },
          size: { type: 'object' },
          wrapping: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'imagePath'],
      },
    },
    {
      name: 'word_add_header_footer',
      description: '📄 Customize headers/footers per section',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          type: { type: 'string', enum: ['header', 'footer'] },
          content: { type: 'array' },
          sectionType: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'type', 'content'],
      },
    },
    {
      name: 'word_compare_documents',
      description: '🔄 Compare two documents and show differences',
      inputSchema: {
        type: 'object',
        properties: {
          originalPath: { type: 'string' },
          revisedPath: { type: 'string' },
          outputPath: { type: 'string' },
          author: { type: 'string' },
        },
        required: ['originalPath', 'revisedPath'],
      },
    },
    {
      name: 'word_to_pdf',
      description: '📑 Export Word document to PDF',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename'],
      },
    },
    {
      name: 'word_track_changes',
      description: '✏️ Enable/disable track changes',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          enable: { type: 'boolean' },
          author: { type: 'string' },
          showMarkup: { type: 'boolean' },
          trackFormatting: { type: 'boolean' },
          trackMoves: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'enable'],
      },
    },
    {
      name: 'word_add_footnotes',
      description: '📌 Add footnotes and endnotes',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          footnotes: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'footnotes'],
      },
    },
    {
      name: 'word_add_bookmarks',
      description: '🔖 Add bookmarks to text',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          bookmarks: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'bookmarks'],
      },
    },
    {
      name: 'word_add_section_breaks',
      description: '📄 Add section breaks (next page, continuous, even/odd page)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          breaks: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'breaks'],
      },
    },
    {
      name: 'word_add_text_boxes',
      description: '📦 Add text boxes with positioning',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          textBoxes: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'textBoxes'],
      },
    },
    {
      name: 'word_add_cross_references',
      description: '🔗 Add cross-references to bookmarks',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          references: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'references'],
      },
    },
    {
      name: 'word_bibliography',
      description: '📄 Create bibliography (APA, MLA, Chicago, Harvard, IEEE)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sources: { type: 'array' },
          style: { type: 'string', enum: ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE'] },
          insertAt: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sources'],
      },
    },
    {
      name: 'word_citations',
      description: '📄 Insert citations with page numbers',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          citations: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'citations'],
      },
    },
    {
      name: 'word_index',
      description: '📄 Generate index with entries and subentries',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          entries: { type: 'array' },
          title: { type: 'string' },
          columns: { type: 'number' },
          insertAt: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'entries'],
      },
    },
    {
      name: 'word_mark_index_entry',
      description: '📄 Mark text for index inclusion',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          textToMark: { type: 'string' },
          entryText: { type: 'string' },
          crossReference: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'textToMark'],
      },
    },
    {
      name: 'word_form_fields',
      description: '📄 Add form fields (text, checkbox, dropdown, date)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          fields: { type: 'array' },
          protectForm: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'fields'],
      },
    },
    {
      name: 'word_content_controls',
      description: '📄 Add content controls (rich text, dropdown, date picker)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          controls: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'controls'],
      },
    },
    {
      name: 'word_smart_art',
      description: '📄 Insert SmartArt (process, hierarchy, relationship)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          smartArt: { type: 'object' },
          position: { type: 'number' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'smartArt'],
      },
    },
    {
      name: 'word_equations',
      description: '📄 Insert equations (LaTeX, MathML, linear format)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          equations: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'equations'],
      },
    },
    {
      name: 'word_symbols',
      description: '📄 Insert special characters and symbols',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          symbols: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'symbols'],
      },
    },
    {
      name: 'word_accessibility_check',
      description: '📄 Check document accessibility compliance',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          checks: { type: 'object' },
          autoFix: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'checks'],
      },
    },
    {
      name: 'word_alt_text',
      description: '📄 Add alt text to images for accessibility',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          altTexts: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'altTexts'],
      },
    },
    {
      name: 'word_digital_signature',
      description: '📄 Add or verify digital signatures',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          action: { type: 'string', enum: ['add', 'remove', 'verify'] },
          certificatePath: { type: 'string' },
          password: { type: 'string' },
          reason: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'action'],
      },
    },
    {
      name: 'word_protect_document',
      description: '📄 Protect document (read-only, forms, tracked changes)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          protection: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'protection'],
      },
    },
    {
      name: 'word_master_document',
      description: '📄 Create master document with subdocuments',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          subdocuments: { type: 'array' },
          generateTOC: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'subdocuments'],
      },
    },
    {
      name: 'word_document_info',
      description: '📄 Set document metadata (author, title, keywords)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          info: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'info'],
      },
    },
    {
      name: 'word_captions',
      description: '📄 Add figure and table captions',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          captions: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'captions'],
      },
    },
    {
      name: 'word_advanced_hyperlinks',
      description: '📄 Add advanced hyperlinks with tooltips',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          hyperlinks: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'hyperlinks'],
      },
    },
    {
      name: 'word_drop_cap',
      description: '📄 Add drop cap formatting to paragraphs',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          paragraphIndex: { type: 'number' },
          style: { type: 'string', enum: ['dropped', 'inMargin'] },
          lines: { type: 'number' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'paragraphIndex', 'style'],
      },
    },
    {
      name: 'word_watermark',
      description: '📄 Add text or image watermark',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          watermark: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'watermark'],
      },
    },

    // ========== POWERPOINT TOOLS (13 tools) ==========
    {
      name: 'create_powerpoint',
      description: '🎬 Create PowerPoint presentation with slides, text, images, and charts',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          title: { type: 'string' },
          theme: { type: 'string', enum: ['default', 'light', 'dark', 'colorful'] },
          slides: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slides'],
      },
    },
    {
      name: 'ppt_add_transition',
      description: '✨ Add slide transitions (fade, push, wipe, etc)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          transition: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'transition'],
      },
    },
    {
      name: 'ppt_add_animation',
      description: '🎭 Add animations to objects (entrance, emphasis, exit)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          objectId: { type: 'string' },
          animation: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'animation'],
      },
    },
    {
      name: 'ppt_add_notes',
      description: '📝 Add/edit speaker notes',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          notes: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'notes'],
      },
    },
    {
      name: 'ppt_duplicate_slide',
      description: '📋 Duplicate slides',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          position: { type: 'number' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber'],
      },
    },
    {
      name: 'ppt_reorder_slides',
      description: '🔀 Reorder slide sequence',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideOrder: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideOrder'],
      },
    },
    {
      name: 'ppt_export_pdf',
      description: '📑 Export presentation to PDF',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['filename'],
      },
    },
    {
      name: 'ppt_add_media',
      description: '🎥 Embed video/audio',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          mediaPath: { type: 'string' },
          mediaType: { type: 'string', enum: ['video', 'audio'] },
          position: { type: 'object' },
          size: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'mediaPath', 'mediaType'],
      },
    },
    {
      name: 'ppt_define_master_slide',
      description: '🎨 Define custom master slide templates',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          masterSlide: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'masterSlide'],
      },
    },
    {
      name: 'ppt_add_hyperlinks',
      description: '🔗 Add hyperlinks to text/objects (URLs or slide links)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          links: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'links'],
      },
    },
    {
      name: 'ppt_add_sections',
      description: '📁 Organize slides into sections',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          sections: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'sections'],
      },
    },
    {
      name: 'ppt_morph_transition',
      description: '✨ Add morph transition between slides',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          fromSlide: { type: 'number' },
          toSlide: { type: 'number' },
          duration: { type: 'number' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'fromSlide', 'toSlide'],
      },
    },
    {
      name: 'ppt_add_action_buttons',
      description: '🔘 Add interactive action buttons',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          buttons: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'buttons'],
      },
    },
    {
      name: 'ppt_smart_art',
      description: '🎯 SmartArt graphics (list, process, hierarchy, cycle)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          smartArt: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'smartArt'],
      },
    },
    {
      name: 'ppt_insert_icons',
      description: '🎯 Insert Microsoft SVG icons from library',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          icons: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'icons'],
      },
    },
    {
      name: 'ppt_3d_models',
      description: '🎯 Insert 3D models (.glb, .fbx)',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          models: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'models'],
      },
    },
    {
      name: 'ppt_zoom',
      description: '🎯 Summary/Slide/Section Zoom navigation',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          zooms: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'zooms'],
      },
    },
    {
      name: 'ppt_recording',
      description: '🎯 Screen recording configuration',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          recording: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'recording'],
      },
    },
    {
      name: 'ppt_live_web',
      description: '🎯 Embed live web page in slide',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          webPages: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'webPages'],
      },
    },
    {
      name: 'ppt_designer',
      description: '🎯 PowerPoint Designer suggestions',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          preferences: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename'],
      },
    },
    {
      name: 'ppt_collaboration',
      description: '🎯 Add comments and @mentions',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          comments: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'comments'],
      },
    },
    {
      name: 'ppt_presenter_coach',
      description: '🎯 Presenter Coach rehearsal settings',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          settings: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'settings'],
      },
    },
    {
      name: 'ppt_subtitles',
      description: '🎯 Live subtitles and captions configuration',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          subtitles: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'subtitles'],
      },
    },
    {
      name: 'ppt_ink_annotations',
      description: '🎯 Digital ink drawings and annotations',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          annotations: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'annotations'],
      },
    },
    {
      name: 'ppt_grid_guides',
      description: '🎯 Grids and guides for alignment',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          grid: { type: 'object' },
          guides: { type: 'object' },
          smartGuides: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['filename'],
      },
    },
    {
      name: 'ppt_custom_show',
      description: '🎯 Create custom slide shows',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          shows: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'shows'],
      },
    },
    {
      name: 'ppt_animation_pane',
      description: '🎯 Animation pane for timing and order',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          slideNumber: { type: 'number' },
          animations: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'slideNumber', 'animations'],
      },
    },
    {
      name: 'ppt_slide_master_advanced',
      description: '🎯 Advanced slide master customization',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          master: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'master'],
      },
    },
    {
      name: 'ppt_theme',
      description: '🎯 Apply and customize themes',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          theme: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'theme'],
      },
    },
    {
      name: 'ppt_template',
      description: '🎯 Save as template with placeholders',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          template: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['filename', 'template'],
      },
    },

    // ========== OUTLOOK TOOLS (13 tools) ==========
    {
      name: 'outlook_send_email',
      description: '📧 Send emails with attachments',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
          cc: { type: 'string' },
          bcc: { type: 'string' },
          attachments: { type: 'array' },
          html: { type: 'boolean' },
          priority: { type: 'string', enum: ['high', 'normal', 'low'] },
          smtpConfig: { type: 'object' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
    {
      name: 'outlook_create_meeting',
      description: '📅 Create calendar events with attendees',
      inputSchema: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          location: { type: 'string' },
          attendees: { type: 'array' },
          description: { type: 'string' },
          reminder: { type: 'number' },
          outputPath: { type: 'string' },
        },
        required: ['subject', 'startTime', 'endTime'],
      },
    },
    {
      name: 'outlook_add_contact',
      description: '👤 Add contact to address book',
      inputSchema: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          jobTitle: { type: 'string' },
          address: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['firstName', 'lastName'],
      },
    },
    {
      name: 'outlook_create_task',
      description: '✅ Create Outlook task',
      inputSchema: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          dueDate: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'normal', 'low'] },
          status: { type: 'string' },
          category: { type: 'string' },
          reminder: { type: 'string' },
          notes: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['subject'],
      },
    },
    {
      name: 'outlook_set_rule',
      description: '⚙️ Create inbox rule',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          conditions: { type: 'array' },
          actions: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['name', 'conditions', 'actions'],
      },
    },
    {
      name: 'outlook_read_emails',
      description: '📬 Read emails from IMAP server',
      inputSchema: {
        type: 'object',
        properties: {
          folder: { type: 'string' },
          limit: { type: 'number' },
          unreadOnly: { type: 'boolean' },
          since: { type: 'string' },
          imapConfig: { type: 'object' },
        },
      },
    },
    {
      name: 'outlook_search_emails',
      description: '🔍 Search emails by query',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          searchIn: { type: 'array' },
          folder: { type: 'string' },
          limit: { type: 'number' },
          since: { type: 'string' },
          imapConfig: { type: 'object' },
        },
        required: ['query'],
      },
    },
    {
      name: 'outlook_recurring_meeting',
      description: '🔄 Create recurring calendar meetings',
      inputSchema: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          recurrence: { type: 'object' },
          location: { type: 'string' },
          attendees: { type: 'array' },
          description: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['subject', 'startTime', 'endTime', 'recurrence'],
      },
    },
    {
      name: 'outlook_save_template',
      description: '📧 Save email template with placeholders',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
          html: { type: 'boolean' },
          placeholders: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['name', 'subject', 'body'],
      },
    },
    {
      name: 'outlook_mark_read',
      description: '✉️ Mark emails as read/unread',
      inputSchema: {
        type: 'object',
        properties: {
          messageIds: { type: 'array' },
          markAsRead: { type: 'boolean' },
          imapConfig: { type: 'object' },
        },
        required: ['messageIds', 'markAsRead'],
      },
    },
    {
      name: 'outlook_archive_email',
      description: '📦 Archive emails to folder',
      inputSchema: {
        type: 'object',
        properties: {
          messageIds: { type: 'array' },
          archiveFolder: { type: 'string' },
          imapConfig: { type: 'object' },
        },
        required: ['messageIds'],
      },
    },
    {
      name: 'outlook_calendar_view',
      description: '📅 Get calendar view for date range',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          viewType: { type: 'string', enum: ['day', 'week', 'month', 'agenda'] },
          outputFormat: { type: 'string', enum: ['ics', 'json'] },
          outputPath: { type: 'string' },
        },
        required: ['startDate', 'endDate', 'viewType'],
      },
    },
    {
      name: 'outlook_search_contacts',
      description: '👥 Search contacts database',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          searchIn: { type: 'array' },
          outputFormat: { type: 'string', enum: ['vcf', 'json'] },
          outputPath: { type: 'string' },
        },
        required: ['query'],
      },
    },
    {
      name: 'outlook_read_full_email',
      description: '📧 Full IMAP email read with attachments and headers',
      inputSchema: {
        type: 'object',
        properties: {
          messageIds: { type: 'array' },
          folder: { type: 'string' },
          includeAttachments: { type: 'boolean' },
          includeHeaders: { type: 'boolean' },
          markAsRead: { type: 'boolean' },
          imapConfig: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['messageIds'],
      },
    },
    {
      name: 'outlook_delete_email',
      description: '📧 Delete emails via IMAP',
      inputSchema: {
        type: 'object',
        properties: {
          messageIds: { type: 'array' },
          folder: { type: 'string' },
          permanent: { type: 'boolean' },
          imapConfig: { type: 'object' },
        },
        required: ['messageIds'],
      },
    },
    {
      name: 'outlook_move_email',
      description: '📧 Move emails between IMAP folders',
      inputSchema: {
        type: 'object',
        properties: {
          messageIds: { type: 'array' },
          fromFolder: { type: 'string' },
          toFolder: { type: 'string' },
          createFolder: { type: 'boolean' },
          imapConfig: { type: 'object' },
        },
        required: ['messageIds', 'toFolder'],
      },
    },
    {
      name: 'outlook_create_folder',
      description: '📧 Create IMAP folder structure',
      inputSchema: {
        type: 'object',
        properties: {
          folderPath: { type: 'string' },
          parent: { type: 'string' },
          imapConfig: { type: 'object' },
        },
        required: ['folderPath'],
      },
    },
    {
      name: 'outlook_shared_mailbox',
      description: '📧 Access shared mailboxes and delegate accounts',
      inputSchema: {
        type: 'object',
        properties: {
          sharedMailbox: { type: 'string' },
          operation: { type: 'string', enum: ['list', 'send', 'read', 'move', 'delete'] },
          folder: { type: 'string' },
          messageIds: { type: 'array' },
          emailData: { type: 'object' },
          imapConfig: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['sharedMailbox', 'operation'],
      },
    },
    {
      name: 'outlook_delegate_access',
      description: '📧 Grant delegate permissions to users',
      inputSchema: {
        type: 'object',
        properties: {
          delegateEmail: { type: 'string' },
          permissions: { type: 'object' },
          receiveNotifications: { type: 'boolean' },
          privateItemsAccess: { type: 'boolean' },
          outputPath: { type: 'string' },
        },
        required: ['delegateEmail', 'permissions'],
      },
    },
    {
      name: 'outlook_out_of_office',
      description: '📧 Set automatic replies/out of office',
      inputSchema: {
        type: 'object',
        properties: {
          enable: { type: 'boolean' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          message: { type: 'object' },
          externalAudience: { type: 'string' },
          declineNewMeetings: { type: 'boolean' },
          imapConfig: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['enable', 'message'],
      },
    },
    {
      name: 'outlook_notes',
      description: '📧 Create Outlook notes',
      inputSchema: {
        type: 'object',
        properties: {
          notes: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['notes'],
      },
    },
    {
      name: 'outlook_journal',
      description: '📧 Create journal entries for activity tracking',
      inputSchema: {
        type: 'object',
        properties: {
          entries: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['entries'],
      },
    },
    {
      name: 'outlook_rss_feed',
      description: '📧 Subscribe to and manage RSS feeds',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['add', 'remove', 'list', 'update'] },
          feeds: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'outlook_data_file',
      description: '📧 Manage PST/OST data files',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['create', 'open', 'close', 'compact', 'info'] },
          filePath: { type: 'string' },
          fileType: { type: 'string', enum: ['pst', 'ost'] },
          password: { type: 'string' },
          displayName: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'outlook_quick_steps',
      description: '📧 Create Quick Steps for email automation',
      inputSchema: {
        type: 'object',
        properties: {
          steps: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['steps'],
      },
    },
    {
      name: 'outlook_conversation_view',
      description: '📧 Configure conversation view settings',
      inputSchema: {
        type: 'object',
        properties: {
          enable: { type: 'boolean' },
          settings: { type: 'object' },
          folders: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['enable'],
      },
    },
    {
      name: 'outlook_cleanup',
      description: '📧 Clean up redundant messages in conversations',
      inputSchema: {
        type: 'object',
        properties: {
          folder: { type: 'string' },
          scope: { type: 'string', enum: ['conversation', 'folderAndSubfolders', 'selectedMessages'] },
          messageIds: { type: 'array' },
          deleteRedundant: { type: 'boolean' },
          imapConfig: { type: 'object' },
        },
        required: ['scope'],
      },
    },
    {
      name: 'outlook_ignore_conversation',
      description: '📧 Ignore conversation threads',
      inputSchema: {
        type: 'object',
        properties: {
          conversationIds: { type: 'array' },
          restore: { type: 'boolean' },
          deleteExisting: { type: 'boolean' },
          imapConfig: { type: 'object' },
        },
        required: ['conversationIds'],
      },
    },
    {
      name: 'outlook_flag_email',
      description: '📧 Flag emails with colors and due dates',
      inputSchema: {
        type: 'object',
        properties: {
          messageIds: { type: 'array' },
          flag: { type: 'object' },
          imapConfig: { type: 'object' },
        },
        required: ['messageIds', 'flag'],
      },
    },
    {
      name: 'outlook_categories',
      description: '📧 Create and apply color categories',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['create', 'apply', 'remove', 'list'] },
          categories: { type: 'array' },
          messageIds: { type: 'array' },
          categoryNames: { type: 'array' },
          imapConfig: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'outlook_signature',
      description: '📧 Create HTML email signatures',
      inputSchema: {
        type: 'object',
        properties: {
          signatures: { type: 'array' },
          outputPath: { type: 'string' },
        },
        required: ['signatures'],
      },
    },
    {
      name: 'outlook_autocomplete',
      description: '📧 Manage autocomplete nickname cache',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['list', 'add', 'remove', 'clear', 'export', 'import'] },
          entries: { type: 'array' },
          filePath: { type: 'string' },
          outputPath: { type: 'string' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'outlook_mail_merge_advanced',
      description: '📧 Advanced mail merge with filters and conditional content',
      inputSchema: {
        type: 'object',
        properties: {
          templatePath: { type: 'string' },
          template: { type: 'object' },
          dataSource: { type: 'array' },
          filters: { type: 'array' },
          conditionalContent: { type: 'array' },
          attachments: { type: 'array' },
          sendOptions: { type: 'object' },
          smtpConfig: { type: 'object' },
          outputPath: { type: 'string' },
        },
        required: ['dataSource'],
      },
    },
  ];

  async start(): Promise<void> {
    process.stdin.setEncoding('utf-8');
    let buffer = '';

    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request: MCPRequest = JSON.parse(line);
            const response = await this.handleRequest(request);
            if (response) {
              console.log(JSON.stringify(response));
            }
          } catch (error) {
            console.error('Error processing request:', error);
          }
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });
  }

  private async handleRequest(request: MCPRequest): Promise<MCPResponse | null> {
    const { id, method, params } = request;

    if (id === undefined) {
      if (method === 'notifications/initialized') {
        return null;
      }
      return null;
    }

    try {
      switch (method) {
        case 'initialize':
          return this.initialize(id);
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: { tools: this.tools },
          };
        case 'tools/call':
          return await this.callTool(id, params);
        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
    }
  }

  private initialize(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'office-whisperer',
          version: '3.0.0',
        },
      },
    };
  }

  private async callTool(id: string | number, params: any): Promise<MCPResponse> {
    const { name, arguments: args } = params;
    let result: any;

    try {
      // Excel Tools
      if (name === 'create_excel') {
        result = await this.handleCreateExcel(args);
      } else if (name === 'excel_add_pivot_table') {
        result = await this.handleExcelAddPivotTable(args);
      } else if (name === 'excel_add_chart') {
        result = await this.handleExcelAddChart(args);
      } else if (name === 'excel_add_formula') {
        result = await this.handleExcelAddFormula(args);
      } else if (name === 'excel_conditional_formatting') {
        result = await this.handleExcelConditionalFormatting(args);
      } else if (name === 'excel_data_validation') {
        result = await this.handleExcelDataValidation(args);
      } else if (name === 'excel_freeze_panes') {
        result = await this.handleExcelFreezePanes(args);
      } else if (name === 'excel_filter_sort') {
        result = await this.handleExcelFilterSort(args);
      } else if (name === 'excel_format_cells') {
        result = await this.handleExcelFormatCells(args);
      } else if (name === 'excel_named_range') {
        result = await this.handleExcelNamedRange(args);
      } else if (name === 'excel_protect_sheet') {
        result = await this.handleExcelProtectSheet(args);
      } else if (name === 'excel_merge_workbooks') {
        result = await this.handleExcelMergeWorkbooks(args);
      } else if (name === 'excel_find_replace') {
        result = await this.handleExcelFindReplace(args);
      } else if (name === 'excel_to_json') {
        result = await this.handleExcelToJSON(args);
      } else if (name === 'excel_to_csv') {
        result = await this.handleExcelToCSV(args);
      } else if (name === 'excel_add_sparklines') {
        result = await this.handleExcelAddSparklines(args);
      } else if (name === 'excel_array_formulas') {
        result = await this.handleExcelArrayFormulas(args);
      } else if (name === 'excel_add_subtotals') {
        result = await this.handleExcelAddSubtotals(args);
      } else if (name === 'excel_add_hyperlinks') {
        result = await this.handleExcelAddHyperlinks(args);
      } else if (name === 'excel_advanced_charts') {
        result = await this.handleExcelAdvancedCharts(args);
      } else if (name === 'excel_add_slicers') {
        result = await this.handleExcelAddSlicers(args);
      } else if (name === 'excel_power_query') {
        result = await this.handleExcelPowerQuery(args);
      } else if (name === 'excel_goal_seek') {
        result = await this.handleExcelGoalSeek(args);
      } else if (name === 'excel_data_table') {
        result = await this.handleExcelDataTable(args);
      } else if (name === 'excel_scenario_manager') {
        result = await this.handleExcelScenarioManager(args);
      } else if (name === 'excel_create_table') {
        result = await this.handleExcelCreateTable(args);
      } else if (name === 'excel_table_formula') {
        result = await this.handleExcelTableFormula(args);
      } else if (name === 'excel_form_controls') {
        result = await this.handleExcelFormControls(args);
      } else if (name === 'excel_insert_images') {
        result = await this.handleExcelInsertImages(args);
      } else if (name === 'excel_insert_shapes') {
        result = await this.handleExcelInsertShapes(args);
      } else if (name === 'excel_smart_art') {
        result = await this.handleExcelSmartArt(args);
      } else if (name === 'excel_page_setup') {
        result = await this.handleExcelPageSetup(args);
      } else if (name === 'excel_header_footer') {
        result = await this.handleExcelHeaderFooter(args);
      } else if (name === 'excel_page_breaks') {
        result = await this.handleExcelPageBreaks(args);
      } else if (name === 'excel_track_changes') {
        result = await this.handleExcelTrackChanges(args);
      } else if (name === 'excel_share_workbook') {
        result = await this.handleExcelShareWorkbook(args);
      } else if (name === 'excel_compare_versions') {
        result = await this.handleExcelCompareVersions(args);
      } else if (name === 'excel_add_comments') {
        result = await this.handleExcelAddComments(args);
      }

      // Word Tools
      else if (name === 'create_word') {
        result = await this.handleCreateWord(args);
      } else if (name === 'word_add_toc') {
        result = await this.handleWordAddTOC(args);
      } else if (name === 'word_mail_merge') {
        result = await this.handleWordMailMerge(args);
      } else if (name === 'word_find_replace') {
        result = await this.handleWordFindReplace(args);
      } else if (name === 'word_add_comment') {
        result = await this.handleWordAddComment(args);
      } else if (name === 'word_format_styles') {
        result = await this.handleWordFormatStyles(args);
      } else if (name === 'word_insert_image') {
        result = await this.handleWordInsertImage(args);
      } else if (name === 'word_add_header_footer') {
        result = await this.handleWordAddHeaderFooter(args);
      } else if (name === 'word_compare_documents') {
        result = await this.handleWordCompareDocuments(args);
      } else if (name === 'word_to_pdf') {
        result = await this.handleWordToPDF(args);
      } else if (name === 'word_track_changes') {
        result = await this.handleWordTrackChanges(args);
      } else if (name === 'word_add_footnotes') {
        result = await this.handleWordAddFootnotes(args);
      } else if (name === 'word_add_bookmarks') {
        result = await this.handleWordAddBookmarks(args);
      } else if (name === 'word_add_section_breaks') {
        result = await this.handleWordAddSectionBreaks(args);
      } else if (name === 'word_add_text_boxes') {
        result = await this.handleWordAddTextBoxes(args);
      } else if (name === 'word_add_cross_references') {
        result = await this.handleWordAddCrossReferences(args);
      } else if (name === 'word_bibliography') {
        result = await this.handleWordBibliography(args);
      } else if (name === 'word_citations') {
        result = await this.handleWordCitations(args);
      } else if (name === 'word_index') {
        result = await this.handleWordIndex(args);
      } else if (name === 'word_mark_index_entry') {
        result = await this.handleWordMarkIndexEntry(args);
      } else if (name === 'word_form_fields') {
        result = await this.handleWordFormFields(args);
      } else if (name === 'word_content_controls') {
        result = await this.handleWordContentControls(args);
      } else if (name === 'word_smart_art') {
        result = await this.handleWordSmartArt(args);
      } else if (name === 'word_equations') {
        result = await this.handleWordEquations(args);
      } else if (name === 'word_symbols') {
        result = await this.handleWordSymbols(args);
      } else if (name === 'word_accessibility_check') {
        result = await this.handleWordAccessibilityCheck(args);
      } else if (name === 'word_alt_text') {
        result = await this.handleWordAltText(args);
      } else if (name === 'word_digital_signature') {
        result = await this.handleWordDigitalSignature(args);
      } else if (name === 'word_protect_document') {
        result = await this.handleWordProtectDocument(args);
      } else if (name === 'word_master_document') {
        result = await this.handleWordMasterDocument(args);
      } else if (name === 'word_document_info') {
        result = await this.handleWordDocumentInfo(args);
      } else if (name === 'word_captions') {
        result = await this.handleWordCaptions(args);
      } else if (name === 'word_advanced_hyperlinks') {
        result = await this.handleWordAdvancedHyperlinks(args);
      } else if (name === 'word_drop_cap') {
        result = await this.handleWordDropCap(args);
      } else if (name === 'word_watermark') {
        result = await this.handleWordWatermark(args);
      }

      // PowerPoint Tools
      else if (name === 'create_powerpoint') {
        result = await this.handleCreatePowerPoint(args);
      } else if (name === 'ppt_add_transition') {
        result = await this.handlePPTAddTransition(args);
      } else if (name === 'ppt_add_animation') {
        result = await this.handlePPTAddAnimation(args);
      } else if (name === 'ppt_add_notes') {
        result = await this.handlePPTAddNotes(args);
      } else if (name === 'ppt_duplicate_slide') {
        result = await this.handlePPTDuplicateSlide(args);
      } else if (name === 'ppt_reorder_slides') {
        result = await this.handlePPTReorderSlides(args);
      } else if (name === 'ppt_export_pdf') {
        result = await this.handlePPTExportPDF(args);
      } else if (name === 'ppt_add_media') {
        result = await this.handlePPTAddMedia(args);
      } else if (name === 'ppt_define_master_slide') {
        result = await this.handlePPTDefineMasterSlide(args);
      } else if (name === 'ppt_add_hyperlinks') {
        result = await this.handlePPTAddHyperlinks(args);
      } else if (name === 'ppt_add_sections') {
        result = await this.handlePPTAddSections(args);
      } else if (name === 'ppt_morph_transition') {
        result = await this.handlePPTMorphTransition(args);
      } else if (name === 'ppt_add_action_buttons') {
        result = await this.handlePPTAddActionButtons(args);
      } else if (name === 'ppt_smart_art') {
        result = await this.handlePPTSmartArt(args);
      } else if (name === 'ppt_insert_icons') {
        result = await this.handlePPTInsertIcons(args);
      } else if (name === 'ppt_3d_models') {
        result = await this.handlePPT3DModels(args);
      } else if (name === 'ppt_zoom') {
        result = await this.handlePPTZoom(args);
      } else if (name === 'ppt_recording') {
        result = await this.handlePPTRecording(args);
      } else if (name === 'ppt_live_web') {
        result = await this.handlePPTLiveWeb(args);
      } else if (name === 'ppt_designer') {
        result = await this.handlePPTDesigner(args);
      } else if (name === 'ppt_collaboration') {
        result = await this.handlePPTCollaboration(args);
      } else if (name === 'ppt_presenter_coach') {
        result = await this.handlePPTPresenterCoach(args);
      } else if (name === 'ppt_subtitles') {
        result = await this.handlePPTSubtitles(args);
      } else if (name === 'ppt_ink_annotations') {
        result = await this.handlePPTInkAnnotations(args);
      } else if (name === 'ppt_grid_guides') {
        result = await this.handlePPTGridGuides(args);
      } else if (name === 'ppt_custom_show') {
        result = await this.handlePPTCustomShow(args);
      } else if (name === 'ppt_animation_pane') {
        result = await this.handlePPTAnimationPane(args);
      } else if (name === 'ppt_slide_master_advanced') {
        result = await this.handlePPTSlideMasterAdvanced(args);
      } else if (name === 'ppt_theme') {
        result = await this.handlePPTTheme(args);
      } else if (name === 'ppt_template') {
        result = await this.handlePPTTemplate(args);
      }

      // Outlook Tools
      else if (name === 'outlook_send_email') {
        result = await this.handleOutlookSendEmail(args);
      } else if (name === 'outlook_create_meeting') {
        result = await this.handleOutlookCreateMeeting(args);
      } else if (name === 'outlook_add_contact') {
        result = await this.handleOutlookAddContact(args);
      } else if (name === 'outlook_create_task') {
        result = await this.handleOutlookCreateTask(args);
      } else if (name === 'outlook_set_rule') {
        result = await this.handleOutlookSetRule(args);
      } else if (name === 'outlook_read_emails') {
        result = await this.handleOutlookReadEmails(args);
      } else if (name === 'outlook_search_emails') {
        result = await this.handleOutlookSearchEmails(args);
      } else if (name === 'outlook_recurring_meeting') {
        result = await this.handleOutlookRecurringMeeting(args);
      } else if (name === 'outlook_save_template') {
        result = await this.handleOutlookSaveTemplate(args);
      } else if (name === 'outlook_mark_read') {
        result = await this.handleOutlookMarkRead(args);
      } else if (name === 'outlook_archive_email') {
        result = await this.handleOutlookArchiveEmail(args);
      } else if (name === 'outlook_calendar_view') {
        result = await this.handleOutlookCalendarView(args);
      } else if (name === 'outlook_search_contacts') {
        result = await this.handleOutlookSearchContacts(args);
      } else if (name === 'outlook_read_full_email') {
        result = await this.handleOutlookReadFullEmail(args);
      } else if (name === 'outlook_delete_email') {
        result = await this.handleOutlookDeleteEmail(args);
      } else if (name === 'outlook_move_email') {
        result = await this.handleOutlookMoveEmail(args);
      } else if (name === 'outlook_create_folder') {
        result = await this.handleOutlookCreateFolder(args);
      } else if (name === 'outlook_shared_mailbox') {
        result = await this.handleOutlookSharedMailbox(args);
      } else if (name === 'outlook_delegate_access') {
        result = await this.handleOutlookDelegateAccess(args);
      } else if (name === 'outlook_out_of_office') {
        result = await this.handleOutlookOutOfOffice(args);
      } else if (name === 'outlook_notes') {
        result = await this.handleOutlookNotes(args);
      } else if (name === 'outlook_journal') {
        result = await this.handleOutlookJournal(args);
      } else if (name === 'outlook_rss_feed') {
        result = await this.handleOutlookRSSFeed(args);
      } else if (name === 'outlook_data_file') {
        result = await this.handleOutlookDataFile(args);
      } else if (name === 'outlook_quick_steps') {
        result = await this.handleOutlookQuickSteps(args);
      } else if (name === 'outlook_conversation_view') {
        result = await this.handleOutlookConversationView(args);
      } else if (name === 'outlook_cleanup') {
        result = await this.handleOutlookCleanup(args);
      } else if (name === 'outlook_ignore_conversation') {
        result = await this.handleOutlookIgnoreConversation(args);
      } else if (name === 'outlook_flag_email') {
        result = await this.handleOutlookFlagEmail(args);
      } else if (name === 'outlook_categories') {
        result = await this.handleOutlookCategories(args);
      } else if (name === 'outlook_signature') {
        result = await this.handleOutlookSignature(args);
      } else if (name === 'outlook_autocomplete') {
        result = await this.handleOutlookAutocomplete(args);
      } else if (name === 'outlook_mail_merge_advanced') {
        result = await this.handleOutlookMailMergeAdvanced(args);
      }

      else {
        throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      throw error;
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      },
    };
  }

  // ========== EXCEL HANDLERS ==========
  
  private async handleCreateExcel(args: any): Promise<string> {
    const buffer = await this.excelGen.createWorkbook({
      filename: args.filename,
      sheets: args.sheets,
    });
    const outputPath = args.outputPath || process.cwd();
    const fullPath = path.join(outputPath, args.filename);
    await fs.writeFile(fullPath, buffer);
    return `✅ **Excel workbook created!**\n\n📊 **File:** ${fullPath}\n📝 **Sheets:** ${args.sheets.length}\n💾 **Size:** ${(buffer.length / 1024).toFixed(2)} KB`;
  }

  private async handleExcelAddPivotTable(args: any): Promise<string> {
    const buffer = await this.excelGen.addPivotTable(args.filename, args.sheetName, args.pivotTable);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Pivot table added!**\n\n📈 **Name:** ${args.pivotTable.name}\n📊 **File:** ${fullPath}`;
  }

  private async handleExcelAddChart(args: any): Promise<string> {
    const buffer = await this.excelGen.addChart(args.filename, args.sheetName, args.chart);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Chart added!**\n\n📉 **Type:** ${args.chart.type}\n📊 **Title:** ${args.chart.title}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelAddFormula(args: any): Promise<string> {
    const buffer = await this.excelGen.addFormulas(args.filename, args.sheetName, args.formulas);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Formulas added!**\n\n🔢 **Count:** ${args.formulas.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelConditionalFormatting(args: any): Promise<string> {
    const buffer = await this.excelGen.addConditionalFormatting(args.filename, args.sheetName, args.range, args.rules);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Conditional formatting applied!**\n\n🎨 **Range:** ${args.range}\n📊 **Rules:** ${args.rules.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelDataValidation(args: any): Promise<string> {
    const buffer = await this.excelGen.addDataValidation(args.filename, args.sheetName, args.range, args.validation);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Data validation added!**\n\n✅ **Type:** ${args.validation.type}\n📍 **Range:** ${args.range}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelFreezePanes(args: any): Promise<string> {
    const buffer = await this.excelGen.freezePanes(args.filename, args.sheetName, args.row, args.column);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Panes frozen!**\n\n❄️ **Row:** ${args.row || 0}\n❄️ **Column:** ${args.column || 0}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelFilterSort(args: any): Promise<string> {
    const buffer = await this.excelGen.filterSort(args.filename, args.sheetName, args.range, args.sortBy, args.autoFilter);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Filter/Sort applied!**\n\n🔍 **AutoFilter:** ${args.autoFilter ? 'Yes' : 'No'}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelFormatCells(args: any): Promise<string> {
    const buffer = await this.excelGen.formatCells(args.filename, args.sheetName, args.range, args.style);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Cells formatted!**\n\n✨ **Range:** ${args.range}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelNamedRange(args: any): Promise<string> {
    const buffer = await this.excelGen.addNamedRange(args.filename, args.name, args.range, args.sheetName);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Named range created!**\n\n🏷️ **Name:** ${args.name}\n📍 **Range:** ${args.range}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelProtectSheet(args: any): Promise<string> {
    const buffer = await this.excelGen.protectSheet(args.filename, args.sheetName, args.password, args.options);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Sheet protected!**\n\n🔒 **Sheet:** ${args.sheetName}\n${args.password ? '🔑 **Password:** Set' : '🔓 **Password:** None'}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelMergeWorkbooks(args: any): Promise<string> {
    const buffer = await this.excelGen.mergeWorkbooks(args.files, args.outputFilename);
    const outputPath = args.outputPath || process.cwd();
    const fullPath = path.join(outputPath, args.outputFilename);
    await fs.writeFile(fullPath, buffer);
    return `✅ **Workbooks merged!**\n\n🔗 **Source files:** ${args.files.length}\n📁 **Output:** ${fullPath}`;
  }

  private async handleExcelFindReplace(args: any): Promise<string> {
    const buffer = await this.excelGen.findReplace(
      args.filename,
      args.find,
      args.replace,
      args.sheetName,
      args.matchCase,
      args.matchEntireCell,
      args.searchFormulas
    );
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Find & Replace complete!**\n\n🔎 **Find:** "${args.find}"\n🔄 **Replace:** "${args.replace}"\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelToJSON(args: any): Promise<string> {
    const json = await this.excelGen.convertToJSON(args.excelPath, args.sheetName, args.header);
    const outputPath = args.outputPath || args.excelPath.replace(/\.xlsx?$/i, '.json');
    await fs.writeFile(outputPath, json, 'utf-8');
    return `✅ **Converted to JSON!**\n\n📊 **Source:** ${args.excelPath}\n📋 **Output:** ${outputPath}\n💾 **Size:** ${(json.length / 1024).toFixed(2)} KB`;
  }

  private async handleExcelToCSV(args: any): Promise<string> {
    const csv = await this.excelGen.convertToCSV(args.excelPath, args.sheetName);
    const outputPath = args.outputPath || args.excelPath.replace(/\.xlsx?$/i, '.csv');
    await fs.writeFile(outputPath, csv, 'utf-8');
    return `✅ **Converted to CSV!**\n\n📊 **Source:** ${args.excelPath}\n📝 **Output:** ${outputPath}\n💾 **Size:** ${(csv.length / 1024).toFixed(2)} KB`;
  }

  // ========== WORD HANDLERS ==========
  
  private async handleCreateWord(args: any): Promise<string> {
    const buffer = await this.wordGen.createDocument({
      filename: args.filename,
      sections: args.sections,
    });
    const outputPath = args.outputPath || process.cwd();
    const fullPath = path.join(outputPath, args.filename);
    await fs.writeFile(fullPath, buffer);
    return `✅ **Word document created!**\n\n📄 **File:** ${fullPath}\n📑 **Sections:** ${args.sections.length}\n💾 **Size:** ${(buffer.length / 1024).toFixed(2)} KB`;
  }

  private async handleWordAddTOC(args: any): Promise<string> {
    const buffer = await this.wordGen.addTableOfContents(args.filename, args.title, args.hyperlinks, args.levels);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Table of Contents added!**\n\n📑 **Title:** ${args.title || 'Table of Contents'}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordMailMerge(args: any): Promise<string> {
    const buffers = await this.wordGen.mailMerge(args.templatePath, args.dataSource, args.outputFilename);
    const outputPath = args.outputPath || process.cwd();
    let savedFiles = 0;
    for (let i = 0; i < buffers.length; i++) {
      const filename = args.outputFilename ? `${args.outputFilename}_${i + 1}.docx` : `merged_${i + 1}.docx`;
      const fullPath = path.join(outputPath, filename);
      await fs.writeFile(fullPath, buffers[i]);
      savedFiles++;
    }
    return `✅ **Mail merge complete!**\n\n✉️ **Documents created:** ${savedFiles}\n📁 **Output:** ${outputPath}`;
  }

  private async handleWordFindReplace(args: any): Promise<string> {
    const buffer = await this.wordGen.findReplace(
      args.filename,
      args.find,
      args.replace,
      args.matchCase,
      args.matchWholeWord,
      args.formatting
    );
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Find & Replace complete!**\n\n🔍 **Find:** "${args.find}"\n🔄 **Replace:** "${args.replace}"\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAddComment(args: any): Promise<string> {
    const buffer = await this.wordGen.addComment(args.filename, args.text, args.comment, args.author);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Comment added!**\n\n💬 **Author:** ${args.author || 'Office Whisperer'}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordFormatStyles(args: any): Promise<string> {
    const buffer = await this.wordGen.formatStyles(args.filename, args.styles);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Styles applied!**\n\n🎨 **Custom styles added**\n📁 **File:** ${fullPath}`;
  }

  private async handleWordInsertImage(args: any): Promise<string> {
    const buffer = await this.wordGen.insertImage(
      args.filename,
      args.imagePath,
      args.position,
      args.size,
      args.wrapping
    );
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Image inserted!**\n\n🖼️ **Source:** ${args.imagePath}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAddHeaderFooter(args: any): Promise<string> {
    const buffer = await this.wordGen.addHeaderFooter(
      args.filename,
      args.type,
      args.content,
      args.sectionType
    );
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **${args.type.charAt(0).toUpperCase() + args.type.slice(1)} added!**\n\n📄 **Type:** ${args.type}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordCompareDocuments(args: any): Promise<string> {
    const buffer = await this.wordGen.compareDocuments(args.originalPath, args.revisedPath, args.author);
    const outputPath = args.outputPath || path.dirname(args.originalPath);
    const fullPath = path.join(outputPath, 'comparison.docx');
    await fs.writeFile(fullPath, buffer);
    return `✅ **Documents compared!**\n\n🔄 **Original:** ${args.originalPath}\n🔄 **Revised:** ${args.revisedPath}\n📁 **Report:** ${fullPath}`;
  }

  private async handleWordToPDF(args: any): Promise<string> {
    const buffer = await this.wordGen.convertToPDF(args.filename);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const pdfPath = path.join(outputPath, path.basename(args.filename).replace(/\.docx?$/i, '.pdf'));
    await fs.writeFile(pdfPath, buffer);
    return `✅ **PDF conversion info!**\n\n📑 **Source:** ${args.filename}\n📄 **Output:** ${pdfPath}\n\nNote: Actual PDF conversion requires LibreOffice or similar tools.`;
  }

  // ========== POWERPOINT HANDLERS ==========
  
  private async handleCreatePowerPoint(args: any): Promise<string> {
    const buffer = await this.pptGen.createPresentation({
      filename: args.filename,
      title: args.title,
      theme: args.theme,
      slides: args.slides,
    });
    const outputPath = args.outputPath || process.cwd();
    const fullPath = path.join(outputPath, args.filename);
    await fs.writeFile(fullPath, buffer);
    return `✅ **PowerPoint created!**\n\n🎬 **File:** ${fullPath}\n🎨 **Theme:** ${args.theme || 'default'}\n📊 **Slides:** ${args.slides.length}\n💾 **Size:** ${(buffer.length / 1024).toFixed(2)} KB`;
  }

  private async handlePPTAddTransition(args: any): Promise<string> {
    const buffer = await this.pptGen.addTransition(args.filename, args.transition, args.slideNumber);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Transition added!**\n\n✨ **Type:** ${args.transition.type}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTAddAnimation(args: any): Promise<string> {
    const buffer = await this.pptGen.addAnimation(args.filename, args.slideNumber, args.animation, args.objectId);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Animation added!**\n\n🎭 **Effect:** ${args.animation.effect}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTAddNotes(args: any): Promise<string> {
    const buffer = await this.pptGen.addNotes(args.filename, args.slideNumber, args.notes);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Speaker notes added!**\n\n📝 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTDuplicateSlide(args: any): Promise<string> {
    const buffer = await this.pptGen.duplicateSlide(args.filename, args.slideNumber, args.position);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Slide duplicated!**\n\n📋 **Source:** Slide ${args.slideNumber}\n📍 **Position:** ${args.position || 'end'}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTReorderSlides(args: any): Promise<string> {
    const buffer = await this.pptGen.reorderSlides(args.filename, args.slideOrder);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Slides reordered!**\n\n🔀 **New order:** ${args.slideOrder.join(', ')}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTExportPDF(args: any): Promise<string> {
    const buffer = await this.pptGen.exportPDF(args.filename);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const pdfPath = path.join(outputPath, path.basename(args.filename).replace(/\.pptx?$/i, '.pdf'));
    await fs.writeFile(pdfPath, buffer);
    return `✅ **PDF export info!**\n\n📑 **Source:** ${args.filename}\n📄 **Output:** ${pdfPath}\n\nNote: Actual PDF conversion requires LibreOffice or PowerPoint.`;
  }

  private async handlePPTAddMedia(args: any): Promise<string> {
    const buffer = await this.pptGen.addMedia(
      args.filename,
      args.slideNumber,
      args.mediaPath,
      args.mediaType,
      args.position,
      args.size
    );
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Media embedded!**\n\n🎥 **Type:** ${args.mediaType}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  // ========== OUTLOOK HANDLERS ==========
  
  private async handleOutlookSendEmail(args: any): Promise<string> {
    const result = await this.outlookGen.sendEmail(args);
    return `✅ **Email processed!**\n\n${result}`;
  }

  private async handleOutlookCreateMeeting(args: any): Promise<string> {
    const ics = await this.outlookGen.createMeeting(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `meeting_${Date.now()}.ics`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, ics, 'utf-8');
    return `✅ **Meeting created!**\n\n📅 **Subject:** ${args.subject}\n⏰ **Start:** ${args.startTime}\n📁 **ICS file:** ${fullPath}\n\nImport this file into Outlook/Google Calendar.`;
  }

  private async handleOutlookAddContact(args: any): Promise<string> {
    const vcf = await this.outlookGen.addContact(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `contact_${args.lastName}_${args.firstName}.vcf`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, vcf, 'utf-8');
    return `✅ **Contact created!**\n\n👤 **Name:** ${args.firstName} ${args.lastName}\n${args.email ? `📧 **Email:** ${args.email}\n` : ''}📁 **VCF file:** ${fullPath}\n\nImport this file into Outlook/Contacts app.`;
  }

  private async handleOutlookCreateTask(args: any): Promise<string> {
    const task = await this.outlookGen.createTask(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `task_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, task, 'utf-8');
    return `✅ **Task created!**\n\n✅ **Subject:** ${args.subject}\n${args.dueDate ? `📅 **Due:** ${args.dueDate}\n` : ''}🔢 **Priority:** ${args.priority || 'normal'}\n📁 **JSON file:** ${fullPath}`;
  }

  private async handleOutlookSetRule(args: any): Promise<string> {
    const rule = await this.outlookGen.setRule(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `rule_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, rule, 'utf-8');
    return `✅ **Inbox rule created!**\n\n⚙️ **Name:** ${args.name}\n🔧 **Conditions:** ${args.conditions.length}\n🎯 **Actions:** ${args.actions.length}\n📁 **JSON file:** ${fullPath}`;
  }

  // ========== EXCEL v3.0 HANDLERS ==========

  private async handleExcelAddSparklines(args: any): Promise<string> {
    const buffer = await this.excelGen.addSparklines(args.filename, args.sheetName, args.dataRange, args.location, args.type, args.options);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Sparklines added!**\n\n✨ **Type:** ${args.type}\n📍 **Location:** ${args.location}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelArrayFormulas(args: any): Promise<string> {
    const buffer = await this.excelGen.addArrayFormulas(args.filename, args.sheetName, args.formulas);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Array formulas added!**\n\n🔢 **Count:** ${args.formulas.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelAddSubtotals(args: any): Promise<string> {
    const buffer = await this.excelGen.addSubtotals(args.filename, args.sheetName, args.range, args.groupBy, args.summaryFunction, args.summaryColumns);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Subtotals added!**\n\n📊 **Function:** ${args.summaryFunction}\n📍 **Range:** ${args.range}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelAddHyperlinks(args: any): Promise<string> {
    const buffer = await this.excelGen.addHyperlinks(args.filename, args.sheetName, args.links);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Hyperlinks added!**\n\n🔗 **Count:** ${args.links.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelAdvancedCharts(args: any): Promise<string> {
    const buffer = await this.excelGen.addAdvancedChart(args.filename, args.sheetName, args.chart);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Advanced chart added!**\n\n📈 **Type:** ${args.chart.type}\n📊 **Title:** ${args.chart.title}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelAddSlicers(args: any): Promise<string> {
    const buffer = await this.excelGen.addSlicers(args.filename, args.sheetName, args.tableName, args.slicers);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Slicers added!**\n\n🎛️ **Count:** ${args.slicers.length}\n📊 **Table:** ${args.tableName}\n📁 **File:** ${fullPath}`;
  }

  // ========== WORD v3.0 HANDLERS ==========

  private async handleWordTrackChanges(args: any): Promise<string> {
    const buffer = await this.wordGen.enableTrackChanges(args.filename, args.enable, args.author);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Track changes ${args.enable ? 'enabled' : 'disabled'}!**\n\n✏️ **Author:** ${args.author || 'Office Whisperer'}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAddFootnotes(args: any): Promise<string> {
    const buffer = await this.wordGen.addFootnotes(args.filename, args.footnotes);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Footnotes added!**\n\n📌 **Count:** ${args.footnotes.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAddBookmarks(args: any): Promise<string> {
    const buffer = await this.wordGen.addBookmarks(args.filename, args.bookmarks);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Bookmarks added!**\n\n🔖 **Count:** ${args.bookmarks.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAddSectionBreaks(args: any): Promise<string> {
    const buffer = await this.wordGen.addSectionBreaks(args.filename, args.breaks);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Section breaks added!**\n\n📄 **Count:** ${args.breaks.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAddTextBoxes(args: any): Promise<string> {
    const buffer = await this.wordGen.addTextBoxes(args.filename, args.textBoxes);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Text boxes added!**\n\n📦 **Count:** ${args.textBoxes.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAddCrossReferences(args: any): Promise<string> {
    const buffer = await this.wordGen.addCrossReferences(args.filename, args.references);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Cross-references added!**\n\n🔗 **Count:** ${args.references.length}\n📁 **File:** ${fullPath}`;
  }

  // ========== POWERPOINT v3.0 HANDLERS ==========

  private async handlePPTDefineMasterSlide(args: any): Promise<string> {
    const buffer = await this.pptGen.defineMasterSlide(args.filename, args.masterSlide);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Master slide defined!**\n\n🎨 **Name:** ${args.masterSlide.name}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTAddHyperlinks(args: any): Promise<string> {
    const buffer = await this.pptGen.addHyperlinks(args.filename, args.slideNumber, args.links);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Hyperlinks added!**\n\n🔗 **Count:** ${args.links.length}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTAddSections(args: any): Promise<string> {
    const buffer = await this.pptGen.addSections(args.filename, args.sections);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Sections added!**\n\n📁 **Count:** ${args.sections.length}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTMorphTransition(args: any): Promise<string> {
    const buffer = await this.pptGen.addMorphTransition(args.filename, args.fromSlide, args.toSlide, args.duration);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Morph transition added!**\n\n✨ **From slide:** ${args.fromSlide}\n✨ **To slide:** ${args.toSlide}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTAddActionButtons(args: any): Promise<string> {
    const buffer = await this.pptGen.addActionButtons(args.filename, args.slideNumber, args.buttons);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Action buttons added!**\n\n🔘 **Count:** ${args.buttons.length}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  // ========== OUTLOOK v3.0 HANDLERS ==========

  private async handleOutlookReadEmails(args: any): Promise<string> {
    const result = await this.outlookGen.readEmails(args);
    return `✅ **Email reading processed!**\n\n${result}`;
  }

  private async handleOutlookSearchEmails(args: any): Promise<string> {
    const result = await this.outlookGen.searchEmails(args);
    return `✅ **Email search processed!**\n\n${result}`;
  }

  private async handleOutlookRecurringMeeting(args: any): Promise<string> {
    const ics = await this.outlookGen.createRecurringMeeting(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `recurring_meeting_${Date.now()}.ics`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, ics, 'utf-8');
    return `✅ **Recurring meeting created!**\n\n📅 **Subject:** ${args.subject}\n🔄 **Frequency:** ${args.recurrence.frequency}\n📁 **ICS file:** ${fullPath}`;
  }

  private async handleOutlookSaveTemplate(args: any): Promise<string> {
    const template = await this.outlookGen.saveEmailTemplate(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `email_template_${args.name.replace(/\s+/g, '_')}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, template, 'utf-8');
    return `✅ **Email template saved!**\n\n📧 **Name:** ${args.name}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookMarkRead(args: any): Promise<string> {
    const result = await this.outlookGen.markAsRead(args);
    return `✅ **Mark read/unread processed!**\n\n${result}`;
  }

  private async handleOutlookArchiveEmail(args: any): Promise<string> {
    const result = await this.outlookGen.archiveEmail(args);
    return `✅ **Archive processed!**\n\n${result}`;
  }

  private async handleOutlookCalendarView(args: any): Promise<string> {
    const result = await this.outlookGen.getCalendarView(args);
    const outputPath = args.outputPath || process.cwd();
    const ext = args.outputFormat === 'json' ? 'json' : 'ics';
    const filename = `calendar_view_${Date.now()}.${ext}`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Calendar view created!**\n\n📅 **View:** ${args.viewType}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookSearchContacts(args: any): Promise<string> {
    const result = await this.outlookGen.searchContacts(args);
    const outputPath = args.outputPath || process.cwd();
    const ext = args.outputFormat === 'json' ? 'json' : 'vcf';
    const filename = `contacts_search_${Date.now()}.${ext}`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Contact search completed!**\n\n🔍 **Query:** ${args.query}\n📁 **File:** ${fullPath}`;
  }

  // ========== EXCEL v4.0 HANDLERS ==========

  private async handleExcelPowerQuery(args: any): Promise<string> {
    const buffer = await this.excelGen.addPowerQuery(args.filename, args.sheetName, args.queryName, args.source, args.transformations);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Power Query added!**\n\n📊 **Query:** ${args.queryName}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelGoalSeek(args: any): Promise<string> {
    const buffer = await this.excelGen.goalSeek(args.filename, args.sheetName, args.setCell, args.toValue, args.byChangingCell);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Goal Seek configured!**\n\n🎯 **Target:** ${args.toValue}\n📍 **Cell:** ${args.setCell}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelDataTable(args: any): Promise<string> {
    const buffer = await this.excelGen.createDataTable(args.filename, args.sheetName, args.type, args.formulaCell, args.rowInputCell, args.columnInputCell);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Data table created!**\n\n📊 **Type:** ${args.type}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelScenarioManager(args: any): Promise<string> {
    const buffer = await this.excelGen.manageScenarios(args.filename, args.sheetName, args.scenarios, args.resultCells);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Scenarios created!**\n\n📈 **Count:** ${args.scenarios.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelCreateTable(args: any): Promise<string> {
    const buffer = await this.excelGen.createTable(args.filename, args.sheetName, args.tableName, args.range, args.hasHeaders, args.style, args.showTotalRow);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Table created!**\n\n📊 **Name:** ${args.tableName}\n📍 **Range:** ${args.range}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelTableFormula(args: any): Promise<string> {
    const buffer = await this.excelGen.addTableFormula(args.filename, args.sheetName, args.tableName, args.columnName, args.formula);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Table formula added!**\n\n📊 **Table:** ${args.tableName}\n📍 **Column:** ${args.columnName}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelFormControls(args: any): Promise<string> {
    const buffer = await this.excelGen.addFormControls(args.filename, args.sheetName, args.controls);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Form controls added!**\n\n📊 **Count:** ${args.controls.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelInsertImages(args: any): Promise<string> {
    const buffer = await this.excelGen.insertImages(args.filename, args.sheetName, args.images);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Images inserted!**\n\n📊 **Count:** ${args.images.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelInsertShapes(args: any): Promise<string> {
    const buffer = await this.excelGen.insertShapes(args.filename, args.sheetName, args.shapes);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Shapes inserted!**\n\n📊 **Count:** ${args.shapes.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelSmartArt(args: any): Promise<string> {
    const buffer = await this.excelGen.addSmartArt(args.filename, args.sheetName, args.smartArt);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **SmartArt added!**\n\n📊 **Type:** ${args.smartArt.type}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelPageSetup(args: any): Promise<string> {
    const buffer = await this.excelGen.configurePageSetup(args.filename, args.sheetName, args.pageSetup);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Page setup configured!**\n\n📊 **Sheet:** ${args.sheetName}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelHeaderFooter(args: any): Promise<string> {
    const buffer = await this.excelGen.setHeaderFooter(args.filename, args.sheetName, args.header, args.footer, args.differentFirstPage, args.differentOddEven);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Headers/footers configured!**\n\n📊 **Sheet:** ${args.sheetName}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelPageBreaks(args: any): Promise<string> {
    const buffer = await this.excelGen.addPageBreaks(args.filename, args.sheetName, args.horizontalBreaks, args.verticalBreaks);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Page breaks configured!**\n\n📊 **Horizontal:** ${args.horizontalBreaks?.length || 0}\n📊 **Vertical:** ${args.verticalBreaks?.length || 0}\n📁 **File:** ${fullPath}`;
  }

  private async handleExcelTrackChanges(args: any): Promise<string> {
    const buffer = await this.excelGen.enableTrackChanges(args.filename, args.enable, args.highlightChanges);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Track changes ${args.enable ? 'enabled' : 'disabled'}!**\n\n📊 **File:** ${fullPath}`;
  }

  private async handleExcelShareWorkbook(args: any): Promise<string> {
    const buffer = await this.excelGen.shareWorkbook(args.filename, args.share, args.allowChanges, args.password);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Workbook sharing ${args.share ? 'enabled' : 'disabled'}!**\n\n📊 **File:** ${fullPath}`;
  }

  private async handleExcelCompareVersions(args: any): Promise<string> {
    // TODO: compareVersions method not yet implemented in ExcelGenerator
    // const buffer = await this.excelGen.compareVersions(args.originalFile, args.revisedFile, args.highlightDifferences);
    // const outputPath = args.outputPath || path.dirname(args.originalFile);
    // const fullPath = path.join(outputPath, 'comparison.xlsx');
    // await fs.writeFile(fullPath, buffer);
    return `⚠️ **Compare versions feature not yet implemented.**\n\nPlease check back in a future version of Office Whisperer.`;
  }

  private async handleExcelAddComments(args: any): Promise<string> {
    const buffer = await this.excelGen.addComments(args.filename, args.sheetName, args.comments);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Comments added!**\n\n📊 **Count:** ${args.comments.length}\n📁 **File:** ${fullPath}`;
  }

  // ========== WORD v4.0 HANDLERS ==========

  private async handleWordBibliography(args: any): Promise<string> {
    const buffer = await this.wordGen.addBibliography(args.filename, args.sources, args.style, args.insertAt);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Bibliography created!**\n\n📄 **Style:** ${args.style || 'APA'}\n📄 **Sources:** ${args.sources.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordCitations(args: any): Promise<string> {
    const buffer = await this.wordGen.insertCitations(args.filename, args.citations);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Citations added!**\n\n📄 **Count:** ${args.citations.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordIndex(args: any): Promise<string> {
    const buffer = await this.wordGen.createIndex(args.filename, args.entries, args.title, args.columns, args.insertAt);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Index generated!**\n\n📄 **Entries:** ${args.entries.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordMarkIndexEntry(args: any): Promise<string> {
    const buffer = await this.wordGen.markIndexEntry(args.filename, args.textToMark, args.entryText, args.crossReference);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Index entry marked!**\n\n📄 **Text:** ${args.textToMark}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordFormFields(args: any): Promise<string> {
    const buffer = await this.wordGen.addFormFields(args.filename, args.fields, args.protectForm);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Form fields added!**\n\n📄 **Count:** ${args.fields.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordContentControls(args: any): Promise<string> {
    const buffer = await this.wordGen.addContentControls(args.filename, args.controls);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Content controls added!**\n\n📄 **Count:** ${args.controls.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordSmartArt(args: any): Promise<string> {
    const buffer = await this.wordGen.insertSmartArt(args.filename, args.smartArt, args.position);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **SmartArt inserted!**\n\n📄 **Type:** ${args.smartArt.type}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordEquations(args: any): Promise<string> {
    const buffer = await this.wordGen.addEquations(args.filename, args.equations);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Equations inserted!**\n\n📄 **Count:** ${args.equations.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordSymbols(args: any): Promise<string> {
    const buffer = await this.wordGen.insertSymbols(args.filename, args.symbols);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Symbols inserted!**\n\n📄 **Count:** ${args.symbols.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAccessibilityCheck(args: any): Promise<string> {
    const buffer = await this.wordGen.checkAccessibility(args.filename, args.checks, args.autoFix);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Accessibility check complete!**\n\n📄 **Auto-fix:** ${args.autoFix ? 'Yes' : 'No'}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAltText(args: any): Promise<string> {
    const buffer = await this.wordGen.setAltText(args.filename, args.altTexts);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Alt text added!**\n\n📄 **Count:** ${args.altTexts.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordDigitalSignature(args: any): Promise<string> {
    const buffer = await this.wordGen.addDigitalSignature(args.filename, args.action, args.certificatePath, args.password, args.reason);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Digital signature ${args.action}!**\n\n📄 **Action:** ${args.action}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordProtectDocument(args: any): Promise<string> {
    const buffer = await this.wordGen.protectDocument(args.filename, args.protection);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Document protected!**\n\n📄 **Type:** ${args.protection.type}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordMasterDocument(args: any): Promise<string> {
    const buffer = await this.wordGen.createMasterDocument(args.filename, args.subdocuments, args.generateTOC);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Master document created!**\n\n📄 **Subdocuments:** ${args.subdocuments.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordDocumentInfo(args: any): Promise<string> {
    const buffer = await this.wordGen.setDocumentInfo(args.filename, args.info);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Document metadata updated!**\n\n📄 **File:** ${fullPath}`;
  }

  private async handleWordCaptions(args: any): Promise<string> {
    const buffer = await this.wordGen.addCaptions(args.filename, args.captions);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Captions added!**\n\n📄 **Count:** ${args.captions.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordAdvancedHyperlinks(args: any): Promise<string> {
    const buffer = await this.wordGen.addAdvancedHyperlinks(args.filename, args.hyperlinks);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Hyperlinks added!**\n\n📄 **Count:** ${args.hyperlinks.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordDropCap(args: any): Promise<string> {
    const buffer = await this.wordGen.addDropCap(args.filename, args.paragraphIndex, args.style, args.lines);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Drop cap added!**\n\n📄 **Style:** ${args.style}\n📁 **File:** ${fullPath}`;
  }

  private async handleWordWatermark(args: any): Promise<string> {
    const buffer = await this.wordGen.addWatermark(args.filename, args.watermark);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Watermark added!**\n\n📄 **Type:** ${args.watermark.type}\n📁 **File:** ${fullPath}`;
  }

  // ========== POWERPOINT v4.0 HANDLERS ==========

  private async handlePPTSmartArt(args: any): Promise<string> {
    const buffer = await this.pptGen.addSmartArt(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **SmartArt added!**\n\n🎯 **Type:** ${args.smartArt.type}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTInsertIcons(args: any): Promise<string> {
    const buffer = await this.pptGen.insertIcons(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Icons inserted!**\n\n🎯 **Count:** ${args.icons.length}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPT3DModels(args: any): Promise<string> {
    const buffer = await this.pptGen.insert3DModels(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **3D models inserted!**\n\n🎯 **Count:** ${args.models.length}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTZoom(args: any): Promise<string> {
    const buffer = await this.pptGen.addZoom(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Zoom added!**\n\n🎯 **Count:** ${args.zooms.length}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTRecording(args: any): Promise<string> {
    const buffer = await this.pptGen.configureRecording(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Recording configured!**\n\n🎯 **Type:** ${args.recording.type}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTLiveWeb(args: any): Promise<string> {
    const buffer = await this.pptGen.embedLiveWeb(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Live web page embedded!**\n\n🎯 **Count:** ${args.webPages.length}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTDesigner(args: any): Promise<string> {
    const buffer = await this.pptGen.applyDesigner(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Designer configured!**\n\n🎯 **File:** ${fullPath}`;
  }

  private async handlePPTCollaboration(args: any): Promise<string> {
    const buffer = await this.pptGen.addCollaborationComments(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Comments added!**\n\n🎯 **Count:** ${args.comments.length}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTPresenterCoach(args: any): Promise<string> {
    const buffer = await this.pptGen.configurePresenterCoach(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Presenter Coach configured!**\n\n🎯 **File:** ${fullPath}`;
  }

  private async handlePPTSubtitles(args: any): Promise<string> {
    const buffer = await this.pptGen.configureSubtitles(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Subtitles configured!**\n\n🎯 **Language:** ${args.subtitles.language || 'auto'}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTInkAnnotations(args: any): Promise<string> {
    const buffer = await this.pptGen.addInkAnnotations(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Ink annotations added!**\n\n🎯 **Count:** ${args.annotations.length}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTGridGuides(args: any): Promise<string> {
    const buffer = await this.pptGen.configureGridGuides(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Grid/guides configured!**\n\n🎯 **File:** ${fullPath}`;
  }

  private async handlePPTCustomShow(args: any): Promise<string> {
    const buffer = await this.pptGen.createCustomShow(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Custom shows created!**\n\n🎯 **Count:** ${args.shows.length}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTAnimationPane(args: any): Promise<string> {
    const buffer = await this.pptGen.manageAnimationPane(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Animations configured!**\n\n🎯 **Count:** ${args.animations.length}\n📊 **Slide:** ${args.slideNumber}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTSlideMasterAdvanced(args: any): Promise<string> {
    const buffer = await this.pptGen.customizeSlideMaster(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Slide master customized!**\n\n🎯 **File:** ${fullPath}`;
  }

  private async handlePPTTheme(args: any): Promise<string> {
    const buffer = await this.pptGen.applyPresentationTheme(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Theme applied!**\n\n🎯 **Name:** ${args.theme.name || 'Custom'}\n📁 **File:** ${fullPath}`;
  }

  private async handlePPTTemplate(args: any): Promise<string> {
    const buffer = await this.pptGen.saveAsTemplate(args);
    const outputPath = args.outputPath || path.dirname(args.filename);
    const fullPath = path.join(outputPath, path.basename(args.filename).replace(/\.pptx$/i, '.potx'));
    await fs.writeFile(fullPath, buffer);
    return `✅ **Template saved!**\n\n🎯 **Title:** ${args.template.title}\n📁 **File:** ${fullPath}`;
  }

  // ========== OUTLOOK v4.0 HANDLERS ==========

  private async handleOutlookReadFullEmail(args: any): Promise<string> {
    const result = await this.outlookGen.readFullEmail(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `email_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Full email read!**\n\n📧 **Messages:** ${args.messageIds.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookDeleteEmail(args: any): Promise<string> {
    const result = await this.outlookGen.deleteEmail(args);
    return `✅ **Emails deleted!**\n\n📧 ${result}`;
  }

  private async handleOutlookMoveEmail(args: any): Promise<string> {
    const result = await this.outlookGen.moveEmail(args);
    return `✅ **Emails moved!**\n\n📧 **To:** ${args.toFolder}\n📧 ${result}`;
  }

  private async handleOutlookCreateFolder(args: any): Promise<string> {
    const result = await this.outlookGen.createFolder(args);
    return `✅ **Folder created!**\n\n📧 **Path:** ${args.folderPath}\n📧 ${result}`;
  }

  private async handleOutlookSharedMailbox(args: any): Promise<string> {
    const result = await this.outlookGen.accessSharedMailbox(args);
    const outputPath = args.outputPath || process.cwd();
    if (args.outputPath && typeof result === 'string') {
      const filename = `shared_mailbox_${Date.now()}.json`;
      const fullPath = path.join(outputPath, filename);
      await fs.writeFile(fullPath, result, 'utf-8');
      return `✅ **Shared mailbox operation complete!**\n\n📧 **Mailbox:** ${args.sharedMailbox}\n📧 **Operation:** ${args.operation}\n📁 **File:** ${fullPath}`;
    }
    return `✅ **Shared mailbox operation complete!**\n\n📧 **Mailbox:** ${args.sharedMailbox}\n📧 **Operation:** ${args.operation}`;
  }

  private async handleOutlookDelegateAccess(args: any): Promise<string> {
    const result = await this.outlookGen.grantDelegateAccess(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `delegate_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Delegate access granted!**\n\n📧 **Delegate:** ${args.delegateEmail}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookOutOfOffice(args: any): Promise<string> {
    const result = await this.outlookGen.setOutOfOffice(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `out_of_office_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Out of office ${args.enable ? 'enabled' : 'disabled'}!**\n\n📧 **File:** ${fullPath}`;
  }

  private async handleOutlookNotes(args: any): Promise<string> {
    const result = await this.outlookGen.createNotes(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `notes_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Notes created!**\n\n📧 **Count:** ${args.notes.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookJournal(args: any): Promise<string> {
    const result = await this.outlookGen.createJournalEntry(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `journal_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Journal entries created!**\n\n📧 **Count:** ${args.entries.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookRSSFeed(args: any): Promise<string> {
    const result = await this.outlookGen.manageRSSFeed(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `rss_feeds_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **RSS feed operation complete!**\n\n📧 **Operation:** ${args.operation}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookDataFile(args: any): Promise<string> {
    const result = await this.outlookGen.manageDataFile(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `data_file_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Data file operation complete!**\n\n📧 **Operation:** ${args.operation}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookQuickSteps(args: any): Promise<string> {
    const result = await this.outlookGen.createQuickStep(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `quick_steps_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Quick Steps created!**\n\n📧 **Count:** ${args.steps.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookConversationView(args: any): Promise<string> {
    const result = await this.outlookGen.configureConversationView(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `conversation_view_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Conversation view ${args.enable ? 'enabled' : 'disabled'}!**\n\n📧 **File:** ${fullPath}`;
  }

  private async handleOutlookCleanup(args: any): Promise<string> {
    const result = await this.outlookGen.cleanupMessages(args);
    return `✅ **Cleanup complete!**\n\n📧 **Scope:** ${args.scope}\n📧 ${result}`;
  }

  private async handleOutlookIgnoreConversation(args: any): Promise<string> {
    const result = await this.outlookGen.ignoreConversation(args);
    return `✅ **Conversation ${args.restore ? 'restored' : 'ignored'}!**\n\n📧 ${result}`;
  }

  private async handleOutlookFlagEmail(args: any): Promise<string> {
    const result = await this.outlookGen.flagEmail(args);
    return `✅ **Emails flagged!**\n\n📧 **Type:** ${args.flag.type}\n📧 ${result}`;
  }

  private async handleOutlookCategories(args: any): Promise<string> {
    const result = await this.outlookGen.manageCategories(args);
    const outputPath = args.outputPath || process.cwd();
    if (args.outputPath && typeof result === 'string') {
      const filename = `categories_${Date.now()}.json`;
      const fullPath = path.join(outputPath, filename);
      await fs.writeFile(fullPath, result, 'utf-8');
      return `✅ **Category operation complete!**\n\n📧 **Operation:** ${args.operation}\n📁 **File:** ${fullPath}`;
    }
    return `✅ **Category operation complete!**\n\n📧 **Operation:** ${args.operation}`;
  }

  private async handleOutlookSignature(args: any): Promise<string> {
    const result = await this.outlookGen.createSignature(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `signatures_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Signatures created!**\n\n📧 **Count:** ${args.signatures.length}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookAutocomplete(args: any): Promise<string> {
    const result = await this.outlookGen.manageAutoComplete(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `autocomplete_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Autocomplete operation complete!**\n\n📧 **Operation:** ${args.operation}\n📁 **File:** ${fullPath}`;
  }

  private async handleOutlookMailMergeAdvanced(args: any): Promise<string> {
    const result = await this.outlookGen.advancedMailMerge(args);
    const outputPath = args.outputPath || process.cwd();
    const filename = `mail_merge_${Date.now()}.json`;
    const fullPath = path.join(outputPath, filename);
    await fs.writeFile(fullPath, result, 'utf-8');
    return `✅ **Mail merge complete!**\n\n📧 **Recipients:** ${args.dataSource.length}\n📁 **File:** ${fullPath}`;
  }
}

// Start the server
const server = new OfficeWhispererServer();
server.start().catch(console.error);
