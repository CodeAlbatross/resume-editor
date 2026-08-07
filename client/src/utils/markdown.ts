export interface MdBlock {
  type: 'para' | 'list';
  content?: string;      // para: 段落内容（含内联标记）
  items?: string[];      // list: 列表项数组
}

// 内联标记替换：**加粗** → <strong>、*斜体* → <em>、`代码` → <code>
// 注意：先处理 ** 再处理 *，避免 **x** 被 * 提前匹配
function inlineHtml(text: string): string {
  let s = text;
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

export function renderMarkdown(text: string): string {
  const t = text ?? '';
  // 判断是否全是列表行
  const lines = t.split('\n');
  if (lines.every((l) => l.trim().startsWith('- '))) {
    return lines.filter((l) => l.trim().length > 0)
      .map((l) => `<li>${inlineHtml(l.replace(/^\s*-\s+/, '').trim())}</li>`)
      .join('');
  }
  return inlineHtml(t);
}

export function mdToLines(text: string): MdBlock[] {
  const t = text ?? '';
  const rawLines = t.split('\n');
  const blocks: MdBlock[] = [];
  let currentList: string[] | null = null;

  for (const raw of rawLines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('- ')) {
      if (!currentList) {
        currentList = [];
        blocks.push({ type: 'list', items: currentList });
      }
      currentList.push(inlineHtml(line.replace(/^\-\s+/, '').trim()));
    } else {
      currentList = null;
      blocks.push({ type: 'para', content: inlineHtml(line) });
    }
  }
  return blocks;
}
