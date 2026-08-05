import { useCallback, useRef, useState } from 'react';

interface StreamOptions<TReq> {
  request: TReq;
  onDelta: (text: string) => void;
  start?: () => void;
  done?: () => void;
}

export function useStreaming() {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  const stream = useCallback(<TReq,>(opts: StreamOptions<TReq> & { run: (req: TReq, onDelta: (t: string) => void, onDone: () => void) => { stop: () => void } }) => {
    setError('');
    setStreaming(true);
    opts.start?.();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setStreaming(false);
      opts.done?.();
      stopRef.current = null;
    };
    const handle = opts.run(opts.request, opts.onDelta, finish);
    stopRef.current = () => { handle.stop(); };
  }, []);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setStreaming(false);
  }, []);

  return { streaming, error, stream, stop };
}
