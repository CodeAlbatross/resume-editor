# AI 优化功能设计文档

> **日期**: 2026-08-06
> **状态**: 已获用户批准（分节评审通过）

## 1. 目标

为简历编辑器新增 AI 优化能力，让用户可以借助大语言模型提升简历质量。核心价值：不擅长写简历的用户也能产出专业、量化、匹配岗位的简历内容。

## 2. 功能范围

用户确认的五大能力：

| # | 能力 | 说明 |
|---|---|---|
| 1 | 内容润色优化 | AI 重写个人摘要、工作经历、项目描述等文字，动词开头、量化成果、避免空话 |
| 2 | 简历整体评估 | AI 通读整份简历，输出总分 + 各模块评分 + 改进建议 + 亮点总结 |
| 3 | 岗位 JD 定制 | 用户粘贴目标岗位 JD，AI 分析后针对性调整简历关键词和重点 |
| 4 | 补充素材整合 | 用户手动补充工作内容/项目细节，AI 糅合进简历生成完整描述 |
| 5 | 自由对话指令 | AI 助手里自由打字提问/下指令（如「把第三段项目经历写得更量化」） |

## 3. 技术选型

| 项 | 选择 | 理由 |
|---|---|---|
| AI 服务商 | DeepSeek API | 国内可直连、中文能力强、价格低 |
| 模型 | `deepseek-chat` | 对话/润色场景默认模型 |
| 传输方式 | SSE 流式输出 | 打字机效果，避免长等待 |
| API Key | 服务端 `.env` 配置 | 前端不接触 key，安全 |
| 后端调用 | 原生 `fetch` 调 DeepSeek REST API | 不引入 SDK 依赖 |
| 前端 SSE | 原生 `fetch` + `ReadableStream` | 无新增依赖 |

## 4. 架构

```
┌───────────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│      前端 (React)      │       │      Express 后端     │       │   DeepSeek API   │
│                       │  SSE  │                      │       │                 │
│  ✨ 分区块优化按钮       │ ────▶ │  /api/ai/optimize    │ ────▶ │  deepseek-chat   │
│  🤖 AI 助手侧边栏      │       │  /api/ai/chat        │       │  (stream: true)  │
│  useStreaming hook    │ ◀──── │  aiService.js        │ ◀──── │                 │
│                       │ 流式  │  (读 .env API Key)    │       │                 │
└───────────────────────┘       └──────────────────────┘       └─────────────────┘
```

两条通道、一套后端逻辑：`/api/ai/optimize`（分区块）与 `/api/ai/chat`（助手对话），都用 SSE 流式透传 DeepSeek 输出。

## 5. 文件清单

### 新增（服务端）

```
server/.env                          # DEEPSEEK_API_KEY 等配置
server/src/routes/ai.js              # /api/ai/optimize + /api/ai/chat 两个 SSE 路由
server/src/services/aiService.js     # DeepSeek 调用封装 + Prompt 模板
```

### 修改（服务端）

```
server/src/index.js                  # 挂载 aiRouter
server/.gitignore                    # 忽略 .env
```

### 新增（前端）

```
client/src/components/ai/OptimizeButton.tsx   # ✨ 分区块按钮 + 前后对比弹窗
client/src/components/ai/AIAssistant.tsx      # 🤖 侧边栏 AI 助手
client/src/components/ai/AiChatPanel.tsx      # 助手对话面板
client/src/hooks/useStreaming.ts              # SSE 读取 hook
client/src/stores/useAiStore.ts               # AI 状态（消息历史、loading）
```

### 修改（前端）

```
client/src/api/client.ts             # 追加 optimizeSection() / aiChat()
client/src/pages/Editor.tsx          # 顶栏加 🤖 按钮
client/src/types/resume.ts           # 追加 AI 相关类型（如 AiChatMessage）
```

**✨ 按钮覆盖范围**：只加在**有文本润色目标**的内容区块上：

| 编辑器组件 | 区块 | 是否加 ✨ | 润色目标字段 |
|---|---|---|---|
| `SummaryEditor.tsx` | 个人摘要 | ✅ 标题栏 | `summary.content` |
| `ExperienceEditor.tsx` | 工作经历 | ✅ 每条 item 内 | 该项 `description` |
| `ProjectEditor.tsx` | 项目经历 | ✅ 每条 item 内 | 该项 `description` |
| `EducationEditor.tsx` | 教育背景 | ❌ 结构化数据（学校/学位/日期），无文本可润色 | — |
| `SkillsEditor.tsx` | 技能专长 | ❌ 结构化数据（分类/技能项），无文本可润色 | — |
| `PersonalInfoEditor.tsx` | 个人信息 | ❌ 纯联系信息 | — |
| `CertificateEditor.tsx` | 证书 | ❌ | — |
| `LanguageEditor.tsx` | 语言 | ❌ | — |
| `CustomEditor.tsx` | 自定义模块 | ❌ 内容用户自控 | — |

**优化一律针对单个文本目标**：AI 返回纯文本，前端写入对应字段。不做「整块优化」和结构化数据改写（无文本目标、JSON 往返不可靠）。个人摘要只有标题栏一个 ✨；工作经历/项目经历每条 item 内各有一个小 ✨。

## 6. 后端设计

### 6.1 路由（routes/ai.js）

**`POST /api/ai/optimize`（SSE 流式）**

请求体：

```json
{
  "resume": { "sections": {...} },
  "section": "summary",           // summary | experience | projects | education | skills
  "itemIndex": 0,                 // 列表项下标；-1 或省略 = 整块
  "instruction": "写得更量化一些"
}
```

**`POST /api/ai/chat`（SSE 流式）**

请求体：

```json
{
  "resume": { "sections": {...} },
  "messages": [{"role": "user", "content": "帮我分析这份简历"}]
}
```

SSE 事件格式（两个接口共用）：

```
data: {"type":"delta","text":"..."}     // 每个 token 块
data: {"type":"done","result":{...}}     // 结束，附带结构化结果
data: {"type":"error","message":"..."}   // 出错
```

### 6.2 aiService.js 职责

- `buildOptimizePrompt(section, itemIndex, instruction, resume)` — 组装润色 prompt
- `buildChatMessages(resume, messages)` — 组装对话 prompt（简历上下文 + 历史）
- `streamChat(messages, onDelta, signal)` — 调 DeepSeek REST API，流式透传
- `isConfigured()` — 检查 API Key 是否配置

### 6.3 Prompt 模板

| 场景 | 系统 Prompt 要点 |
|---|---|
| 润色 | 角色=资深 HR 简历顾问；只改内容不动结构；动词开头、量化成果、避免空话；返回纯文本 |
| 评估 | 角色=资深 HR；输出：总分 + 各模块评分 + 3-5 条具体改进建议 + 亮点总结 |
| 助手对话 | 角色=简历顾问；可访问简历上下文；回答用户任何问题，涉及简历时引用具体区块 |

### 6.4 配置项（server/.env）

```
DEEPSEEK_API_KEY=sk-xxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

服务端启动时读取；未配置 key 时 `/api/ai/*` 返回 503 `{ error: 'AI 未配置' }`。

### 6.5 依赖新增

- 服务端：**无新增依赖**（Node ≥20.12 内置 `process.loadEnvFile()` 读 .env；`fetch` 和 `node:test` 为 Node 内置。目标环境为 Node 24）
- 前端：无

## 7. 前端设计

### 7.1 分区块 ✨ 按钮（OptimizeButton.tsx）

- **位置**：有文本润色目标的区块上（覆盖范围见第 5 节表格）
- **列表区块（工作经历/项目经历）**：每条 item 内有一个小 ✨ 按钮，对应 `itemIndex`（该条 `description` 为润色目标）
- **点击流程**：
  1. 弹输入框（可选），用户写附加指令
  2. 点「开始优化」→ 调 `/api/ai/optimize`，SSE 流式渲染
  3. 弹窗显示上下对比：原文（灰）在上，AI 结果（高亮）在下，流式逐字更新
  4. 底部按钮：**「应用」**（写入简历）+ **「撤销」**（不改动关闭）
- **应用时的写入逻辑**：个人摘要 → `updateSection('summary', { content: result })`；工作经历第 i 条 → 把该条 `description` 替换为 `result`；项目经历同理

### 7.2 AI 助手侧边栏（AIAssistant.tsx + AiChatPanel.tsx）

- **入口**：编辑器右上角 🤖 按钮，右侧滑出侧边栏
- **面板**：顶部标题+关闭；中部滚动消息列表（流式打字机）；底部输入框 + 3 个快捷指令 chip：
  - 📋 *粘贴 JD 定制*（展开 JD 文本框）
  - 📎 *补充素材*（展开素材文本框）
  - ✏️ *自由提问*
- **上下文**：每次请求自动附带当前简历全文

### 7.3 useStreaming hook

封装 `fetch` + `ReadableStream`，逐行解析 SSE `data:` 事件，回调 `onDelta`；支持 `AbortController` 取消。

### 7.4 useAiStore 状态

```
messages: ChatMessage[]
optimizing: boolean
streamingSection: string | null
```

## 8. 错误处理

| 场景 | 处理 |
|---|---|
| 未配置 `DEEPSEEK_API_KEY` | 前端两入口显示「未配置 AI」并禁用；后端 503 |
| DeepSeek 超时 | 后端 `AbortController` 60s 超时，SSE 发错误事件 |
| API 错误（余额不足等） | 透传错误消息给前端 |
| SSE 连接中断 | 前端捕获，显示「连接中断」+ 重试按钮 |
| 用户取消 | 前端中止，不写入任何数据 |

**安全原则**：优化结果**绝不自动写入**，必须用户手动点「应用」。

## 9. 测试

- 后端单元（`node:test`，Node 内置）：mock DeepSeek 响应，验证 Prompt 组装与 SSE 透传
- 后端路由：无 key 返回 503；SSE 事件格式正确
- 前端手动验收：
  - ① 未配置 key 时按钮禁用
  - ② 分区块优化对比正确
  - ③ 应用/撤销不破坏数据
  - ④ 助手对话流式渲染
  - ⑤ JD 定制流程

## 10. 部署说明

- `.env` 不入 git（已加入 .gitignore）
- 部署到阿里云等服务器时，在服务端创建 `.env` 填入真实 key 即可
- `DEEPSEEK_BASE_URL` 可覆盖以切换供应商，无需改代码
