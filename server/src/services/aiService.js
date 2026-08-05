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
