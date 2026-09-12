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
  const PORT = 3000;

  app.use(express.json());

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
    const { message, history } = req.body;
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
      if (speech) {
        res.json(speech);
      } else {
        res.status(500).json({ error: 'TTS generation unavailable' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Live SSE streaming chat endpoint with real-time status and tool call telemetry
  app.get('/api/chat/stream', async (req, res) => {
    const query = req.query.q as string;
    const historyJson = req.query.history as string;
    const requestedVoice = (req.query.voice as string) || 'Aoede';

    if (!query) {
      res.status(400).send('Query parameter "q" is required');
      return;
    }

    let history: Array<{ role: 'user' | 'model'; text: string }> = [];
    if (historyJson) {
      try {
        history = JSON.parse(historyJson);
      } catch {
        history = [];
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: any) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const finalResult = await runActWiseAgent(query, history, (evt) => {
        sendEvent(evt);
      });

      // Generate natural studio voice in background / immediately
      let audioBase64: string | undefined;
      if (finalResult.spokenText) {
        sendEvent({
          type: 'status',
          message: 'Synthesizing natural voice...',
        });
        const speech = await generateGeminiSpeech(finalResult.spokenText, requestedVoice);
        if (speech?.audioBase64) {
          audioBase64 = speech.audioBase64;
        }
      }

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
    } catch (err: any) {
      console.error('SSE Stream error:', err);
      sendEvent({
        type: 'error',
        message: err.message || 'An error occurred while querying documentation',
      });
      res.end();
    }
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
