/**
 * Mock API Server
 */

import express, { Express, Request, Response } from 'express';
import type { MockServer, MockRoute, MockServerConfig, OperationResult } from './types.js';
import { Server } from 'http';

export class MockAPIServer {
  private servers: Map<string, { server: MockServer; app: Express; httpServer: Server | null }> =
    new Map();

  /**
   * Create a new mock server
   */
  async createServer(config: MockServerConfig = {}): Promise<OperationResult> {
    const id = `mock-${Date.now()}`;
    const port = config.port || 3000;
    const baseUrl = config.baseUrl || `http://localhost:${port}`;
    const name = config.name || `Mock Server ${port}`;

    const mockServer: MockServer = {
      id,
      name,
      port,
      baseUrl,
      routes: [],
      running: false,
    };

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    this.servers.set(id, { server: mockServer, app, httpServer: null });

    return {
      success: true,
      message: 'Mock server created',
      data: { id, name, baseUrl },
    };
  }

  /**
   * Add a route to a mock server
   */
  async addRoute(
    serverId: string,
    route: Omit<MockRoute, 'id' | 'enabled'>
  ): Promise<OperationResult> {
    const serverData = this.servers.get(serverId);
    if (!serverData) {
      return {
        success: false,
        message: 'Mock server not found',
        error: `Server ${serverId} does not exist`,
      };
    }

    const routeId = `route-${Date.now()}`;
    const fullRoute: MockRoute = {
      id: routeId,
      ...route,
      enabled: true,
    };

    serverData.server.routes.push(fullRoute);

    // Register the route with Express
    const method = route.method.toLowerCase() as keyof Express;
    serverData.app[method](route.path, (_req: Request, res: Response) => {
      if (!fullRoute.enabled) {
        res.status(404).json({ error: 'Route disabled' });
        return;
      }

      if (route.response.delay) {
        setTimeout(() => {
          this.sendResponse(res, fullRoute);
        }, route.response.delay);
      } else {
        this.sendResponse(res, fullRoute);
      }
    });

    return {
      success: true,
      message: 'Route added to mock server',
      data: { routeId, path: route.path, method: route.method },
    };
  }

  private sendResponse(res: Response, route: MockRoute): void {
    const { status, headers, body } = route.response;

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    res.status(status).json(body);
  }

  /**
   * Start a mock server
   */
  async startServer(serverId: string): Promise<OperationResult> {
    const serverData = this.servers.get(serverId);
    if (!serverData) {
      return {
        success: false,
        message: 'Mock server not found',
        error: `Server ${serverId} does not exist`,
      };
    }

    if (serverData.server.running) {
      return {
        success: false,
        message: 'Server already running',
      };
    }

    return new Promise((resolve) => {
      const httpServer = serverData.app.listen(serverData.server.port, () => {
        serverData.server.running = true;
        serverData.httpServer = httpServer;

        resolve({
          success: true,
          message: `Mock server started`,
          data: {
            baseUrl: serverData.server.baseUrl,
            port: serverData.server.port,
            routes: serverData.server.routes.length,
          },
        });
      });
    });
  }

  /**
   * Stop a mock server
   */
  async stopServer(serverId: string): Promise<OperationResult> {
    const serverData = this.servers.get(serverId);
    if (!serverData) {
      return {
        success: false,
        message: 'Mock server not found',
        error: `Server ${serverId} does not exist`,
      };
    }

    if (!serverData.server.running || !serverData.httpServer) {
      return {
        success: false,
        message: 'Server not running',
      };
    }

    return new Promise((resolve) => {
      serverData.httpServer!.close(() => {
        serverData.server.running = false;
        serverData.httpServer = null;

        resolve({
          success: true,
          message: 'Mock server stopped',
        });
      });
    });
  }

  /**
   * List all mock servers
   */
  listServers(): MockServer[] {
    return Array.from(this.servers.values()).map((data) => data.server);
  }

  /**
   * Get a specific mock server
   */
  getServer(serverId: string): MockServer | null {
    const serverData = this.servers.get(serverId);
    return serverData ? serverData.server : null;
  }

  /**
   * Delete a mock server
   */
  async deleteServer(serverId: string): Promise<OperationResult> {
    const serverData = this.servers.get(serverId);
    if (!serverData) {
      return {
        success: false,
        message: 'Mock server not found',
        error: `Server ${serverId} does not exist`,
      };
    }

    if (serverData.server.running) {
      await this.stopServer(serverId);
    }

    this.servers.delete(serverId);

    return {
      success: true,
      message: 'Mock server deleted',
    };
  }
}
