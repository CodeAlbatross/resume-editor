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

test('isConfigured 在有 key 时返回 true', async () => {
  setEnv();
  const { isConfigured } = await import('../src/services/aiService.js');
  assert.equal(isConfigured(), true);
  resetEnv();
});

test('isConfigured 在无 key 时返回 false', async () => {
  resetEnv();
  delete process.env.DEEPSEEK_API_KEY;
  const { isConfigured } = await import('../src/services/aiService.js');
  assert.equal(isConfigured(), false);
  resetEnv();
});

test('buildOptimizeMessages 组装包含原文和指令', async () => {
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

test('buildChatMessages 附带简历上下文', async () => {
  setEnv();
  const { buildChatMessages } = await import('../src/services/aiService.js');
  const resume = { name: '张三', sections: { summary: { content: '测试' } } };
  const messages = buildChatMessages({ resume, messages: [{ role: 'user', content: '帮我分析' }] });
  assert.equal(messages.length, 2); // system + 用户消息
  assert.match(messages[0].content, /张三/);
  assert.equal(messages[1].role, 'user');
  resetEnv();
});
