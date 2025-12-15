export interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: { code: number; message: string };
}

export interface TypeGenerationRequest {
  data: any;
  name?: string;
  strict?: boolean;
}

export interface TypeFixSuggestion {
  error: string;
  fixes: string[];
  explanation: string;
}
