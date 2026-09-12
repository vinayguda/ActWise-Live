/**
 * ActWise Docs Voice Agent Server Engine
 * Bridges Gemini 3.8 / Flash with ActWise DOCenter MCP
 */

import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { actwiseClient, McpToolCallResult } from './actwiseClient';

const SYSTEM_INSTRUCTION = `You are ActWise, a professional voice-enabled AI assistant for NICE Actimize product documentation.

## Core Purpose
ActWise answers NICE Actimize product documentation questions STRICTLY from the live documentation portal (via the search_docs and get_page tools) and always cites the source URL. You NEVER answer from prior or general knowledge.
If search_docs has not been called, do NOT answer product documentation questions.

## Routing (Determine this first)
The following message types should NOT trigger a documentation search:
1. How to use ActWise: ("How should I phrase my questions?", "Any tips for prompting?") -> Route to: How to ask ActWise. Do NOT call search_docs.
2. About ActWise: ("Who are you?", "What can you do?", "What information do you have?") -> Route to: About ActWise. Explain you are the ActWise assistant connected directly to NICE Actimize DOCenter portal. Do NOT call search_docs.
3. Portal / account / support: ("Reset my documentation password", "I can't log into the portal") -> Route to: Out of scope — portal, account and support. Do NOT call search_docs.

## Everything else (NICE Actimize Product Questions):
- search_docs MUST be called before answering.
- Answer ONLY from returned results.
- Never answer from memory or fabricate.
- If it is a procedural question ("How do I...", "Configure...", "Install...", "Steps to..."), after search_docs, call get_page with the most relevant portal_url to read the complete guide before answering!

## Search Filters & Slugs
Whenever a product is known or mentioned, always pass product=<slug>:
- ActOne -> product="actone"
- AML -> product="aml"
- SAM -> product="sam"
- IFM -> product="ifm"
- CDD -> product="cdd"
- RCM -> product="rcm"
- AIS -> product="ais"
- UDM -> product="udm"
- SURVEIL-X -> product="svx"
- Never ask for a version. Never pass doc_version unless the user explicitly specified one.
- If multiple products could match, ask one concise clarification before searching. Disambiguate only on product, never on version. Use get_catalog if helpful.

## Citations
Every factual claim must cite documentation. Render citations as clean Markdown links:
[Page Title](portal_url)
Copy portal_url exactly. Never modify or invent URLs.

## Empty Results & Version Transparency
- If count = 0, retry once without product filters or rephrase. If still empty, inform the user clearly and invite them to rephrase or specify the product.
- If versionDefaulted is true, append one short note: "Based on [Product] [Version] documentation. I can also check earlier versions if needed."

## Tone & Spoken Voice Delivery
- Voice Persona: ActWise is friendly, warm, quick, and nimble—like a knowledgeable, approachable senior Actimize specialist right beside the user.
- Keep the spoken tone natural, conversational, and energetic. Never sound robotic, stiff, or bureaucratic.
- When answering:
  1. The written response on screen should be thorough and complete with step-by-step procedures, technical details, code snippets, and exact markdown links [Title](url).
  2. The spoken response will be converted to real human voice audio. Keep the spoken summary quick (1 to 2 punchy, friendly sentences) and invite the user to explore the full guide on screen.
  3. Offer up to three relevant follow-up questions at the very end under "### Suggested Follow-ups:".
`;

const tools: FunctionDeclaration[] = [
  {
    name: 'search_docs',
    description: 'Primary documentation search for NICE Actimize product documentation in DOCenter portal.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'The search query string' },
        product: { type: Type.STRING, description: 'Product slug: actone, aml, sam, ifm, cdd, rcm, ais, udm, svx' },
        doc_version: { type: Type.STRING, description: 'Specific doc version if explicitly requested by user' },
        bundle: { type: Type.STRING, description: 'Bundle name filter if narrowing within a guide' },
        max_results: { type: Type.INTEGER, description: 'Max results to return (1-20, default 8)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_page',
    description: 'Fetch the full text and procedural steps of a documentation page as Markdown using its portal_url.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: 'The portal_url from search_docs result' },
        max_chars: { type: Type.INTEGER, description: 'Maximum characters of markdown to return (default 12000)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_catalog',
    description: 'Look up the Actimize product catalog, slugs, aliases, and available versions to resolve or disambiguate products.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        product: { type: Type.STRING, description: 'Optional product name, alias, or slug to inspect' },
      },
    },
  },
  {
    name: 'find_bundles',
    description: 'Find which documentation bundles answer a query (bundle discovery).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'The topic to locate' },
        product: { type: Type.STRING, description: 'Optional product slug' },
        max_results: { type: Type.INTEGER, description: 'Number of bundles to aggregate' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_docs',
    description: 'List documentation bundles for a product (Product Info, Release Notes, etc.).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        product: { type: Type.STRING, description: 'Product slug (e.g. actone, sam, aml)' },
        version: { type: Type.STRING, description: 'Optional version filter' },
      },
      required: ['product'],
    },
  },
  {
    name: 'get_toc',
    description: 'List a documentation bundle table of contents with all page titles and URLs.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        bundle: { type: Type.STRING, description: 'Exact bundle id' },
        title_filter: { type: Type.STRING, description: 'Optional keyword filter for page titles' },
      },
      required: ['bundle'],
    },
  },
];

export interface AgentProgressEvent {
  type: 'status' | 'tool_start' | 'tool_progress' | 'tool_end' | 'answer_chunk' | 'complete' | 'error';
  message?: string;
  toolCall?: {
    tool: string;
    args: Record<string, any>;
    durationMs?: number;
    resultSummary?: string;
    data?: any;
  };
  spokenText?: string;
  fullAnswer?: string;
  citations?: Array<{ title: string; url: string; bundle?: string; snippet?: string }>;
  followUps?: string[];
  mcpCalls?: McpToolCallResult[];
}

export async function runActWiseAgent(
  userQuery: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = [],
  onProgress?: (event: AgentProgressEvent) => void
): Promise<{
  fullAnswer: string;
  spokenText: string;
  citations: Array<{ title: string; url: string; bundle?: string; snippet?: string }>;
  followUps: string[];
  mcpCalls: McpToolCallResult[];
}> {
  const mcpCalls: McpToolCallResult[] = [];
  const citations: Array<{ title: string; url: string; bundle?: string; snippet?: string }> = [];

  const ai = new GoogleGenAI();
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash'];

  onProgress?.({
    type: 'status',
    message: 'Analyzing question and checking ActWise documentation scope...',
  });

  // Prepare Gemini contents with history
  const contents: any[] = [];

  for (const h of history) {
    contents.push({
      role: h.role,
      parts: [{ text: h.text }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userQuery }],
  });

  let turns = 0;
  const maxTurns = 5;
  let finalAnswer = '';

  while (turns < maxTurns) {
    turns++;

    // Call Gemini with tools and fallback cascade
    let res: any;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        res = await callGeminiWithRetry(ai, modelName, contents);
        if (res) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered error, trying next fallback:`, err.message?.slice(0, 120));
      }
    }

    if (!res) {
      throw new Error(`AI model error: ${lastError?.message || 'Could not connect to AI model'}`);
    }

    const candidate = res?.candidates?.[0];
    const candidateContent = candidate?.content;
    const functionCalls = res.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      // Model responded with text
      finalAnswer = res.text || '';
      break;
    }

    // Append model output to conversation
    contents.push(candidateContent);

    // Execute each function call
    for (const call of functionCalls) {
      const toolName = call.name;
      const toolArgs = (call.args as Record<string, any>) || {};

      // Send status to user
      const friendlyStatus = getFriendlyToolStatus(toolName, toolArgs);
      onProgress?.({
        type: 'tool_start',
        message: friendlyStatus,
        toolCall: {
          tool: toolName,
          args: toolArgs,
        },
      });

      // Setup engagement timer if MCP takes time (> 1.2s)
      const engagementTimer = setTimeout(() => {
        onProgress?.({
          type: 'tool_progress',
          message: getEngagementMessage(toolName, toolArgs),
        });
      }, 1200);

      // Execute on ActWise MCP server
      const result = await actwiseClient.callTool(toolName, toolArgs);
      clearTimeout(engagementTimer);
      mcpCalls.push(result);

      // Collect citations if tool was search_docs or get_page
      if (toolName === 'search_docs' && result.data?.results) {
        for (const item of result.data.results) {
          if (item.portal_url && !citations.some((c) => c.url === item.portal_url)) {
            citations.push({
              title: item.title || 'NICE Actimize Documentation',
              url: item.portal_url,
              bundle: item.bundle,
              snippet: item.snippet || item.shortDesc,
            });
          }
        }
      } else if (toolName === 'get_page' && result.data?.url) {
        if (!citations.some((c) => c.url === result.data.url)) {
          citations.push({
            title: result.data.title || 'NICE Actimize Documentation',
            url: result.data.url,
            bundle: result.data.bundle,
          });
        }
      }

      const summary = getResultSummary(toolName, result);
      onProgress?.({
        type: 'tool_end',
        message: `DOCenter ${toolName}: ${summary} (${result.durationMs}ms)`,
        toolCall: {
          tool: toolName,
          args: toolArgs,
          durationMs: result.durationMs,
          resultSummary: summary,
          data: result.data,
        },
      });

      // Add tool response to contents
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: toolName,
              id: call.id,
              response: {
                output: result.data || { error: result.errorMessage || 'No data returned' },
              },
            },
          },
        ],
      });
    }
  }

  if (!finalAnswer) {
    finalAnswer = "I couldn't reach the documentation service right now. Please try again in a moment.";
  }

  // Parse follow-up suggestions from finalAnswer
  const { cleanAnswer, followUps } = extractFollowUps(finalAnswer);

  // Generate spoken text optimized for natural voice reading
  const spokenText = createSpokenVersion(cleanAnswer);

  return {
    fullAnswer: cleanAnswer,
    spokenText,
    citations,
    followUps,
    mcpCalls,
  };
}

async function callGeminiWithRetry(
  ai: GoogleGenAI,
  model: string,
  contents: any[],
  maxRetries = 3
): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: tools }],
          temperature: 0.2,
        },
      });
      return response;
    } catch (err: any) {
      const isQuota = err.status === 429 || err.message?.includes('429') || err.message?.includes('quota');
      if (isQuota && attempt < maxRetries) {
        // Exponential backoff
        const delay = attempt * 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

function getFriendlyToolStatus(tool: string, args: Record<string, any>): string {
  switch (tool) {
    case 'search_docs':
      return args.product
        ? `Searching NICE Actimize DOCenter for '${args.query}' in ${args.product.toUpperCase()}...`
        : `Searching NICE Actimize DOCenter for '${args.query}'...`;
    case 'get_page':
      return `Retrieving full procedural documentation page from DOCenter...`;
    case 'get_catalog':
      return `Consulting NICE Actimize product catalog...`;
    case 'find_bundles':
      return `Discovering documentation bundles for '${args.query}'...`;
    case 'list_docs':
      return `Listing documentation bundles for ${args.product}...`;
    case 'get_toc':
      return `Reading table of contents for bundle ${args.bundle}...`;
    default:
      return `Consulting ActWise MCP tool ${tool}...`;
  }
}

function getEngagementMessage(tool: string, args: Record<string, any>): string {
  switch (tool) {
    case 'search_docs':
      return `Connecting live with NICE Actimize portal DOCenter to pull official guides...`;
    case 'get_page':
      return `Reading and extracting verified guide steps from DOCenter...`;
    case 'get_catalog':
      return `Verifying product versions and aliases across 90+ Actimize offerings...`;
    default:
      return `Accessing ActWise documentation services...`;
  }
}

function getResultSummary(tool: string, res: McpToolCallResult): string {
  if (res.isError) return `Error: ${res.errorMessage || 'Failed'}`;
  if (tool === 'search_docs') {
    const count = res.data?.results?.length || res.data?.count || 0;
    const version = res.data?.versionUsed || (res.data?.versionDefaulted ? 'latest' : '');
    return `Found ${count} relevant documents${version ? ` (${version})` : ''}`;
  }
  if (tool === 'get_page') {
    return res.data?.title ? `Retrieved "${res.data.title}"` : 'Retrieved full page';
  }
  if (tool === 'get_catalog') {
    return res.data?.productCount ? `${res.data.productCount} products indexed` : 'Product resolved';
  }
  return 'Completed';
}

function extractFollowUps(text: string): { cleanAnswer: string; followUps: string[] } {
  const followUps: string[] = [];
  const followUpRegex = /###?\s*(?:Suggested Follow-ups?|Related Questions?|Follow-up Suggestions?):?\s*([\s\S]*)$/i;
  const match = text.match(followUpRegex);

  let cleanAnswer = text;
  if (match) {
    cleanAnswer = text.slice(0, match.index).trim();
    const suggestionsBlock = match[1];
    const lines = suggestionsBlock.split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[\*\-\d\.\s]+/, '').trim();
      // Remove quotes or markdown
      const cleaned = trimmed.replace(/^["']|["']$/g, '').trim();
      if (cleaned.length > 5 && cleaned.length < 120) {
        followUps.push(cleaned);
      }
    }
  }

  // Cap to 3 suggestions as specified in the ActWise guidelines
  return {
    cleanAnswer,
    followUps: followUps.slice(0, 3),
  };
}

function createSpokenVersion(markdownText: string): string {
  // Remove markdown links e.g. [Title](url) -> Title
  let text = markdownText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  // Remove markdown headers, bullets, numbers
  text = text.replace(/^#+\s+/gm, '');
  text = text.replace(/^[\*\-\+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  // Remove markdown bold/italics/code/quotes
  text = text.replace(/[*_#`>]/g, '');
  // Remove URLs
  text = text.replace(/https?:\/\/\S+/g, '');
  // Clean multiple spaces and newlines
  text = text.replace(/\s+/g, ' ').trim();

  // Pick the first 2 clear sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let spoken = '';
  if (sentences.length > 0) {
    spoken = sentences[0].trim();
    if (sentences.length > 1 && spoken.length < 120) {
      spoken += ' ' + sentences[1].trim();
    }
  } else {
    spoken = text;
  }

  // Ensure friendly, nimble conversational closing
  if (sentences.length > 2 && !spoken.toLowerCase().includes('screen')) {
    spoken += " I've also detailed the full steps and official documentation links right on your screen.";
  }

  return spoken;
}
