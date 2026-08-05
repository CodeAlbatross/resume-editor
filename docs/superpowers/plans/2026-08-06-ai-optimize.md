# AI 优化功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为简历编辑器新增 AI 优化能力 — 分区块内容润色（✨ 按钮）+ 侧边栏 AI 助手（自由对话/JD定制/素材整合/整体评估）。

**Architecture:** 服务端新增 `/api/ai/optimize` 和 `/api/ai/chat` 两个 SSE 流式路由，封装 DeepSeek REST API（`deepseek-chat` 模型，`stream: true`），API Key 通过 `.env` 配置只在服务端读取。前端通过原生 `fetch` + `ReadableStream` 解析 SSE 流，打字机效果渲染，优化结果绝不自动写入（必须用户点「应用」）。

**Tech Stack:** Express（SSE）、Node 24 内置 `fetch`/`node:test`/`process.loadEnvFile()`、React + TypeScript + Zustand、DeepSeek REST API。

## Global Constraints

- 目标环境 Node ≥20.12（本项目为 Node 24），**禁止新增任何 npm 依赖**（服务端与前端均不新增）
- API Key 只在服务端读取，前端任何代码不得接触 key
- SSE 事件格式统一为：`data: {"type":"delta","text":"..."}` → `data: {"type":"done","result":{...}}`，出错时 `data: {"type":"error","message":"..."}`
- 优化结果**绝不自动写入**简历，必须用户点击「应用」后才 `updateSection`
- 前端 SSR/测试无测试框架，前端验收用手动清单；后端用 Node 内置 `node:test`
- 服务器 `.env` 文件不入 git（根 `.gitignore` 追加 `server/.env`）
- ✨ 按钮覆盖范围：仅 SummaryEditor（标题栏）、ExperienceEditor（每条 item）、ProjectEditor（每条 item）。Education/Skills/Personal/Certificate/Language/Custom 不加
- DeepSeek 超时 60s（`AbortController`）；未配置 key 时后端返回 503

---

### Task 1: 后端 .env 配置 + aiService.js（DeepSeek 调用封装 + Prompt 组装）

**Files:**
- Create: `server/.env.example`
- Modify: `.gitignore`（根目录，追加 `server/.env`）
- Create: `server/src/services/aiService.js`
- Test: `server/test/aiService.test.js`
- Modify: `server/package.json`（加 `"test": "node --test test/"`）

**Interfaces:**
- Produces (供 Task 2 使用):
  - `aiService.isConfigured(): boolean` — 检查 `DEEPSEEK_API_KEY` 是否已配置
  - `aiService.buildOptimizeMessages({ resume, section, itemIndex, instruction }): Array<{role, content}>` — 组装润色 prompt
  - `aiService.buildChatMessages({ resume, messages }): Array<{role, content}>` — 组装对话 prompt
  - `aiService.streamChat(messages, { onDelta, signal }): Promise<void>` — 调 DeepSeek，流式回调

**设计要点：** `aiService.js` 用 `process.env` 读取配置（不 import 任何第三方包），DeepSeek 调用用 Node 内置 `fetch`。Prompt 组装是纯函数，便于单元测试。`streamChat` 把 DeepSeek 的 SSE 流解析后逐段回调 `onDelta`。

- [ ] **Step 1: 写 `.env.example`**

创建 `server/.env.example`：

```
# DeepSeek API 配置（复制本文件为 server/.env 并填入真实 key）
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

- [ ] **Step 2: 根 `.gitignore` 追加 `server/.env`**

编辑根目录 `.gitignore`，在末尾追加：

```
# AI 配置
server/.env
```

- [ ] **Step 3: 写失败测试 `server/test/aiService.test.js`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

// 确保环境变量可注入：把 process.env 引用延迟到调用时
// aiService 用 process.env 直接读取，测试前设置
const ORIGINAL_ENV = { ...process.env };
const apiKey = 'sk-test-key-123';

function setEnv() {
  process.env.DEEPSEEK_API_KEY = apiKey;
  process.env.DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
  process.env.DEEPSEEK_MODEL = 'deepseek-chat';
}
function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
}

test('isConfigured 在有 key 时返回 true', () => {
  setEnv();
  const { isConfigured } = await import('../src/services/aiService.js');
  assert.equal(isConfigured(), true);
  resetEnv();
});

test('isConfigured 在无 key 时返回 false', () => {
  resetEnv();
  delete process.env.DEEPSEEK_API_KEY;
  const { isConfigured } = await import('../src/services/aiService.js');
  assert.equal(isConfigured(), false);
  resetEnv();
});

test('buildOptimizeMessages 组装包含原文和指令', () => {
  setEnv();
  const { buildOptimizeMessages } = await import('../src/services/aiService.js');
  const resume = { sections: { summary: { content: '我是张三，会写代码。' } } };
  const messages = buildOptimizeMessages({ resume, section: 'summary', itemIndex: -1, instruction: '更量化' });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'system');
  assert.match(messages[1].content, /我是张三/);
  assert.match(messages[1].content, /更量化/);
  resetEnv();
});

test('buildChatMessages 附带简历上下文', () => {
  setEnv();
  const { buildChatMessages } = await import('../src/services/aiService.js');
  const resume = { name: '张三', sections: { summary: { content: '测试' } } };
  const messages = buildChatMessages({ resume, messages: [{ role: 'user', content: '帮我分析' }] });
  assert.equal(messages.length, 2); // system + 用户消息
  assert.match(messages[0].content, /张三/);
  assert.equal(messages[1].role, 'user');
  resetEnv();
});
```

- [ ] **Step 4: 运行测试确认失败**

```bash
cd "C:\Users\admin\Desktop\简历系统\server" && node --test test/aiService.test.js
```

Expected: FAIL — `Cannot find module '../src/services/aiService.js'`（文件还没建）

- [ ] **Step 5: 实现 `server/src/services/aiService.js`**

```js
const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';

export function isConfigured() {
  return !!process.env.DEEPSEEK_API_KEY;
}

function getConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL,
    model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
  };
}

// 从 resume 中提取某个区块的内容文本
function extractSectionText(resume, section, itemIndex) {
  const sections = resume?.sections || {};
  const target = sections[section];
  if (!target) return '';
  if (Array.isArray(target)) {
    if (itemIndex >= 0 && itemIndex < target.length) {
      const item = target[itemIndex];
      return item.description || JSON.stringify(item, null, 2);
    }
    // 整块数组：序列化做上下文
    return JSON.stringify(target, null, 2);
  }
  if (typeof target === 'object' && 'content' in target) return target.content;
  return JSON.stringify(target, null, 2);
}

const SYSTEM_PROMPT = `你是一位资深 HR 简历顾问。你的任务是根据用户需求优化简历内容。
规则：
1. 只优化文本表达，不编造用户没有的事实，不添加虚假经历。
2. 使用动词开头，尽量量化成果（数字、百分比、规模）。
3. 避免空洞套话（如"具备良好的沟通能力"），用具体行为支撑。
4. 保持中文输出。
5. 直接输出优化后的内容，不要任何解释、引号或格式标记。`;

export function buildOptimizeMessages({ resume, section, itemIndex = -1, instruction = '' }) {
  const original = extractSectionText(resume, section, itemIndex);
  let userPrompt = `请优化以下简历区块内容：\n\n${original}\n`;
  if (instruction) userPrompt += `\n优化要求：${instruction}\n`;
  userPrompt += '\n请直接返回优化后的内容。';
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];
}

const CHAT_SYSTEM_PROMPT = `你是一位资深 HR 简历顾问，正在协助用户优化他的简历。以下是用户当前简历的完整数据。回答用户的任何问题，涉及简历优化时给出专业建议。当用户提到某个区块时，引用具体内容。保持中文回答，简洁专业。`;

export function buildChatMessages({ resume, messages }) {
  const resumeContext = `用户当前简历数据（JSON）：\n${JSON.stringify(resume, null, 2)}`;
  return [
    { role: 'system', content: `${CHAT_SYSTEM_PROMPT}\n\n${resumeContext}` },
    ...messages,
  ];
}

export async function streamChat(messages, { onDelta, signal }) {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey) throw new Error('AI 未配置：缺少 DEEPSEEK_API_KEY');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`DeepSeek API ${response.status}: ${errText}`);
  }
  if (!response.body) throw new Error('DeepSeek API 无响应体');

  // 解析 SSE 流（data: {...} 行）
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return;
    try {
      const json = JSON.parse(payload);
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) onDelta(delta);
    } catch {
      // 忽略无法解析的块
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留最后不完整的一行
    for (const line of lines) handleLine(line);
  }
  if (buffer.trim()) handleLine(buffer);
}
```

- [ ] **Step 6: 运行测试确认通过**

```bash
cd "C:\Users\admin\Desktop\简历系统\server" && node --test test/aiService.test.js
```

Expected: PASS — 4 个测试全部通过

- [ ] **Step 7: 给 `server/package.json` 加 test script**

把 `"scripts"` 改为：

```json
"scripts": {
  "dev": "node --watch src/index.js",
  "start": "node src/index.js",
  "test": "node --test test/"
}
```

- [ ] **Step 8: 提交**

```bash
git add server/.env.example server/src/services/aiService.js server/test/aiService.test.js server/package.json .gitignore
git commit -m "feat: AI 服务端调用封装与 Prompt 组装"
```

---

### Task 2: 后端 SSE 路由 routes/ai.js + 挂载

**Files:**
- Create: `server/src/routes/ai.js`
- Modify: `server/src/index.js`（挂载 `/api/ai`）
- Test: `server/test/aiRoutes.test.js`

**Interfaces:**
- Consumes: `aiService`（Task 1 产出，接口见 Task 1）
- Produces:
  - `POST /api/ai/optimize`（SSE）— 请求体 `{ resume, section, itemIndex?, instruction? }`
  - `POST /api/ai/chat`（SSE）— 请求体 `{ resume, messages }`
  - 未配置 key → 503 `{ error: 'AI 未配置' }`
  - SSE 事件：`delta` → `done` | `error`

- [ ] **Step 1: 写路由测试 `server/test/aiRoutes.test.js`**

用 Node 内置 `node:test`，通过 mock 全局 `fetch` 模拟 DeepSeek 响应，用真实 Express 起一个临时 server 发请求验证 SSE 格式：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';

// 用一个可注入 fetch 的方式测试：在 import 路由前 mock globalThis.fetch
// 注意：本测试在 Task 1 之后，aiService 已存在

function startApp() {
  // 动态加载，确保 process.env 生效
  process.env.DEEPSEEK_API_KEY = 'sk-test';
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
    const res = await fetch(`${url}/api/ai/optimize`, {
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd "C:\Users\admin\Desktop\简历系统\server" && node --test test/aiRoutes.test.js
```

Expected: FAIL — `Cannot find module '../src/routes/ai.js'`

- [ ] **Step 3: 实现 `server/src/routes/ai.js`**

```js
import { Router } from 'express';
import * as aiService from '../services/aiService.js';

const router = Router();
const TIMEOUT_MS = 60_000;

function setupSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

function sendEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

// 通用流式处理器：组装 messages → 调 aiService → SSE 透传
function handleStream(req, res, buildMessages) {
  if (!aiService.isConfigured()) {
    return res.status(503).json({ error: 'AI 未配置' });
  }

  let messages;
  try {
    messages = buildMessages(req.body || {});
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  setupSSE(res);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  req.on('close', () => {
    clearTimeout(timer);
    controller.abort();
  });

  aiService.streamChat(messages, {
    onDelta: (text) => sendEvent(res, { type: 'delta', text }),
    signal: controller.signal,
  })
    .then(() => {
      sendEvent(res, { type: 'done', result: {} });
      res.end();
    })
    .catch((e) => {
      sendEvent(res, { type: 'error', message: e.message || 'AI 服务错误' });
      res.end();
    });
}

// 分区块润色
router.post('/optimize', (req, res) => {
  const { resume, section, itemIndex, instruction } = req.body || {};
  if (!resume || !section) {
    return res.status(400).json({ error: '缺少 resume 或 section' });
  }
  handleStream(req, res, () =>
    aiService.buildOptimizeMessages({ resume, section, itemIndex, instruction })
  );
});

// 侧边栏助手对话
router.post('/chat', (req, res) => {
  const { resume, messages } = req.body || {};
  if (!resume || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '缺少 resume 或 messages' });
  }
  handleStream(req, res, () => aiService.buildChatMessages({ resume, messages }));
});

export default router;
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd "C:\Users\admin\Desktop\简历系统\server" && node --test test/aiRoutes.test.js
```

Expected: PASS — 2 个测试全部通过

- [ ] **Step 5: 挂载路由到 `server/src/index.js`**

在 `import versionsRouter from './routes/versions.js';` 之后追加：

```js
import aiRouter from './routes/ai.js';
```

在 `app.use('/api/pdf', pdfRouter);` 之后追加：

```js
// AI 优化 API
app.use('/api/ai', aiRouter);
```

- [ ] **Step 6: 提交**

```bash
git add server/src/routes/ai.js server/src/index.js server/test/aiRoutes.test.js
git commit -m "feat: AI 优化 SSE 路由"
```

---

### Task 3: 前端类型 + API + useStreaming hook + useAiStore

**Files:**
- Modify: `client/src/types/resume.ts`（追加 AI 类型）
- Modify: `client/src/api/client.ts`（追加 `aiOptimize()` / `aiChat()`，用 fetch 而非 axios）
- Create: `client/src/hooks/useStreaming.ts`
- Create: `client/src/stores/useAiStore.ts`

**Interfaces:**
- Produces (供 Task 4/5 使用):
  - `api.aiOptimize({ resume, section, itemIndex, instruction }, onDelta): Promise<void>` — 触发流式优化
  - `api.aiChat({ resume, messages }, onDelta): Promise<void>` — 触发流式对话
  - `useStreaming()` 返回 `{ streaming, error, stream, stop }`（详见下面实现）
  - `useAiStore` 状态：`messages`, `optimizing`, `streamingSection`, `addMessage`, `clearMessages`, `setOptimizing`, `setStreamingSection`
  - 类型：`AiChatMessage { role: 'user' | 'assistant'; content: string }`

- [ ] **Step 1: `client/src/types/resume.ts` 追加 AI 类型**

在文件末尾追加：

```ts
// === AI 优化相关类型 ===

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiOptimizeRequest {
  resume: ResumeData;
  section: string;
  itemIndex?: number;
  instruction?: string;
}
```

- [ ] **Step 2: `client/src/api/client.ts` 追加流式函数**

在文件末尾追加（注意：用原生 `fetch` 而非 axios，因为 axios 不支持流式响应）：

```ts
// === AI 优化 API（SSE 流式，用 fetch） ===

function sseFetch(
  url: string,
  body: object,
  onDelta: (text: string) => void,
  onDone?: () => void
): { stop: () => void } {
  const controller = new AbortController();
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error('无响应体');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === 'delta' && evt.text) onDelta(evt.text);
            else if (evt.type === 'error') throw new Error(evt.message || 'AI 服务错误');
            else if (evt.type === 'done') onDone?.();
          } catch {
            // 忽略解析失败的行
          }
        }
      }
    })
    .catch((e: unknown) => {
      if ((e as Error).name !== 'AbortError') {
        onDelta(`\n\n[错误] ${(e as Error).message || '连接失败'}`);
        onDone?.();
      }
    });
  return { stop: () => controller.abort() };
}

export function aiOptimize(req: AiOptimizeRequest, onDelta: (t: string) => void, onDone?: () => void) {
  return sseFetch('/api/ai/optimize', req, onDelta, onDone);
}

export function aiChat(req: { resume: ResumeData; messages: AiChatMessage[] }, onDelta: (t: string) => void, onDone?: () => void) {
  return sseFetch('/api/ai/chat', req, onDelta, onDone);
}
```

- [ ] **Step 3: 创建 `client/src/hooks/useStreaming.ts`**

```ts
import { useCallback, useRef, useState } from 'react';

interface StreamOptions<TReq> {
  request: TReq;
  onDelta: (text: string) => void;
  start?: () => void;
  done?: () => void;
}

export function useStreaming() {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  const stream = useCallback(<TReq,>(opts: StreamOptions<TReq> & { run: (req: TReq, onDelta: (t: string) => void, onDone: () => void) => { stop: () => void } }) => {
    setError('');
    setStreaming(true);
    opts.start?.();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setStreaming(false);
      opts.done?.();
      stopRef.current = null;
    };
    const handle = opts.run(opts.request, opts.onDelta, finish);
    stopRef.current = () => { handle.stop(); };
  }, []);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setStreaming(false);
  }, []);

  return { streaming, error, stream, stop };
}
```

- [ ] **Step 4: 创建 `client/src/stores/useAiStore.ts`**

```ts
import { create } from 'zustand';
import type { AiChatMessage } from '../types/resume';

interface AiStore {
  messages: AiChatMessage[];
  optimizing: boolean;
  streamingSection: string | null;
  addMessage: (m: AiChatMessage) => void;
  clearMessages: () => void;
  setOptimizing: (v: boolean) => void;
  setStreamingSection: (key: string | null) => void;
}

export const useAiStore = create<AiStore>((set) => ({
  messages: [],
  optimizing: false,
  streamingSection: null,
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clearMessages: () => set({ messages: [] }),
  setOptimizing: (v) => set({ optimizing: v }),
  setStreamingSection: (key) => set({ streamingSection: key }),
}));
```

- [ ] **Step 5: 编译验收（前端无测试框架，用 tsc 检查）**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 6: 提交**

```bash
git add client/src/types/resume.ts client/src/api/client.ts client/src/hooks/useStreaming.ts client/src/stores/useAiStore.ts
git commit -m "feat: AI 前端流式 API 与状态管理"
```

---

### Task 4: 前端 OptimizeButton 组件（✨ 分区块优化）

**Files:**
- Create: `client/src/components/ai/OptimizeButton.tsx`
- Modify: `client/src/components/editor/SummaryEditor.tsx`（标题栏加 ✨）
- Modify: `client/src/components/editor/ExperienceEditor.tsx`（每条 item 加 ✨）
- Modify: `client/src/components/editor/ProjectEditor.tsx`（每条 item 加 ✨）

**Interfaces:**
- Consumes: `api.aiOptimize`, `useResumeStore.updateSection`, `useAiStore.setOptimizing/setStreamingSection`
- Produces:
  - `<OptimizeButton section="summary" />` — 摘要标题栏按钮
  - `<OptimizeButton section="experience" itemIndex={i} />` — 经历第 i 条按钮
  - `<OptimizeButton section="projects" itemIndex={i} />` — 项目第 i 条按钮
  - 点击后弹窗：输入指令 → 开始优化（流式）→ 原文/结果对比 → 应用/撤销

- [ ] **Step 1: 创建 `client/src/components/ai/OptimizeButton.tsx`**

```tsx
import { useState } from 'react';
import { useResumeStore } from '../../stores/useResumeStore';
import { useAiStore } from '../../stores/useAiStore';
import * as api from '../../api/client';
import type { ResumeData } from '../../types/resume';

interface Props {
  section: 'summary' | 'experience' | 'projects';
  itemIndex?: number;
}

export default function OptimizeButton({ section, itemIndex }: Props) {
  const resume = useResumeStore((s) => s.resume);
  const updateSection = useResumeStore((s) => s.updateSection);
  const setOptimizing = useAiStore((s) => s.setOptimizing);
  const setStreamingSection = useAiStore((s) => s.setStreamingSection);
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [original, setOriginal] = useState('');
  const [result, setResult] = useState('');
  const [streaming, setStreaming] = useState(false);

  const start = () => {
    if (!resume) return;
    // 取原文
    let orig = '';
    if (section === 'summary') orig = resume.sections.summary.content;
    else if (itemIndex !== undefined) {
      const arr = section === 'experience' ? resume.sections.experience : resume.sections.projects;
      orig = arr[itemIndex]?.description || '';
    }
    setOriginal(orig);
    setResult('');
    setInstruction('');
    setOpen(true);
  };

  const run = async () => {
    if (!resume) return;
    setStreaming(true);
    setOptimizing(true);
    setStreamingSection(`${section}-${itemIndex ?? 'all'}`);
    api.aiOptimize(
      { resume, section, itemIndex, instruction },
      (t) => setResult((prev) => prev + t),
      () => { setStreaming(false); setOptimizing(false); setStreamingSection(null); }
    );
  };

  const apply = () => {
    if (!resume || !result.trim()) return;
    if (section === 'summary') {
      updateSection('summary', { content: result.trim() });
    } else if (itemIndex !== undefined && (section === 'experience' || section === 'projects')) {
      const key = section;
      const arr = resume.sections[key];
      const next = arr.map((it: any, i: number) =>
        i === itemIndex ? { ...it, description: result.trim() } : it
      );
      updateSection(key, next as never);
    }
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={start}
        className="text-xs text-amber-500 hover:text-amber-700 shrink-0"
        title="AI 优化"
      >✨</button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !streaming && setOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">✨ AI 优化</h3>
              {streaming && <span className="text-xs text-amber-500 animate-pulse">优化中...</span>}
            </div>
            <input
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="附加指令（可选），如：更量化、突出架构能力"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={streaming}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">原文</p>
                <div className="text-sm text-gray-400 bg-gray-50 rounded p-2 min-h-[80px] max-h-48 overflow-y-auto whitespace-pre-wrap">{original}</div>
              </div>
              <div>
                <p className="text-xs text-green-500 mb-1">AI 优化</p>
                <div className="text-sm text-gray-800 bg-green-50 rounded p-2 min-h-[80px] max-h-48 overflow-y-auto whitespace-pre-wrap">{result || (streaming ? '生成中...' : '')}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setOpen(false)} disabled={streaming} className="px-3 py-1.5 text-sm border rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50">撤销</button>
              <button onClick={run} disabled={streaming || !resume} className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50">
                {streaming ? '优化中...' : '开始优化'}
              </button>
              <button onClick={apply} disabled={streaming || !result.trim()} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">应用</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: SummaryEditor 标题栏加 ✨**

把 `SummaryEditor.tsx` 的标题行改为：

```tsx
<div className="flex items-center justify-between">
  <h3 className="font-semibold text-gray-800">个人摘要</h3>
  <OptimizeButton section="summary" />
</div>
```

并在文件顶部 import：

```tsx
import OptimizeButton from '../ai/OptimizeButton';
```

- [ ] **Step 3: ExperienceEditor 每条 item 加 ✨**

（1）文件顶部，`import type { Experience }` 之后追加：

```tsx
import OptimizeButton from '../ai/OptimizeButton';
```

（2）在 `ExperienceItem` 组件的头部行（当前 `{index > 0 && ...}` 上移按钮之后、`<button onClick={onRemove}>` 之前）插入 ✨。将 `ExperienceItem` 函数签名追加一个 prop `index`（已有），然后修改头部行：

```tsx
<div className="flex justify-between items-center">
  <div className="flex items-center gap-0.5">
    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
    {index > 0 && <button onClick={() => onMove(-1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="上移">▲</button>}
    {index < total - 1 && <button onClick={() => onMove(1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="下移">▼</button>}
    <OptimizeButton section="experience" itemIndex={index} />
  </div>
  <button onClick={onRemove} className="text-xs text-red-500">删除</button>
</div>
```

（3）注意：`OptimizeButton` 的 `updateSection('experience', ...)` 会替换整个 experience 数组。应用 AI 结果后，`ExperienceItem` 的本地 `highlightsText` 不会受影响（AI 只改 `description` 字段），无需额外处理。

- [ ] **Step 4: ProjectEditor 每条 item 加 ✨**

（1）文件顶部，`import type { Project }` 之后追加：

```tsx
import OptimizeButton from '../ai/OptimizeButton';
```

（2）在 `ProjectItem` 组件的头部行（`{index < total - 1 && ...}` 下移按钮之后、`<button onClick={onRemove}>` 之前）插入 ✨：

```tsx
<div className="flex justify-between items-center">
  <div className="flex items-center gap-0.5">
    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
    {index > 0 && <button onClick={() => onMove(-1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="上移">▲</button>}
    {index < total - 1 && <button onClick={() => onMove(1)} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5" title="下移">▼</button>}
    <OptimizeButton section="projects" itemIndex={index} />
  </div>
  <button onClick={onRemove} className="text-xs text-red-500">删除</button>
</div>
```

（3）`OptimizeButton` 只改 `description`，`ProjectItem` 的本地 `techText`/`highlightsText` 不受影响。

- [ ] **Step 5: 编译验收**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 6: 手动验收**

启动前后端，验证：
1. 打开简历，摘要标题栏右侧有 ✨
2. 点 ✨ → 弹窗显示原文，输入指令 → 开始优化 → 右侧流式出现结果
3. 点「应用」→ 摘要内容更新；点「撤销」→ 无变化
4. 工作经历/项目经历每条都有 ✨，应用后只更新该条的 description

```bash
cd "C:\Users\admin\Desktop\简历系统" && npm run dev
```

- [ ] **Step 7: 提交**

```bash
git add client/src/components/ai/OptimizeButton.tsx client/src/components/editor/SummaryEditor.tsx client/src/components/editor/ExperienceEditor.tsx client/src/components/editor/ProjectEditor.tsx
git commit -m "feat: 分区块 AI 优化按钮与对比弹窗"
```

---

### Task 5: 前端 AI 助手侧边栏 + Editor 入口

**Files:**
- Create: `client/src/components/ai/AiChatPanel.tsx`
- Create: `client/src/components/ai/AIAssistant.tsx`
- Modify: `client/src/pages/Editor.tsx`（顶栏加 🤖 按钮 + 侧边栏状态）

**Interfaces:**
- Consumes: `api.aiChat`, `useAiStore`, `useStreaming`
- Produces:
  - `<AIAssistant open onClose />` — 侧边栏容器（含快捷指令 chip）
  - `<AiChatPanel />` — 对话面板（消息列表 + 输入框 + JD/素材文本区）
  - Editor 顶栏 🤖 按钮，点击打开侧边栏

- [ ] **Step 1: 创建 `client/src/components/ai/AiChatPanel.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useResumeStore } from '../../stores/useResumeStore';
import { useAiStore } from '../../stores/useAiStore';
import * as api from '../../api/client';
import type { AiChatMessage } from '../../types/resume';

interface Props {
  onSendStarted?: () => void;
}

export default function AiChatPanel({ onSendStarted }: Props) {
  const resume = useResumeStore((s) => s.resume);
  const { messages, addMessage, clearMessages } = useAiStore();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'chat' | 'jd' | 'material'>('chat');
  const [jd, setJd] = useState('');
  const [material, setMaterial] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, assistantText]);

  const send = async (text: string) => {
    if (!resume || !text.trim() || streaming) return;
    const userMsg: AiChatMessage = { role: 'user', content: text.trim() };
    addMessage(userMsg);
    setInput('');
    setStreaming(true);
    setAssistantText('');
    onSendStarted?.();
    api.aiChat(
      { resume, messages: [...messages, userMsg] },
      (t) => setAssistantText((prev) => prev + t),
      () => {
        const finalText = assistantTextRef.current;
        if (finalText.trim()) addMessage({ role: 'assistant', content: finalText.trim() });
        setStreaming(false);
      }
    );
  };

  // 用 ref 保存 assistantText 供 done 回调读取最新值
  const assistantTextRef = useRef('');
  assistantTextRef.current = assistantText;

  const handleJd = () => {
    if (!jd.trim()) return;
    send(`以下是我投递的目标岗位 JD，请帮我分析岗位要求并针对性优化简历内容（提示我应该重点突出哪些经历和技能）：\n\n${jd}`);
  };
  const handleMaterial = () => {
    if (!material.trim()) return;
    send(`以下是我补充的一些工作/项目素材，请帮我整合进简历对应区块，生成更完整专业的描述：\n\n${material}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 快捷指令 */}
      <div className="flex gap-1.5 px-3 pt-2 flex-wrap">
        <button onClick={() => setMode(mode === 'jd' ? 'chat' : 'jd')} className={`text-[11px] px-2 py-0.5 rounded-full ${mode === 'jd' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>📋 JD 定制</button>
        <button onClick={() => setMode(mode === 'material' ? 'chat' : 'material')} className={`text-[11px] px-2 py-0.5 rounded-full ${mode === 'material' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>📎 补充素材</button>
        <button onClick={() => setMode('chat')} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">✏️ 自由提问</button>
      </div>

      {/* JD/素材输入区 */}
      {mode === 'jd' && (
        <div className="px-3 pt-2">
          <textarea className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px]" placeholder="粘贴目标岗位 JD..." value={jd} onChange={(e) => setJd(e.target.value)} />
          <button onClick={handleJd} className="mt-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">开始 JD 定制</button>
        </div>
      )}
      {mode === 'material' && (
        <div className="px-3 pt-2">
          <textarea className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px]" placeholder="补充你的工作/项目素材..." value={material} onChange={(e) => setMaterial(e.target.value)} />
          <button onClick={handleMaterial} className="mt-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">整合素材</button>
        </div>
      )}

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && !streaming && (
          <p className="text-xs text-gray-400 text-center mt-6">我是你的 AI 简历顾问，可以帮你润色内容、分析岗位 JD、整合素材，或回答任何简历问题。</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-1.5 rounded-lg text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{m.content}</div>
          </div>
        ))}
        {streaming && assistantText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-3 py-1.5 rounded-lg text-sm whitespace-pre-wrap bg-gray-100 text-gray-800">{assistantText}<span className="inline-block w-1.5 h-3 bg-blue-500 align-middle ml-0.5 animate-pulse" /></div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-2 py-1.5 text-sm"
            placeholder="问我任何关于简历的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          />
          <button onClick={() => send(input)} disabled={streaming || !input.trim()} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">发送</button>
        </div>
        {messages.length > 0 && (
          <button onClick={clearMessages} className="mt-1.5 text-[11px] text-gray-400 hover:text-gray-600">清空对话</button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 `client/src/components/ai/AIAssistant.tsx`**

```tsx
import AiChatPanel from './AiChatPanel';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AIAssistant({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[380px] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h3 className="font-semibold text-gray-800">🤖 AI 简历助手</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <AiChatPanel />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Editor.tsx 加 🤖 入口**

在 `Editor.tsx` 中：
1. 顶部 import 追加：`import AIAssistant from '../components/ai/AIAssistant';`
2. state 追加：`const [showAi, setShowAi] = useState(false);`
3. 顶栏「版本历史」按钮旁加：

```tsx
<button onClick={() => setShowAi(true)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-300">🤖 AI 助手</button>
```

4. 在 `<VersionHistory>` 组件后加：

```tsx
<AIAssistant open={showAi} onClose={() => setShowAi(false)} />
```

- [ ] **Step 4: 编译验收**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 5: 手动验收**

启动前后端，验证：
1. 顶栏有 🤖 按钮，点击右侧滑出侧边栏
2. 自由提问「帮我分析这份简历」→ 流式回答
3. JD 定制：粘贴 JD → 发送 → 得到针对岗位的建议
4. 补充素材：粘贴素材 → 发送 → 得到整合后的描述
5. 清空对话按钮生效
6. 侧边栏可关闭

- [ ] **Step 6: 提交**

```bash
git add client/src/components/ai/AiChatPanel.tsx client/src/components/ai/AIAssistant.tsx client/src/pages/Editor.tsx
git commit -m "feat: AI 助手侧边栏与快捷指令"
```

---

### Task 6: 整体验收 + README 更新

**Files:**
- Modify: `README.md`（追加 AI 功能说明）
- Verify: 全量后端测试 + 前端构建

- [ ] **Step 1: 全量后端测试**

```bash
cd "C:\Users\admin\Desktop\简历系统\server" && npm test
```

Expected: 所有测试通过（Task 1/2 的 6 个测试）

- [ ] **Step 2: 前端生产构建**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npm run build
```

Expected: `tsc && vite build` 成功，产出 `dist/`

- [ ] **Step 3: 更新 README**

在 `README.md` 的「功能特性」区块追加：

```markdown
- 🤖 **AI 优化** — 接入 DeepSeek API：
  - **分区块润色**：个人摘要、工作经历、项目经历一键 AI 优化，对比后手动应用
  - **AI 助手**：侧边栏自由对话，支持岗位 JD 定制、补充素材整合、简历整体评估
  - **配置**：服务端 `server/.env` 填入 `DEEPSEEK_API_KEY` 即可启用
```

- [ ] **Step 4: 提交**

```bash
git add README.md
git commit -m "docs: 更新 README 补充 AI 优化功能"
```

---

## 自审

**1. Spec 覆盖：**
- 内容润色 ✓（Task 1 Prompt + Task 4 按钮）
- 简历整体评估 ✓（Task 2 `/api/ai/chat` + Task 5 助手「帮我分析」）
- 岗位 JD 定制 ✓（Task 5 `handleJd`）
- 补充素材整合 ✓（Task 5 `handleMaterial`）
- 自由对话指令 ✓（Task 5 自由提问）
- SSE 流式 ✓（Task 2 路由 + Task 3 `sseFetch`）
- .env 配置 ✓（Task 1）
- 错误处理（503/超时/中断）✓（Task 2 `handleStream` + Task 3 `AbortError` 分支）
- 安全（不自动写入）✓（Task 4 必须点「应用」）

**2. 占位符扫描：** 无。Task 4 Step 3/4 已给出 ExperienceItem/ProjectItem 的精确插入代码（头部行 `#index + 1` 处）和 import 语句。

**3. 类型一致性：**
- `buildOptimizeMessages({resume, section, itemIndex, instruction})` — Task 1 定义，Task 2 使用 ✓
- `streamChat(messages, {onDelta, signal})` — Task 1 定义，Task 2 使用 ✓
- `aiOptimize(req, onDelta, onDone)` — Task 3 定义，Task 4 使用 ✓
- `aiChat(req, onDelta, onDone)` — Task 3 定义，Task 5 使用 ✓
- `AiChatMessage` — Task 3 定义，Task 4/5 使用 ✓
- `OptimizeButton section` props 类型 `'summary' | 'experience' | 'projects'` — Task 4 定义 ✓
