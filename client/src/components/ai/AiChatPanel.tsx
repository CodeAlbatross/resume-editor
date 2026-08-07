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
  // ref 累积最新流式文本，供 done 回调读取。onDelta 与 onDone 可能在同一同步循环内背靠背触发
  // （server 端 delta 与 done 的两次 write 紧挨、被合并进同一 chunk；错误路径更是直接背靠背），
  // 此时 state/渲染尚未更新，必须用 ref 才能保证 done 读到完整内容（含最后一段 / 错误后缀）。
  const assistantTextRef = useRef('');
  // 记录本次会话是否出错。同样用 ref：错误路径 onDelta 与 onDone 同步背靠背，state 读不到最新值
  const failedRef = useRef(false);
  // 保存当前流的 stop 句柄，组件卸载时中止请求，避免 done 继续提交历史、重开后并发
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, assistantText]);

  // 组件卸载时中止未完成的 AI 流
  useEffect(() => () => stopRef.current?.(), []);

  const send = async (text: string) => {
    if (!resume || !text.trim() || streaming) return;
    const userMsg: AiChatMessage = { role: 'user', content: text.trim() };
    addMessage(userMsg);
    setInput('');
    setStreaming(true);
    setAssistantText('');
    assistantTextRef.current = '';
    failedRef.current = false;
    onSendStarted?.();
    const handle = api.aiChat(
      { resume, messages: [...messages, userMsg] },
      (t) => {
        // 直接在 ref 上累积，保证 done 读到的永远是最新（含同步触发的最后一段 / 错误后缀）
        assistantTextRef.current += t;
        if (t.includes('[错误]')) failedRef.current = true;
        setAssistantText(assistantTextRef.current);
      },
      () => {
        const finalText = assistantTextRef.current;
        if (finalText.trim()) {
          // 失败路径（failedRef.current 为 true）：onDelta 已把 '[错误] xxx' 完整写进 ref，随本条消息
          // 一起进入历史且内容自带 [错误] 标记，用户可见，无需额外 UI 提示；成功路径同样正常提交。
          addMessage({ role: 'assistant', content: finalText.trim() });
        }
        setStreaming(false); // 失败同样恢复发送按钮可用
        stopRef.current = null; // 流结束清除 stop 句柄，避免误中止后续请求
      }
    );
    stopRef.current = () => handle.stop();
  };

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
