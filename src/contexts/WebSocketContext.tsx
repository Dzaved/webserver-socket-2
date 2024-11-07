import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

interface WebSocketContextType {
  isConnected: boolean;
  connect: (config: ServerConfig) => void;
  disconnect: () => void;
  sendMessage: (message: string, clientId: string) => void;
  clients: Client[];
  messages: Message[];
  logs: Log[];
}

interface ServerConfig {
  wsEnabled: boolean;
  wssEnabled: boolean;
  wsPort: number;
  wssPort: number;
  privateKey: File | null;
  certificate: File | null;
}

interface Client {
  id: string;
  ip: string;
  connectedAt: string;
  isSecure: boolean;
}

interface Message {
  id: string;
  clientId: string;
  content: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
}

interface Log {
  id: string;
  type: "connection" | "message" | "error";
  content: string;
  timestamp: string;
  clientId?: string;
  headers?: Record<string, string>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [wssConnection, setWssConnection] = useState<WebSocket | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  const addLog = useCallback((type: Log["type"], content: string, clientId?: string, headers?: Record<string, string>) => {
    const newLog: Log = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date().toISOString(),
      clientId,
      headers,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const connect = useCallback(async (config: ServerConfig) => {
    try {
      if (config.wssEnabled && (!config.privateKey || !config.certificate)) {
        throw new Error('Private key and certificate are required for secure connection');
      }

      if (!config.wsEnabled && !config.wssEnabled) {
        throw new Error('At least one connection type must be enabled');
      }

      // Regular WebSocket connection
      if (config.wsEnabled) {
        const ws = new WebSocket(`ws://localhost:${config.wsPort}`);
        setupWebSocket(ws, false);
        setWsConnection(ws);
      }

      // Secure WebSocket connection
      if (config.wssEnabled) {
        const wss = new WebSocket(`wss://localhost:${config.wssPort}`);
        setupWebSocket(wss, true);
        setWssConnection(wss);
      }

      setIsConnected(true);
      addLog("connection", `Server connected (WS: ${config.wsEnabled ? 'enabled' : 'disabled'}, WSS: ${config.wssEnabled ? 'enabled' : 'disabled'})`);
      
      toast({
        title: "Connected",
        description: "WebSocket server connection established",
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to establish connection",
        variant: "destructive",
      });
    }
  }, [addLog]);

  const setupWebSocket = (ws: WebSocket, isSecure: boolean) => {
    ws.onopen = () => {
      console.log(`${isSecure ? 'WSS' : 'WS'} connection established`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data, isSecure);
      } catch (error) {
        console.error('Failed to parse message:', error);
        addLog("error", `Failed to parse message: ${error}`);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addLog("error", `WebSocket error: ${error.toString()}`);
    };

    ws.onclose = () => {
      console.log(`${isSecure ? 'WSS' : 'WS'} connection closed`);
      if (isSecure) {
        setWssConnection(null);
      } else {
        setWsConnection(null);
      }
      
      if (!wsConnection && !wssConnection) {
        setIsConnected(false);
        setClients([]);
        addLog("connection", "All connections closed");
      }
    };
  };

  const handleWebSocketMessage = (data: any, isSecure: boolean) => {
    switch (data.type) {
      case 'client_connected':
        const newClient: Client = {
          ...data.client,
          isSecure,
        };
        setClients(prev => [...prev, newClient]);
        addLog("connection", `Client connected: ${data.client.id}`, data.client.id);
        break;

      case 'client_disconnected':
        setClients(prev => prev.filter(client => client.id !== data.clientId));
        addLog("connection", `Client disconnected: ${data.clientId}`, data.clientId);
        break;

      case 'message':
        const newMessage: Message = {
          id: `msg-${Math.random().toString(36).substr(2, 9)}`,
          clientId: data.clientId,
          content: data.content,
          timestamp: new Date().toISOString(),
          direction: "incoming",
        };
        setMessages(prev => [...prev, newMessage]);
        addLog("message", `Received: ${data.content}`, data.clientId);
        break;
    }
  };

  const disconnect = useCallback(() => {
    if (wsConnection) {
      wsConnection.close();
    }
    if (wssConnection) {
      wssConnection.close();
    }
    setIsConnected(false);
    setClients([]);
    setMessages([]);
    addLog("connection", "Disconnected from server");
    toast({
      title: "Disconnected",
      description: "WebSocket server connection closed",
    });
  }, [wsConnection, wssConnection, addLog]);

  const sendMessage = useCallback((message: string, clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      toast({
        title: "Error",
        description: "Client not found",
        variant: "destructive",
      });
      return;
    }

    const connection = client.isSecure ? wssConnection : wsConnection;
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      toast({
        title: "Error",
        description: "No active connection",
        variant: "destructive",
      });
      return;
    }

    const messageData = {
      type: 'message',
      clientId,
      content: message,
    };

    connection.send(JSON.stringify(messageData));
    
    const newMessage: Message = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      content: message,
      timestamp: new Date().toISOString(),
      direction: "outgoing",
    };
    
    setMessages(prev => [...prev, newMessage]);
    addLog("message", `Sent: ${message}`, clientId);
  }, [wsConnection, wssConnection, clients, addLog]);

  const value = {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    clients,
    messages,
    logs,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}