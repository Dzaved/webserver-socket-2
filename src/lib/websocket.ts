import { toast } from "@/hooks/use-toast";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  
  constructor(
    private url: string,
    private onMessage: (data: any) => void,
    private onStatusChange: (connected: boolean) => void
  ) {}

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onStatusChange(true);
        toast({
          title: "Connected",
          description: `Connected to ${this.url}`,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error("Failed to parse message:", error);
          toast({
            title: "Message Error",
            description: "Failed to process incoming message",
            variant: "destructive",
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.handleError(error);
      };

      this.ws.onclose = () => {
        this.onStatusChange(false);
        this.handleDisconnect();
      };

    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    const errorMessage = error instanceof Error ? error.message : "Connection failed";
    toast({
      title: "WebSocket Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }

  private handleDisconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    toast({
      title: "Disconnected",
      description: "WebSocket connection closed",
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.onStatusChange(false);
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error("Failed to send message:", error);
        toast({
          title: "Send Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return false;
      }
    }
    return false;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}