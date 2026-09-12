/**
 * ActWise Docs MCP Client
 * Communicates with https://actwise-dev-mcp.ps.actimize.services/mcp
 */

export interface McpToolCallResult {
  tool: string;
  arguments: Record<string, any>;
  durationMs: number;
  data: any;
  isError?: boolean;
  errorMessage?: string;
}

export class ActWiseMcpClient {
  private url: string;
  private apiKey: string;

  constructor(url?: string, apiKey?: string) {
    this.url = url || process.env.ACTWISE_MCP_URL || 'https://actwise-dev-mcp.ps.actimize.services/mcp';
    this.apiKey = apiKey || process.env.ACTWISE_MCP_API_KEY || 'poc-actwise-key-7f3a91';
  }

  async checkHealth(): Promise<{ ok: boolean; latencyMs: number; toolsCount?: number; error?: string }> {
    const startTime = Date.now();
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'health-check',
          method: 'tools/list',
          params: {},
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        return { ok: false, latencyMs, error: `HTTP ${response.status} ${response.statusText}` };
      }

      const text = await response.text();
      const json = this.parseMcpResponse(text);
      const toolsCount = json?.result?.tools?.length || 0;
      return { ok: true, latencyMs, toolsCount };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - startTime, error: err.message || 'Connection failed' };
    }
  }

  async listTools(): Promise<any[]> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list tools: HTTP ${response.status}`);
    }

    const text = await response.text();
    const json = this.parseMcpResponse(text);
    return json?.result?.tools || [];
  }

  async callTool(name: string, args: Record<string, any> = {}): Promise<McpToolCallResult> {
    const startTime = Date.now();
    const id = Date.now();

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id,
          method: 'tools/call',
          params: {
            name,
            arguments: args,
          },
        }),
      });

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          tool: name,
          arguments: args,
          durationMs,
          data: null,
          isError: true,
          errorMessage: `HTTP ${response.status}: ${errorText || response.statusText}`,
        };
      }

      const text = await response.text();
      const json = this.parseMcpResponse(text);

      if (json?.error) {
        return {
          tool: name,
          arguments: args,
          durationMs,
          data: null,
          isError: true,
          errorMessage: json.error.message || JSON.stringify(json.error),
        };
      }

      // Check content in result
      const content = json?.result?.content;
      let parsedData: any = null;

      if (Array.isArray(content) && content.length > 0) {
        const firstText = content[0]?.text;
        if (firstText) {
          try {
            parsedData = JSON.parse(firstText);
          } catch {
            parsedData = firstText;
          }
        } else {
          parsedData = content;
        }
      } else {
        parsedData = json?.result || json;
      }

      return {
        tool: name,
        arguments: args,
        durationMs,
        data: parsedData,
        isError: json?.result?.isError === true,
      };
    } catch (err: any) {
      return {
        tool: name,
        arguments: args,
        durationMs: Date.now() - startTime,
        data: null,
        isError: true,
        errorMessage: err.message || 'Network error calling MCP tool',
      };
    }
  }

  private parseMcpResponse(rawText: string): any {
    // Check if rawText is SSE formatted: "event: message\ndata: { ... }"
    if (rawText.includes('data:')) {
      const lines = rawText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonString = trimmed.slice(5).trim();
          try {
            return JSON.parse(jsonString);
          } catch {
            // continue searching
          }
        }
      }
    }

    // Try parsing directly as JSON
    try {
      return JSON.parse(rawText);
    } catch (e) {
      throw new Error(`Failed to parse MCP response: ${rawText.slice(0, 200)}...`);
    }
  }
}

export const actwiseClient = new ActWiseMcpClient();
