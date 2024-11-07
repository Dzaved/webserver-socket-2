import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, FileText, Send, Download, Power, Upload, Lock, Settings } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  clientId: string;
  content: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
}

interface Client {
  id: string;
  ip: string;
  connectedAt: string;
  isSecure: boolean;
}

interface Log {
  id: string;
  type: "connection" | "message" | "error";
  content: string;
  timestamp: string;
  clientId?: string;
  headers?: Record<string, string>;
}

interface ServerConfig {
  wsEnabled: boolean;
  wssEnabled: boolean;
  wsPort: number;
  wssPort: number;
  privateKey: File | null;
  certificate: File | null;
}

export function WebSocketServerCompleteInterface() {
  const [isConnected, setIsConnected] = useState(false);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    wsEnabled: true,
    wssEnabled: false,
    wsPort: 8080,
    wssPort: 8443,
    privateKey: null,
    certificate: null,
  });
  const [activeTab, setActiveTab] = useState("chat");
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { connect, disconnect, send } = useWebSocket({
    url: `${serverConfig.wsEnabled ? 'ws' : 'wss'}://localhost:${serverConfig.wsEnabled ? serverConfig.wsPort : serverConfig.wssPort}`,
    onMessage: handleIncomingMessage,
  });

  function handleIncomingMessage(data: any) {
    if (data.type === 'client_connected') {
      handleClientConnected(data.client);
    } else if (data.type === 'client_disconnected') {
      handleClientDisconnected(data.clientId);
    } else if (data.type === 'message') {
      const newMessage: Message = {
        id: `msg-${Math.random().toString(36).substr(2, 9)}`,
        clientId: data.clientId,
        content: data.content,
        timestamp: new Date().toISOString(),
        direction: "incoming",
      };
      setMessages(prev => [...prev, newMessage]);
      addLog("message", `Received message from ${data.clientId}: ${data.content}`, data.clientId);
    }
  }

  function handleClientConnected(client: Client) {
    setClients(prev => [...prev, client]);
    addLog("connection", `New client connected: ${client.id}`, client.id);
  }

  function handleClientDisconnected(clientId: string) {
    setClients(prev => prev.filter(c => c.id !== clientId));
    addLog("connection", `Client disconnected: ${clientId}`, clientId);
    if (activeClientId === clientId) {
      setActiveClientId(null);
    }
  }

  function addLog(type: Log["type"], content: string, clientId?: string, headers?: Record<string, string>) {
    const newLog: Log = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date().toISOString(),
      clientId,
      headers,
    };
    setLogs(prev => [...prev, newLog]);
  }

  function handleConnect() {
    if (serverConfig.wssEnabled && (!serverConfig.privateKey || !serverConfig.certificate)) {
      toast({
        title: "Missing files",
        description: "Please upload both private key and certificate files for a secure connection",
        variant: "destructive",
      });
      return;
    }

    connect();
    setIsConnected(true);
    addLog("connection", `Server connected (WS: ${serverConfig.wsEnabled ? 'enabled' : 'disabled'}, WSS: ${serverConfig.wssEnabled ? 'enabled' : 'disabled'})`);
  }

  function handleDisconnect() {
    disconnect();
    setIsConnected(false);
    setClients([]);
    setActiveClientId(null);
    addLog("connection", "Server disconnected");
  }

  function handleSendMessage() {
    if (!newMessage.trim() || !activeClientId) return;

    const outgoingMessage: Message = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      clientId: activeClientId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      direction: "outgoing",
    };

    if (send({ type: 'message', clientId: activeClientId, content: newMessage.trim() })) {
      setMessages(prev => [...prev, outgoingMessage]);
      addLog("message", `Sent message to ${activeClientId}: ${outgoingMessage.content}`, activeClientId);
      setNewMessage("");
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, type: "privateKey" | "certificate") {
    const file = event.target.files?.[0];
    if (!file) return;

    setServerConfig(prev => ({
      ...prev,
      [type]: file
    }));

    toast({
      title: "File uploaded",
      description: `${type === "privateKey" ? "Private key" : "Certificate"} has been uploaded successfully`,
    });
  }

  function handleExportLogs() {
    const logsText = logs
      .map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.content}`)
      .join("\n");
    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "websocket-server-logs.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>WebSocket Server Interface</CardTitle>
          <CardDescription>Manage and monitor your WebSocket server</CardDescription>
        </div>
        <div className="flex space-x-2">
          {isConnected ? (
            <Button variant="destructive" onClick={handleDisconnect}>
              <Power className="w-4 h-4 mr-2" />
              Disconnect Server
            </Button>
          ) : (
            <Button onClick={handleConnect}>
              <Power className="w-4 h-4 mr-2" />
              Connect Server
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
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

          <TabsContent value="chat" className="space-y-4">
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
                        {client.id}
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
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Server Logs</CardTitle>
                <Button onClick={handleExportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {logs.map((log) => (
                    <div key={log.id} className="mb-4 p-2 border-b border-border">
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`text-sm font-medium ${
                            log.type === "error"
                              ? "text-destructive"
                              : log.type === "connection"
                              ? "text-green-500"
                              : "text-primary"
                          }`}
                        >
                          {log.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{log.content}</p>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Server Settings</CardTitle>
                <CardDescription>Configure your WebSocket server</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ws-enabled"
                    checked={serverConfig.wsEnabled}
                    onCheckedChange={(checked) =>
                      setServerConfig((prev) => ({ ...prev, wsEnabled: checked as boolean }))
                    }
                    disabled={isConnected}
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
                    disabled={isConnected}
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
                        setServerConfig((prev) => ({
                          ...prev,
                          wsPort: parseInt(e.target.value),
                        }))
                      }
                      disabled={isConnected || !serverConfig.wsEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wssPort">WSS Port</Label>
                    <Input
                      id="wssPort"
                      type="number"
                      value={serverConfig.wssPort}
                      onChange={(e) =>
                        setServerConfig((prev) => ({
                          ...prev,
                          wssPort: parseInt(e.target.value),
                        }))
                      }
                      disabled={isConnected || !serverConfig.wssEnabled}
                    />
                  </div>
                </div>

                {serverConfig.wssEnabled && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="privateKey">Private Key</Label>
                      <div className="relative">
                        <Input
                          id="privateKey"
                          type="file"
                          accept=".pem"
                          onChange={(e) => handleFileUpload(e, "privateKey")}
                          className="hidden"
                          disabled={isConnected}
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById("privateKey")?.click()}
                          disabled={isConnected}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {serverConfig.privateKey
                            ? serverConfig.privateKey.name
                            : "Upload Key"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificate">Certificate</Label>
                      <div className="relative">
                        <Input
                          id="certificate"
                          type="file"
                          accept=".pem"
                          onChange={(e) => handleFileUpload(e, "certificate")}
                          className="hidden"
                          disabled={isConnected}
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById("certificate")?.click()}
                          disabled={isConnected}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {serverConfig.certificate
                            ? serverConfig.certificate.name
                            : "Upload Certificate"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Server Status</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"} |
              {serverConfig.wsEnabled && ` WS Port: ${serverConfig.wsPort}`}
              {serverConfig.wsEnabled && serverConfig.wssEnabled && " |"}
              {serverConfig.wssEnabled && ` WSS Port: ${serverConfig.wssPort}`} |
              Clients: {clients.length}
            </p>
          </div>
          <Button variant="outline" onClick={() => setActiveTab("logs")}>
            View Full Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}