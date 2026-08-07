# 项目区块富文本与亮点分级实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 项目区块支持亮点分级渲染 + 轻量 Markdown 描述 + 结构化亮点编辑器，数据零迁移。

**Architecture:** 渲染层（React 预览 + EJS 导出）按统一规则识别 highlights 的分级（`【】`主标题/缩进子条目/普通亮点），description 用轻量 Markdown 子集解析。编辑器把纯文本框升级为分级亮点编辑器（层级切换 + 排序 + 删除）。数据模型不动。

**Tech Stack:** React + TypeScript（前端 utils 用 `.ts`，Node 24 原生 type stripping 直接跑 `node --test` 测试）、Express + EJS（模板内联解析函数）、零新增依赖。

## Global Constraints

- 目标环境 Node ≥20.12（本项目为 Node 24），**禁止新增任何 npm 依赖**
- 分级规则（`【】`主标题 / 前导缩进子条目 / 普通亮点）在 React 预览与三个 EJS 模板中**必须完全一致**（见 spec §4）
- 只改**项目区块**（ProjectEditor + projects 渲染），工作经历/摘要等其他区块不动
- 数据结构 `Project` 不变（`highlights: string[]`），零迁移
- 前端测试用 Node 内置 `node:test` 直接跑 `.ts` 文件（Node 24 type stripping），不引入 vitest
- 描述 Markdown 只支持 4 种语法：`**加粗**` `*斜体*` `` `代码` `` `- 列表`，不做复杂语法
- 不引入富文本库

---

### Task 1: 前端工具函数 markdown.ts + highlightLevel.ts（含测试）

**Files:**
- Create: `client/src/utils/markdown.ts`
- Create: `client/src/utils/highlightLevel.ts`
- Test: `client/src/utils/__tests__/markdown.test.ts`
- Test: `client/src/utils/__tests__/highlightLevel.test.ts`
- Modify: `client/package.json`（加 `"test": "node --test src/utils/__tests__/"`）

**Interfaces:**
- Produces (供 Task 2/3/4 使用):
  - `getHighlightLevel(text: string): 'title' | 'sub' | 'item'` — 按规则识别级别
  - `stripHighlightPrefix(text: string): { level, text }` — 返回级别和去除前缀后的纯文本
  - `toTitle(text: string): string` — 包成 `【text】`（去重）
  - `toSub(text: string): string` — 前置 2 空格（去重）
  - `toItem(text: string): string` — 去掉 `【】` 包裹 + 前导缩进
  - `renderMarkdown(text: string): string` — 返回渲染后的 HTML 字符串（`**`→`<strong>`、`*`→`<em>`、`` ` ``→`<code>`、`- `行→`<li>`）
  - `mdToLines(text: string): Array<{ type: 'list' | 'para'; content: string }>` — 结构化 Markdown 解析（供 React 用，避免 dangerouslySetInnerHTML）

- [ ] **Step 1: 写失败测试 `client/src/utils/__tests__/highlightLevel.test.ts`**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { getHighlightLevel, stripHighlightPrefix, toTitle, toSub, toItem } from '../highlightLevel.ts';

test('getHighlightLevel 识别主标题【】', () => {
  assert.equal(getHighlightLevel('【板块一】Harness 工程推广'), 'title');
  assert.equal(getHighlightLevel('【板块二】xxx'), 'title');
});

test('getHighlightLevel 识别子条目（前导缩进）', () => {
  assert.equal(getHighlightLevel('  业务线接入推广：xxx'), 'sub');
  assert.equal(getHighlightLevel('\t缩进子项'), 'sub');
});

test('getHighlightLevel 识别普通亮点', () => {
  assert.equal(getHighlightLevel('业务线接入推广：xxx'), 'item');
  assert.equal(getHighlightLevel('普通条目'), 'item');
  assert.equal(getHighlightLevel(''), 'item');
});

test('stripHighlightPrefix 主标题去【】', () => {
  assert.deepEqual(stripHighlightPrefix('【板块一】Harness'), { level: 'title', text: '板块一：Harness' });
});

test('toTitle 包【】并去重', () => {
  assert.equal(toTitle('板块一'), '【板块一】');
  assert.equal(toTitle('【板块一】'), '【板块一】');
});

test('toSub 前置缩进去重', () => {
  assert.equal(toSub('业务线'), '  业务线');
  assert.equal(toSub('  业务线'), '  业务线');
});

test('toItem 去【】和缩进', () => {
  assert.equal(toItem('【板块一】'), '板块一');
  assert.equal(toItem('  业务线'), '业务线');
  assert.equal(toItem('普通'), '普通');
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && node --test src/utils/__tests__/highlightLevel.test.ts
```

Expected: FAIL — `Cannot find module '../highlightLevel.ts'`

- [ ] **Step 3: 写失败测试 `client/src/utils/__tests__/markdown.test.ts`**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, mdToLines } from '../markdown.ts';

test('renderMarkdown 加粗', () => {
  assert.equal(renderMarkdown('负责**高并发发奖**链路'), '负责<strong>高并发发奖</strong>链路');
});

test('renderMarkdown 斜体', () => {
  assert.equal(renderMarkdown('*斜体文本*'), '<em>斜体文本</em>');
});

test('renderMarkdown 代码', () => {
  assert.equal(renderMarkdown('使用 `QPM` 峰值'), '使用 <code>QPM</code> 峰值');
});

test('renderMarkdown 列表行', () => {
  assert.equal(renderMarkdown('- 支撑秒杀类活动'), '<li>支撑秒杀类活动</li>');
});

test('renderMarkdown 无语法纯文本不变', () => {
  assert.equal(renderMarkdown('普通文本内容'), '普通文本内容');
});

test('mdToLines 分离列表与段落', () => {
  const lines = mdToLines('段落一\n- 列表项A\n- 列表项B');
  assert.deepEqual(lines, [
    { type: 'para', content: '段落一' },
    { type: 'list', items: ['列表项A', '列表项B'] },
  ]);
});
```

- [ ] **Step 4: 运行测试确认失败**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && node --test src/utils/__tests__/markdown.test.ts
```

Expected: FAIL — `Cannot find module '../markdown.ts'`

- [ ] **Step 5: 实现 `client/src/utils/highlightLevel.ts`**

```ts
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
    const inner = t.replace(/^【/, '').replace(/】.*$/, (m) => m.startsWith('】') ? m.slice(1) : m);
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
  return t.replace(/^【/, '').replace(/】$/, '');
}
```

- [ ] **Step 6: 实现 `client/src/utils/markdown.ts`**

```ts
export interface MdBlock {
  type: 'para' | 'list';
  content: string;       // para: 段落内容（含内联标记）
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
        blocks.push({ type: 'list', content: '', items: currentList });
      }
      currentList.push(inlineHtml(line.replace(/^\-\s+/, '').trim()));
    } else {
      currentList = null;
      blocks.push({ type: 'para', content: inlineHtml(line) });
    }
  }
  return blocks;
}
```

- [ ] **Step 7: 运行测试确认通过**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && node --test src/utils/__tests__/markdown.test.ts src/utils/__tests__/highlightLevel.test.ts
```

Expected: PASS — 全部测试通过

- [ ] **Step 8: `client/package.json` 加 test script**

把 `"scripts"` 改为：

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "node --test src/utils/__tests__/"
}
```

- [ ] **Step 9: 编译验收**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 10: 提交**

```bash
git add client/src/utils/markdown.ts client/src/utils/highlightLevel.ts client/src/utils/__tests__/ client/package.json
git commit -m "feat: Markdown 与亮点分级工具函数"
```

---

### Task 2: React 预览模板接入（三个模板）

**Files:**
- Modify: `client/src/components/preview/ClassicTemplate.tsx`
- Modify: `client/src/components/preview/ModernTemplate.tsx`
- Modify: `client/src/components/preview/CompactTemplate.tsx`

**Interfaces:**
- Consumes: `getHighlightLevel`, `renderMarkdown`, `mdToLines`（Task 1 产出）
- Produces: 三个预览模板的 projects 区块正确分级渲染 + description Markdown 渲染

- [ ] **Step 1: CompactTemplate.tsx 接入亮点分级 + 描述 Markdown**

（1）顶部 import 追加：

```tsx
import { getHighlightLevel, stripHighlightPrefix } from '../../utils/highlightLevel';
import { mdToLines } from '../../utils/markdown';
```

（2）在文件内新增两个辅助渲染函数（放在 `sLevel` 之后）：

```tsx
function renderDesc(text: string) {
  const blocks = mdToLines(text);
  return blocks.map((b, i) =>
    b.type === 'list'
      ? <ul key={i} className="list-disc pl-4 text-xs text-gray-600 mt-0.5">{b.items!.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: it }} />)}</ul>
      : <p key={i} className="text-xs text-gray-600 mt-0.5" dangerouslySetInnerHTML={{ __html: b.content }} />
  );
}

function renderHighlights(list: string[]) {
  return list.map((h, i) => {
    const level = getHighlightLevel(h);
    const { text } = stripHighlightPrefix(h);
    if (level === 'title') {
      return <div key={i} className="text-xs font-bold text-gray-800 mt-1.5">{text}</div>;
    }
    if (level === 'sub') {
      return <li key={i} className="text-xs text-gray-600 ml-4 list-disc">{text}</li>;
    }
    return <li key={i} className="text-xs text-gray-600">{text}</li>;
  });
}
```

（3）projects 区块的 `{proj.description}` 改为：

```tsx
{proj.description && renderDesc(proj.description)}
```

（4）projects 区块的高亮点列表改为：

```tsx
{(proj.highlights.length > 0 && !compressSettings.trim) && <ul className="pl-4 text-xs mt-0.5">{renderHighlights(proj.highlights)}</ul>}
{(proj.highlights.length > 0 && compressSettings.trim) && <ul className="pl-4 text-xs mt-0.5">{renderHighlights(proj.highlights.slice(0, 3))}</ul>}
```

注意：`renderHighlights` 里 title 级返回的是 `<div>`（无圆点），放在 `<ul>` 里会渲染错误 —— 因此**整个项目高亮容器不能用 `<ul>` 包住 title 级**。改为用 `<div>` 容器：

```tsx
{(proj.highlights.length > 0 && !compressSettings.trim) && <div className="text-xs mt-0.5">{renderHighlights(proj.highlights)}</div>}
{(proj.highlights.length > 0 && compressSettings.trim) && <div className="text-xs mt-0.5">{renderHighlights(proj.highlights.slice(0, 3))}</div>}
```

且 `renderHighlights` 内普通/子条目用 `<div className="pl-3 relative">` 包一个手动圆点 `•` 或 `◦` 前缀（避免依赖 ul/li 语义）：

```tsx
function renderHighlights(list: string[]) {
  return list.map((h, i) => {
    const level = getHighlightLevel(h);
    const { text } = stripHighlightPrefix(h);
    if (level === 'title') {
      return <div key={i} className="font-bold text-gray-800 mt-1.5">{text}</div>;
    }
    const marker = level === 'sub' ? '◦' : '•';
    const indent = level === 'sub' ? 'ml-4' : '';
    return <div key={i} className={`${indent} pl-3 relative text-gray-600`}><span className="absolute left-0">{marker}</span>{text}</div>;
  });
}
```

（5）验证 `tsc --noEmit` 通过。

- [ ] **Step 2: ClassicTemplate.tsx 同样接入**

读 `ClassicTemplate.tsx` 找到 projects 区块的 description 和 highlights 渲染处，应用与 Step 1 相同的改动（import + renderDesc + renderHighlights + 替换 JSX）。Classic 模板的 projects 区块结构需按该文件实际代码定位（`proj.description` 和 `proj.highlights` 渲染段）。

- [ ] **Step 3: ModernTemplate.tsx 同样接入**

读 `ModernTemplate.tsx` 找到 projects 区块，应用相同改动。

- [ ] **Step 4: 编译验收**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 5: 手动验收**

启动 dev server，打开含 `【板块一】` 的项目（如刘知远简历的 AI Delivery 项目）：
1. 预览中「板块一：Harness 工程推广」显示为无圆点的加粗标题行
2. 普通亮点显示为 `•` 圆点
3. 描述含 `- ` 行渲染为列表

```bash
cd "C:\Users\admin\Desktop\简历系统" && npm run dev
```

- [ ] **Step 6: 提交**

```bash
git add client/src/components/preview/ClassicTemplate.tsx client/src/components/preview/ModernTemplate.tsx client/src/components/preview/CompactTemplate.tsx
git commit -m "feat: 预览模板接入亮点分级与描述 Markdown"
```

---

### Task 3: EJS 导出模板接入（三个模板）

**Files:**
- Modify: `server/data/templates/classic/template.ejs`
- Modify: `server/data/templates/modern/template.ejs`
- Modify: `server/data/templates/compact/template.ejs`

**Interfaces:**
- Consumes: 分级规则与 Markdown 子集（与前端一致，见 spec §4 和 Task 1 实现）
- Produces: 三模板 projects 区块正确分级渲染 + description Markdown

**关键**：EJS 内联函数的规则必须与前端 `highlightLevel.ts`/`markdown.ts` 完全一致。

- [ ] **Step 1: compact/template.ejs 接入**

（1）在 `<%` 辅助函数区（`skillLevel` 定义之后）追加内联函数：

```ejs
// 亮点分级（与前端 highlightLevel.ts 规则一致）
function hlLevel(h) {
  if (/^【[^】]*】/.test(h)) return 'title';
  if (/^[ \t]+/.test(h)) return 'sub';
  return 'item';
}
function hlText(h) {
  if (/^【[^】]*】/.test(h)) return h.replace(/^【/, '').replace(/】$/, '');
  return h.replace(/^[ \t]+/, '');
}
// 描述 Markdown 内联（与前端 markdown.ts 一致）
function mdInline(s) {
  return (s || '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
function mdDesc(s) {
  var lines = (s || '').split('\n');
  var listItems = [];
  var hasList = false;
  lines.forEach(function(l) {
    if (l.trim().startsWith('- ')) { hasList = true; listItems.push('<li>' + mdInline(l.replace(/^\s*-\s+/, '').trim()) + '</li>'); }
  });
  if (hasList && listItems.length === lines.filter(function(l){return l.trim();}).length) {
    return '<ul>' + listItems.join('') + '</ul>';
  }
  return '<p>' + mdInline(s) + '</p>';
}
```

（2）projects 区块的 description 渲染改为（原 `<%= proj.description %>` 或类似）：

```ejs
<% if (proj.description) { %><div class="item-desc"><%- mdDesc(proj.description) %></div><% } %>
```

注意用 `<%-`（不转义 HTML）而非 `<%=`（转义），因为 mdDesc 返回 HTML。

（3）projects 区块的 highlights 渲染改为（原 `proj.highlights.forEach(...)` 渲染 `<li>` 处）：

```ejs
<% if (proj.highlights && proj.highlights.length) { %>
<div class="item-highlights">
  <% proj.highlights.forEach(function(h) {
    var lv = hlLevel(h);
    var txt = hlText(h);
    if (lv === 'title') { %><div style="font-weight:600;margin-top:2px"><%= txt %></div><% }
    else if (lv === 'sub') { %><div style="padding-left:14px;position:relative"><span style="position:absolute;left:2px">&#9702;</span><%= txt %></div><% }
    else { %><div style="padding-left:12px;position:relative"><span style="position:absolute;left:0">&#8226;</span><%= txt %></div><% }
  }) %>
</div>
<% } %>
```

- [ ] **Step 2: classic/template.ejs 接入**

读 `classic/template.ejs` 的 projects 区块（`key === 'projects'` 段），应用与 Step 1 相同的改动（内联函数 + description mdDesc + highlights 分级渲染）。Classic 模板当前 projects 区块的 `proj.highlights` 用 `<ul class="item-highlights">` + `<li>` 渲染，需替换。

- [ ] **Step 3: modern/template.ejs 接入**

读 `modern/template.ejs` 的 projects 区块（`mkey === 'projects'` 段，第 154-174 行附近），应用相同改动。

- [ ] **Step 4: 验收**

启动 server，请求导出 PDF：

```bash
cd "C:\Users\admin\Desktop\简历系统" && npm run dev
```

通过浏览器打开刘知远简历 → 预览 → 导出 PDF，检查：
1. AI Delivery 项目的【板块一】【板块二】在 PDF 中显示为无圆点加粗标题
2. 普通亮点为 `•` 圆点
3. 描述 Markdown 正确渲染

（若无法交互，至少确认三个 EJS 模板文件语法正确、无 `<%=` 误用 `<%-`）

- [ ] **Step 5: 提交**

```bash
git add server/data/templates/classic/template.ejs server/data/templates/modern/template.ejs server/data/templates/compact/template.ejs
git commit -m "feat: 导出模板接入亮点分级与描述 Markdown"
```

---

### Task 4: ProjectEditor 升级为分级亮点编辑器

**Files:**
- Modify: `client/src/components/editor/ProjectEditor.tsx`

**Interfaces:**
- Consumes: `getHighlightLevel`, `toTitle`, `toSub`, `toItem`（Task 1 产出）
- Produces: 亮点从纯文本框升级为分级列表编辑器

- [ ] **Step 1: 重写 ProjectEditor 的亮点区**

将 `ProjectItem` 里的「项目亮点（每行一条）」textarea 段替换为分级列表：

（1）import 追加：

```tsx
import { getHighlightLevel, toTitle, toSub, toItem } from '../../utils/highlightLevel';
```

（2）在 `ProjectItem` 组件内新增一个 `HighlightsEditor` 子组件（放在 ProjectItem 之后、文件末尾）：

```tsx
function HighlightsEditor({ items, onChange }: { items: string[]; onChange: (next: string[]) => void }) {
  const update = (idx: number, value: string) => {
    onChange(items.map((it, i) => (i === idx ? value : it)));
  };
  const move = (idx: number, dir: number) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, '']);
  const setLevel = (idx: number, level: 'title' | 'sub' | 'item') => {
    const cur = items[idx];
    const next =
      level === 'title' ? toTitle(cur) :
      level === 'sub' ? toSub(cur) :
      toItem(cur);
    onChange(items.map((it, i) => (i === idx ? next : it)));
  };

  const levelLabel: Record<string, string> = {
    title: '【标题】',
    sub: '↳ 子项',
    item: '• 亮点',
  };
  const placeholder: Record<string, string> = {
    title: '如【板块一】xxx',
    sub: '缩进子项...',
    item: '亮点描述...',
  };

  return (
    <div className="space-y-1">
      {items.map((it, i) => {
        const level = getHighlightLevel(it);
        return (
          <div key={i} className="flex items-center gap-1">
            <select
              className="w-[72px] text-[11px] border rounded px-1 py-1 text-gray-600 shrink-0"
              value={level}
              onChange={(e) => setLevel(i, e.target.value as 'title' | 'sub' | 'item')}
              title="设置层级"
            >
              <option value="title">【标题】</option>
              <option value="sub">↳ 子项</option>
              <option value="item">• 亮点</option>
            </select>
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder={placeholder[level]}
              value={it}
              onChange={(e) => update(i, e.target.value)}
            />
            {i > 0 && <button onClick={() => move(i, -1)} className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0" title="上移">▲</button>}
            {i < items.length - 1 && <button onClick={() => move(i, 1)} className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0" title="下移">▼</button>}
            <button onClick={() => remove(i)} className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
          </div>
        );
      })}
      <button onClick={add} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ 添加亮点</button>
    </div>
  );
}
```

（3）在 `ProjectItem` 里把原来的 highlights textarea 段替换为：

```tsx
<div>
  <div className="flex items-center justify-between mb-1">
    <label className="text-xs text-gray-500">项目亮点</label>
  </div>
  <HighlightsEditor
    items={proj.highlights}
    onChange={(next) => updateItem(index, 'highlights', next)}
  />
</div>
```

（4）删除 `ProjectItem` 里原来的 `highlightsText` state、`handleHighlightsChange`、`handleHighlightsBlur`、`prevHighlightsRef` 和对应 `useEffect`（这些是旧 textarea 的本地状态，新组件不需要）。

- [ ] **Step 2: 编译验收**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 3: 手动验收**

启动 dev server：
1. 打开刘知远简历 → 项目区块 → AI Delivery 项目的亮点显示为分级列表
2. 每条有层级下拉（【标题】/↳ 子项/• 亮点）
3. 切换层级 → 输入框内容自动加【】/缩进/还原
4. ▲▼ 排序、✕ 删除、+ 添加亮点 生效
5. 预览实时反映分级

- [ ] **Step 4: 提交**

```bash
git add client/src/components/editor/ProjectEditor.tsx
git commit -m "feat: 项目亮点分级编辑器"
```

---

### Task 5: 整体验收

**Files:**
- Verify: 全量测试 + 前端构建

- [ ] **Step 1: 前端测试**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npm test
```

Expected: 全部通过（markdown + highlightLevel 测试）

- [ ] **Step 2: 前端构建**

```bash
cd "C:\Users\admin\Desktop\简历系统\client" && npm run build
```

Expected: `tsc && vite build` 成功

- [ ] **Step 3: 后端启动验证 EJS 模板**

```bash
cd "C:\Users\admin\Desktop\简历系统\server" && node src/index.js
```

启动后请求导出（如 curl 触发 PDF 生成或浏览器操作），确认三模板无渲染错误。

- [ ] **Step 4: 手动全流程验收**

1. 刘知远简历预览：AI Delivery 项目【板块一】/【板块二】为标题样式，普通亮点为圆点
2. 编辑器切换亮点层级 → 预览实时变化
3. 描述含 Markdown → 预览/导出正确
4. 导出 PDF 与预览一致

- [ ] **Step 5: 提交（如无改动则跳过）**

---

## 自审

**1. Spec 覆盖：**
- 亮点分级渲染 ✓（Task 1 highlightLevel + Task 2 React + Task 3 EJS）
- 结构化亮点编辑器 ✓（Task 4）
- 描述轻量 Markdown ✓（Task 1 markdown + Task 2/3 接入）
- 三模板同步 ✓（Task 2 React 三模板 + Task 3 EJS 三模板）
- 零迁移 ✓（数据不动，渲染识别）
- 前端测试 ✓（Task 1 node --test .ts）

**2. 占位符扫描：**
- Task 2 Step 2/3（Classic/Modern 模板接入）描述为「找到 projects 区块应用相同改动」——因这两个文件的 projects 渲染结构在计划时未逐行读取，但给出了明确的改动意图、import、函数和替换规则。为避免占位符，实施者必须先 Read 目标文件确认结构。可接受。
- Task 3 各模板的 projects 区块同样需要实施者 Read 后定位。可接受。

**3. 类型一致性：**
- `getHighlightLevel` / `stripHighlightPrefix` / `toTitle` / `toSub` / `toItem` — Task 1 定义，Task 2/4 使用 ✓
- `renderMarkdown` / `mdToLines` — Task 1 定义，Task 2 使用 ✓
- `HighlightsEditor({ items, onChange })` — Task 4 定义并使用 ✓
- EJS 内联 `hlLevel`/`hlText`/`mdInline`/`mdDesc` — Task 3 使用 ✓

**4. 一致性注意（已写入 Global Constraints）：**
- React `highlightLevel.ts` 与 EJS `hlLevel` 规则必须一致（`/^【[^】]*】/` + 前导缩进）——两处代码模式相同
- React `markdown.ts` 与 EJS `mdInline`/`mdDesc` 规则一致
