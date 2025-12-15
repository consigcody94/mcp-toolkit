/**
 * Universal data format converter
 */

import Papa from 'papaparse';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import YAML from 'yaml';
import type { DataSet, DataFormat, FormatOptions, DataRow } from './types.js';

export class DataConverter {
  /**
   * Detect format from content
   */
  detectFormat(content: string): DataFormat {
    const trimmed = content.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not JSON
      }
    }

    if (trimmed.startsWith('<') && (trimmed.includes('<?xml') || trimmed.includes('</'))) {
      return 'xml';
    }

    if (trimmed.match(/^[\w-]+:\s/m) || trimmed.match(/^-\s/m)) {
      return 'yaml';
    }

    if (trimmed.includes('\t') && trimmed.split('\n').length > 1) {
      return 'tsv';
    }

    if (trimmed.split('\n').length > 1) {
      return 'csv';
    }

    return 'csv'; // Default
  }

  /**
   * Parse data from string
   */
  parse(content: string, format: DataFormat, options: FormatOptions = {}): DataSet {
    switch (format) {
      case 'csv':
        return this.parseCSV(content, options);
      case 'tsv':
        return this.parseCSV(content, { ...options, delimiter: '\t' });
      case 'json':
        return this.parseJSON(content);
      case 'xml':
        return this.parseXML(content, options);
      case 'yaml':
        return this.parseYAML(content);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert data to string
   */
  stringify(dataset: DataSet, format: DataFormat, options: FormatOptions = {}): string {
    switch (format) {
      case 'csv':
        return this.stringifyCSV(dataset, options);
      case 'tsv':
        return this.stringifyCSV(dataset, { ...options, delimiter: '\t' });
      case 'json':
        return this.stringifyJSON(dataset, options);
      case 'xml':
        return this.stringifyXML(dataset, options);
      case 'yaml':
        return this.stringifyYAML(dataset);
      case 'sql':
        return this.stringifySQL(dataset, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Parse CSV
   */
  private parseCSV(content: string, options: FormatOptions = {}): DataSet {
    const result = Papa.parse(content, {
      header: options.header !== false,
      delimiter: options.delimiter || ',',
      skipEmptyLines: options.skipEmptyLines !== false,
      dynamicTyping: true,
    });

    const rows = result.data as DataRow[];
    const headers = result.meta.fields || Object.keys(rows[0] || {});

    return {
      headers,
      rows,
      metadata: {
        format: 'csv',
        rowCount: rows.length,
        columnCount: headers.length,
        delimiter: options.delimiter || ',',
      },
    };
  }

  /**
   * Parse JSON
   */
  private parseJSON(content: string): DataSet {
    const data = JSON.parse(content);
    const rows = Array.isArray(data) ? data : [data];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      headers,
      rows,
      metadata: {
        format: 'json',
        rowCount: rows.length,
        columnCount: headers.length,
      },
    };
  }

  /**
   * Parse XML
   */
  private parseXML(content: string, options: FormatOptions = {}): DataSet {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: options.attributePrefix || '@_',
      textNodeName: options.textNodeName || '#text',
    });

    const parsed = parser.parse(content);
    const root = Object.values(parsed)[0];
    const rows = Array.isArray(root) ? root : [root];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      headers,
      rows,
      metadata: {
        format: 'xml',
        rowCount: rows.length,
        columnCount: headers.length,
      },
    };
  }

  /**
   * Parse YAML
   */
  private parseYAML(content: string): DataSet {
    const data = YAML.parse(content);
    const rows = Array.isArray(data) ? data : [data];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      headers,
      rows,
      metadata: {
        format: 'yaml',
        rowCount: rows.length,
        columnCount: headers.length,
      },
    };
  }

  /**
   * Stringify CSV
   */
  private stringifyCSV(dataset: DataSet, options: FormatOptions = {}): string {
    return Papa.unparse(dataset.rows, {
      delimiter: options.delimiter || ',',
      header: options.header !== false,
      quotes: options.quoteChar === '"',
    });
  }

  /**
   * Stringify JSON
   */
  private stringifyJSON(dataset: DataSet, options: FormatOptions = {}): string {
    const indent = options.pretty ? (options.indent || 2) : undefined;
    return JSON.stringify(dataset.rows, null, indent);
  }

  /**
   * Stringify XML
   */
  private stringifyXML(dataset: DataSet, options: FormatOptions = {}): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: options.attributePrefix || '@_',
      textNodeName: options.textNodeName || '#text',
      format: options.pretty,
    });

    const root = {
      [options.rootElement || 'data']: {
        [options.rowElement || 'row']: dataset.rows,
      },
    };

    return builder.build(root);
  }

  /**
   * Stringify YAML
   */
  private stringifyYAML(dataset: DataSet): string {
    return YAML.stringify(dataset.rows);
  }

  /**
   * Stringify SQL
   */
  private stringifySQL(dataset: DataSet, options: FormatOptions = {}): string {
    const tableName = options.tableName || 'data';
    const batchSize = options.batchSize || 1000;
    const statements: string[] = [];

    for (let i = 0; i < dataset.rows.length; i += batchSize) {
      const batch = dataset.rows.slice(i, i + batchSize);
      const values = batch
        .map(row => {
          const vals = dataset.headers.map(h => {
            const v = row[h];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === 'boolean') return v ? '1' : '0';
            return String(v);
          });
          return `(${vals.join(', ')})`;
        })
        .join(',\n  ');

      statements.push(
        `INSERT INTO ${tableName} (${dataset.headers.join(', ')})\nVALUES\n  ${values};`
      );
    }

    return statements.join('\n\n');
  }

  /**
   * Transform between formats
   */
  transform(
    content: string,
    sourceFormat: DataFormat,
    targetFormat: DataFormat,
    options: FormatOptions = {}
  ): string {
    const dataset = this.parse(content, sourceFormat, options);
    return this.stringify(dataset, targetFormat, options);
  }
}
