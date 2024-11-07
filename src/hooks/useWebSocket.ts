import { useState, useEffect, useCallback } from 'react';
import { wsClient } from '@/lib/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = wsClient.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback(async (url: string) => {
    try {
      await wsClient.connect(url);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  const send = useCallback((message: any) => {
    wsClient.send(message);
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    send
  };
}