import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';

// 用一个可注入 fetch 的方式测试：在 import 路由前 mock globalThis.fetch
// 注意：本测试在 Task 1 之后，aiService 已存在

async function startApp() {
  // 动态加载路由模块；env 由各测试自行设置（isConfigured 在调用时读 env）
  const express = (await import('express')).default;
  const aiRouter = (await import('../src/routes/ai.js')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRouter);
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

test('未配置 key 时返回 503', async () => {
  delete process.env.DEEPSEEK_API_KEY;
  const app = await startApp();
  const { server, url } = await listen(app);
  try {
    const res = await fetch(`${url}/api/ai/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: { sections: {} }, section: 'summary' }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.error, 'AI 未配置');
  } finally {
    server.close();
  }
});

test('optimize 流式返回 delta 和 done 事件', async () => {
  process.env.DEEPSEEK_API_KEY = 'sk-test';
  // mock fetch 返回一个 SSE 流
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const sseBody = [
      'data: {"choices":[{"delta":{"content":"优"}}]}',
      'data: {"choices":[{"delta":{"content":"化"}}]}',
      'data: [DONE]',
    ].join('\n\n') + '\n\n';
    return {
      ok: true,
      status: 200,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseBody));
          controller.close();
        },
      }),
    };
  };
  const app = await startApp();
  const { server, url } = await listen(app);
  try {
    // 用真实的 fetch 发 HTTP 请求（mock 只用来模拟 DeepSeek API）
    const res = await originalFetch(`${url}/api/ai/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: { sections: { summary: { content: '原文' } } }, section: 'summary' }),
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/event-stream/);
    const text = await res.text();
    assert.match(text, /"type":"delta"/);
    assert.match(text, /"type":"done"/);
    assert.match(text, /优/);
    assert.match(text, /化/);
  } finally {
    globalThis.fetch = originalFetch;
    server.close();
  }
});
