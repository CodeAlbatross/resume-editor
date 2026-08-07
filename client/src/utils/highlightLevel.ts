export type HighlightLevel = 'title' | 'sub' | 'item';

// 分级规则（与 EJS 模板中的规则必须完全一致，见 spec §4）：
// 主标题：以【 开头且含 】
// 子条目：前导缩进（空格或制表符）
// 普通：其他

export function getHighlightLevel(text: string): HighlightLevel {
  const t = text ?? '';
  if (/^【[^】]*】/.test(t)) return 'title';
  if (/^[ \t]+/.test(t)) return 'sub';
  return 'item';
}

export function stripHighlightPrefix(text: string): { level: HighlightLevel; text: string } {
  const t = text ?? '';
  const level = getHighlightLevel(t);
  if (level === 'title') {
    // 去掉首部【，并把 】 转为全角冒号（【板块一】Harness → 板块一：Harness）
    const inner = t.replace(/^【/, '').replace(/】/, '：');
    return { level, text: inner };
  }
  if (level === 'sub') {
    return { level, text: t.replace(/^[ \t]+/, '') };
  }
  return { level, text: t };
}

export function toTitle(text: string): string {
  const t = (text ?? '').replace(/^[ \t]+/, '');
  if (/^【[^】]*】/.test(t)) return t;
  return `【${t}】`;
}

export function toSub(text: string): string {
  const t = (text ?? '').trim();
  if (/^[ \t]+/.test(t)) return t;
  return `  ${t}`;
}

export function toItem(text: string): string {
  const t = (text ?? '').trim();
  // 去掉【】包裹：剥首【、剥第一个】（可能含正文）
  return t.replace(/^【/, '').replace(/】/, '');
}
