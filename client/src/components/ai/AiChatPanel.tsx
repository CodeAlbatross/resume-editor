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
