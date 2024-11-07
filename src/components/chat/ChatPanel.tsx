import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";

export function ChatPanel() {
  const { clients, messages, addMessage } = useWebSocket();
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() && activeClientId) {
      addMessage({
        id: `msg-${Date.now()}`,
        clientId: activeClientId,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        direction: "outgoing",
      });
      setNewMessage("");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Connected Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {clients.map((client) => (
              <Button
                key={client.id}
                variant={activeClientId === client.id ? "default" : "ghost"}
                className="w-full justify-start mb-2"
                onClick={() => setActiveClientId(client.id)}
              >
                {client.id} ({client.isSecure ? 'WSS' : 'WS'})
              </Button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{activeClientId ? `Chat with ${activeClientId}` : "Select a client"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] mb-4">
            {messages
              .filter((msg) => msg.clientId === activeClientId)
              .map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-2 p-2 rounded-lg ${
                    msg.direction === "incoming"
                      ? "bg-muted text-left"
                      : "bg-primary text-primary-foreground text-right"
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </ScrollArea>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={!activeClientId}
            />
            <Button onClick={handleSendMessage} disabled={!activeClientId}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}