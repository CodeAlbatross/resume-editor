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
