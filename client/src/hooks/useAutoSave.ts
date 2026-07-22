import { useEffect, useRef } from 'react';
import { useResumeStore } from '../stores/useResumeStore';
import * as api from '../api/client';

export function useAutoSave(_interval = 180000) {
  // 自动保存已禁用（用户要求删除）
}
