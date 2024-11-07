export interface Message {
  id: string;
  clientId: string;
  content: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
}

export interface Client {
  id: string;
  ip: string;
  connectedAt: string;
  isSecure: boolean;
}

export interface Log {
  id: string;
  type: "connection" | "message" | "error";
  content: string;
  timestamp: string;
  clientId?: string;
  headers?: Record<string, string>;
}

export interface ServerConfig {
  wsEnabled: boolean;
  wssEnabled: boolean;
  wsPort: number;
  wssPort: number;
  privateKey: File | null;
  certificate: File | null;
}