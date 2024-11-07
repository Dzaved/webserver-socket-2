import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Message } from "@/types";

interface ChatWindowProps {
  messages: Message[];
  activeClientId: string | null;
  onSendMessage: (message: string) => void;
}

export function ChatWindow({ messages, activeClientId, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
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
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={!activeClientId}
          />
          <Button onClick={handleSend} disabled={!activeClientId}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}