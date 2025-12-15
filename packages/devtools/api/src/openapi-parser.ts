/**
 * OpenAPI/Swagger Parser
 */

import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPISpec, OpenAPIPath, OperationResult } from './types.js';

export class OpenAPIParser {
  private specs: Map<string, OpenAPISpec> = new Map();

  /**
   * Parse an OpenAPI specification from URL or file
   */
  async parseSpec(source: string): Promise<OperationResult> {
    try {
      const api = (await SwaggerParser.validate(source)) as OpenAPISpec;
      const id = `spec-${Date.now()}`;

      this.specs.set(id, api);

      return {
        success: true,
        message: 'OpenAPI spec parsed successfully',
        data: {
          id,
          title: api.info.title,
          version: api.info.version,
          endpoints: Object.keys(api.paths).length,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to parse OpenAPI spec',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get information about a parsed spec
   */
  getSpecInfo(specId: string): OperationResult {
    const spec = this.specs.get(specId);
    if (!spec) {
      return {
        success: false,
        message: 'Spec not found',
        error: `Spec ${specId} does not exist`,
      };
    }

    return {
      success: true,
      message: 'Spec information retrieved',
      data: {
        title: spec.info.title,
        version: spec.info.version,
        description: spec.info.description,
        servers: spec.servers?.map((s) => s.url) || [],
        endpoints: Object.keys(spec.paths).length,
      },
    };
  }

  /**
   * List all endpoints in a spec
   */
  listEndpoints(specId: string): OperationResult {
    const spec = this.specs.get(specId);
    if (!spec) {
      return {
        success: false,
        message: 'Spec not found',
        error: `Spec ${specId} does not exist`,
      };
    }

    const endpoints: OpenAPIPath[] = [];

    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods as Record<string, unknown>).forEach(([method, operation]) => {
        if (typeof operation === 'object' && operation !== null) {
          const op = operation as {
            operationId?: string;
            summary?: string;
            description?: string;
            parameters?: unknown[];
            requestBody?: unknown;
            responses?: unknown;
          };

          endpoints.push({
            path,
            method: method.toUpperCase(),
            operationId: op.operationId,
            summary: op.summary,
            description: op.description,
            parameters: op.parameters as OpenAPIPath['parameters'],
            requestBody: op.requestBody as OpenAPIPath['requestBody'],
            responses: op.responses as OpenAPIPath['responses'],
          });
        }
      });
    });

    return {
      success: true,
      message: 'Endpoints listed',
      data: {
        total: endpoints.length,
        endpoints: endpoints.map((e) => ({
          method: e.method,
          path: e.path,
          summary: e.summary,
          operationId: e.operationId,
        })),
      },
    };
  }

  /**
   * Get details about a specific endpoint
   */
  getEndpointDetails(specId: string, method: string, path: string): OperationResult {
    const spec = this.specs.get(specId);
    if (!spec) {
      return {
        success: false,
        message: 'Spec not found',
        error: `Spec ${specId} does not exist`,
      };
    }

    const pathItem = spec.paths[path];
    if (!pathItem) {
      return {
        success: false,
        message: 'Path not found',
        error: `Path ${path} does not exist in spec`,
      };
    }

    const operation = (pathItem as Record<string, unknown>)[method.toLowerCase()];
    if (!operation) {
      return {
        success: false,
        message: 'Method not found',
        error: `Method ${method} not found for path ${path}`,
      };
    }

    return {
      success: true,
      message: 'Endpoint details retrieved',
      data: operation,
    };
  }

  /**
   * Get all schemas from the spec
   */
  getSchemas(specId: string): OperationResult {
    const spec = this.specs.get(specId);
    if (!spec) {
      return {
        success: false,
        message: 'Spec not found',
        error: `Spec ${specId} does not exist`,
      };
    }

    const schemas = spec.components?.schemas || {};

    return {
      success: true,
      message: 'Schemas retrieved',
      data: {
        total: Object.keys(schemas).length,
        schemas: Object.keys(schemas),
      },
    };
  }

  /**
   * Get a specific schema
   */
  getSchema(specId: string, schemaName: string): OperationResult {
    const spec = this.specs.get(specId);
    if (!spec) {
      return {
        success: false,
        message: 'Spec not found',
        error: `Spec ${specId} does not exist`,
      };
    }

    const schema = spec.components?.schemas?.[schemaName];
    if (!schema) {
      return {
        success: false,
        message: 'Schema not found',
        error: `Schema ${schemaName} does not exist in spec`,
      };
    }

    return {
      success: true,
      message: 'Schema retrieved',
      data: schema,
    };
  }

  /**
   * List all parsed specs
   */
  listSpecs(): OperationResult {
    const specs = Array.from(this.specs.entries()).map(([id, spec]) => ({
      id,
      title: spec.info.title,
      version: spec.info.version,
      endpoints: Object.keys(spec.paths).length,
    }));

    return {
      success: true,
      message: 'Specs listed',
      data: specs,
    };
  }

  /**
   * Delete a parsed spec
   */
  deleteSpec(specId: string): OperationResult {
    const spec = this.specs.get(specId);
    if (!spec) {
      return {
        success: false,
        message: 'Spec not found',
        error: `Spec ${specId} does not exist`,
      };
    }

    this.specs.delete(specId);

    return {
      success: true,
      message: 'Spec deleted',
    };
  }
}
