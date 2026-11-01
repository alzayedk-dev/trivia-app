// Local test server for AI mode. It runs the same function Vercel runs
// (api/ai-questions.ts) on your own computer, using the key in .env.local.
//
//   npm run ai-api      (leave it running), then open the app in a browser on localhost
//
// The app finds this server on its own when it's opened from localhost.

import { createServer } from 'node:http';

const PORT = 8788;

try {
  process.loadEnvFile('.env.local');
} catch {
  console.log('No .env.local file found here. Create one with a line like OPENROUTER_API_KEY=your-key');
}
if (!process.env.OPENROUTER_API_KEY)
  console.log('Warning: OPENROUTER_API_KEY is not set, so AI mode will answer with an error.');

const { default: handler } = await import('../api/ai-questions.ts');

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname !== '/api/ai-questions') {
    res.statusCode = 404;
    res.end();
    return;
  }
  let raw = '';
  for await (const chunk of req) raw += chunk;
  let body;
  try {
    body = raw ? JSON.parse(raw) : undefined;
  } catch {
    body = undefined;
  }
  // Vercel hands the function a parsed body and a couple of helpers; do the same here.
  req.body = body;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };
  const started = Date.now();
  res.on('finish', () => {
    const topic = typeof body?.topic === 'string' ? ` topic "${body.topic}"` : '';
    console.log(
      `${new Date().toLocaleTimeString()}  ${req.method} ${url.pathname}${topic} -> ${res.statusCode} (${((Date.now() - started) / 1000).toFixed(1)}s)`,
    );
  });
  await handler(req, res);
}).listen(PORT, () => console.log(`AI test server running at http://localhost:${PORT}/api/ai-questions`));
