import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { actwiseClient } from './server/actwiseClient';
import { runActWiseAgent, AgentProgressEvent } from './server/agent';
import { generateGeminiSpeech } from './server/tts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  function safeJsonParse(rawBody: string): any {
    try {
      return JSON.parse(rawBody);
    } catch (err) {
      const fixed = rawBody.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
      try {
        return JSON.parse(fixed);
      } catch {
        throw err;
      }
    }
  }

  // Raw text middleware to safely parse incoming JSON even with unescaped backslashes
  app.use(express.text({ type: ['application/json', 'text/plain', 'application/x-www-form-urlencoded', '*/*'], limit: '10mb' }));

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (typeof req.body === 'string' && req.body.trim()) {
      try {
        req.body = safeJsonParse(req.body);
      } catch (e: any) {
        console.warn('Failed to parse request body string:', e?.message || e);
        req.body = {};
      }
    } else if (!req.body) {
      req.body = {};
    }
    next();
  });

  // Request logger
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.url.startsWith('/api')) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    }
    next();
  });

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ActWise Docs Voice Agent',
      timestamp: new Date().toISOString(),
    });
  });

  // ActWise MCP direct health check & ping
  app.get('/api/mcp/health', async (req, res) => {
    try {
      const health = await actwiseClient.checkHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ActWise MCP list of tools
  app.get('/api/mcp/tools', async (req, res) => {
    try {
      const tools = await actwiseClient.listTools();
      res.json({ tools });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ActWise catalog quick inspection
  app.get('/api/mcp/catalog', async (req, res) => {
    try {
      const product = req.query.product as string | undefined;
      const result = await actwiseClient.callTool('get_catalog', product ? { product } : {});
      res.json(result.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Standard chat endpoint
  app.post('/api/chat', async (req, res) => {
    const message = (req.body?.message || req.body?.q || req.query?.message || req.query?.q) as string;
    const history = req.body?.history;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    try {
      const result = await runActWiseAgent(message, history || []);
      res.json(result);
    } catch (err: any) {
      console.error('Agent chat error:', err);
      res.status(500).json({
        error: err.message || 'Failed to process request',
        fullAnswer: "I couldn't reach the documentation service right now. Please try again in a moment.",
        spokenText: "I couldn't reach the documentation service right now. Please try again in a moment.",
        citations: [],
        followUps: [],
        mcpCalls: [],
      });
    }
  });

  // Text-to-Speech endpoint for natural studio quality voice
  app.post('/api/tts', async (req, res) => {
    const { text, voice } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    try {
      const speech = await generateGeminiSpeech(text, voice || 'Aoede');
      if (speech?.audioBase64) {
        res.json(speech);
      } else {
        res.json({ audioBase64: null, quotaExhausted: !!speech?.quotaExhausted, error: 'TTS unavailable' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Live SSE streaming chat endpoint with real-time status and tool call telemetry
  const handleChatStream = async (req: express.Request, res: express.Response) => {
    const query = ((req.body?.q || req.body?.message || req.query.q || req.query.message) as string) || '';
    const historyParam = req.body?.history ?? req.query.history;
    const requestedVoice = ((req.body?.voice || req.query.voice) as string) || 'Aoede';

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    let history: Array<{ role: 'user' | 'model'; text: string }> = [];
    if (Array.isArray(historyParam)) {
      history = historyParam;
    } else if (typeof historyParam === 'string') {
      try {
        history = JSON.parse(historyParam);
      } catch {
        history = [];
      }
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let clientDisconnected = false;
    const heartbeatTimer = setInterval(() => {
      if (!clientDisconnected && !res.writableEnded) {
        try {
          res.write(': heartbeat\n\n');
          if (typeof (res as any).flush === 'function') (res as any).flush();
        } catch {}
      }
    }, 10000);

    req.on('close', () => {
      clientDisconnected = true;
      clearInterval(heartbeatTimer);
    });

    const sendEvent = (event: any) => {
      if (clientDisconnected || res.writableEnded) return;
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (typeof (res as any).flush === 'function') (res as any).flush();
      } catch (err) {
        // stream write failed
      }
    };

    try {
      const finalResult = await runActWiseAgent(
        query,
        history,
        (evt) => {
          sendEvent(evt);
        },
        requestedVoice
      );

      if (clientDisconnected || res.writableEnded) {
        clearInterval(heartbeatTimer);
        return;
      }

      // 1. Send the text answer IMMEDIATELY so the client renders full formatted markdown and citations in under 1s
      sendEvent({
        type: 'answer_ready',
        fullAnswer: finalResult.fullAnswer,
        spokenText: finalResult.spokenText,
        citations: finalResult.citations,
        followUps: finalResult.followUps,
        mcpCalls: finalResult.mcpCalls,
      });

      // 2. Synthesize natural voice in parallel if spoken text exists
      let audioBase64: string | undefined;
      if (finalResult.spokenText && !clientDisconnected) {
        sendEvent({
          type: 'status',
          message: 'Synthesizing voice...',
        });
        try {
          const speech = await generateGeminiSpeech(finalResult.spokenText, requestedVoice);
          if (speech?.audioBase64) {
            audioBase64 = speech.audioBase64;
            sendEvent({
              type: 'audio_ready',
              audioBase64,
              spokenText: finalResult.spokenText,
              fallbackToBrowser: false,
            });
          } else {
            sendEvent({
              type: 'audio_ready',
              audioBase64: null,
              spokenText: finalResult.spokenText,
              fallbackToBrowser: true,
              quotaExhausted: !!speech?.quotaExhausted,
            });
          }
        } catch (ttsErr: any) {
          console.warn('Voice synthesis error (using browser speech):', ttsErr?.message || ttsErr);
          sendEvent({
            type: 'audio_ready',
            audioBase64: null,
            spokenText: finalResult.spokenText,
            fallbackToBrowser: true,
          });
        }
      }

      if (!clientDisconnected && !res.writableEnded) {
        sendEvent({
          type: 'complete',
          fullAnswer: finalResult.fullAnswer,
          spokenText: finalResult.spokenText,
          audioBase64,
          citations: finalResult.citations,
          followUps: finalResult.followUps,
          mcpCalls: finalResult.mcpCalls,
        });
        res.end();
      }
    } catch (err: any) {
      console.error('SSE Stream error:', err);
      if (!res.writableEnded && !clientDisconnected) {
        sendEvent({
          type: 'error',
          message: err.message || 'An error occurred while querying documentation',
        });
        res.end();
      }
    } finally {
      clearInterval(heartbeatTimer);
    }
  };

  app.get('/api/chat/stream', handleChatStream);
  app.post('/api/chat/stream', handleChatStream);

  // Catch any unhandled /api/* route so it NEVER falls through to index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.url} not found` });
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ActWise Voice Agent server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
