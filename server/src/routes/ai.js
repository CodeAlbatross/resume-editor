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
  // 吞掉已销毁连接的写错误，避免 ERR_STREAM_DESTROYED 崩溃
  res.on('error', () => {});
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  // 客户端断开或响应完成时中止底层请求并释放超时定时器
  // 注：用 res.on('close') 而非 req.on('close')——在 Node v24 中 req 的
  // 'close' 在请求体读完即触发，会过早 abort 流，导致 SSE 立即中断
  res.on('close', () => {
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
      if (res.writableEnded || res.destroyed) return;
      const message = e.name === 'AbortError' ? '请求超时，请重试' : (e.message || 'AI 服务错误');
      sendEvent(res, { type: 'error', message });
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
