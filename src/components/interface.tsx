import { useState, useEffect } from 'react';
import { WebSocketClient } from '@/lib/websocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, FileText, Send, Download, Power, Upload, Lock, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

interface Props {
  client: WebSocketClient | null;
  isConnected: boolean;
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (type: string, data: any) => void;
}

export function WebSocketServerCompleteInterface({ 
  client, 
  isConnected, 
  connect, 
  disconnect, 
  sendMessage 
}: Props) {
  const [serverConfig, setServerConfig] = useState({
    wsEnabled: true,
    wssEnabled: false,
    wsPort: 8080,
    wssPort: 8443,
    privateKey: null as File | null,
    certificate: null as File | null,
  });

  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (client) {
      client.onMessage('chat', (data) => {
        setMessages((prev) => [...prev, data]);
      });
    }
  }, [client]);

  const handleConnect = async () => {
    const protocol = serverConfig.wssEnabled ? 'wss' : 'ws';
    const port = serverConfig.wssEnabled ? serverConfig.wssPort : serverConfig.wsPort;
    await connect(`${protocol}://localhost:${port}`);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      sendMessage('chat', { content: newMessage.trim() });
      setNewMessage('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'privateKey' | 'certificate') => {
    const file = event.target.files?.[0];
    if (file) {
      setServerConfig((prev) => ({
        ...prev,
        [type]: file,
      }));
      toast({
        title: 'File uploaded',
        description: `${type === 'privateKey' ? 'Private key' : 'Certificate'} has been uploaded successfully`,
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>WebSocket Server Interface</CardTitle>
        <CardDescription>Manage and monitor your WebSocket server</CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ws-enabled"
                checked={serverConfig.wsEnabled}
                onCheckedChange={(checked) =>
                  setServerConfig((prev) => ({ ...prev, wsEnabled: checked as boolean }))
                }
              />
              <Label htmlFor="ws-enabled">Enable WebSocket (WS)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="wss-enabled"
                checked={serverConfig.wssEnabled}
                onCheckedChange={(checked) =>
                  setServerConfig((prev) => ({ ...prev, wssEnabled: checked as boolean }))
                }
              />
              <Label htmlFor="wss-enabled">Enable Secure WebSocket (WSS)</Label>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="wsPort">WS Port</Label>
                <Input
                  id="wsPort"
                  type="number"
                  value={serverConfig.wsPort}
                  onChange={(e) =>
                    setServerConfig((prev) => ({ ...prev, wsPort: parseInt(e.target.value) }))
                  }
                  disabled={!serverConfig.wsEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wssPort">WSS Port</Label>
                <Input
                  id="wssPort"
                  type="number"
                  value={serverConfig.wssPort}
                  onChange={(e) =>
                    setServerConfig((prev) => ({ ...prev, wssPort: parseInt(e.target.value) }))
                  }
                  disabled={!serverConfig.wssEnabled}
                />
              </div>
            </div>

            {serverConfig.wssEnabled && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key</Label>
                  <Input
                    id="privateKey"
                    type="file"
                    accept=".pem"
                    onChange={(e) => handleFileUpload(e, 'privateKey')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate">Certificate</Label>
                  <Input
                    id="certificate"
                    type="file"
                    accept=".pem"
                    onChange={(e) => handleFileUpload(e, 'certificate')}
                  />
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleConnect}>
              <Power className="w-4 h-4 mr-2" />
              Connect Server
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="logs">
                <FileText className="w-4 h-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat">
              <div className="space-y-4">
                <ScrollArea className="h-[400px] p-4 border rounded-md">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 rounded-lg bg-muted"
                    >
                      <p>{msg.content}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </ScrollArea>
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <ScrollArea className="h-[400px] p-4 border rounded-md">
                {/* Logs content */}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <Button variant="destructive" onClick={disconnect}>
                  <Power className="w-4 h-4 mr-2" />
                  Disconnect Server
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}