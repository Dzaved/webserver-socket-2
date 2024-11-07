import { useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { ChatPanel } from './chat/ChatPanel';
import { LogPanel } from './logs/LogPanel';
import { SettingsPanel } from './settings/SettingsPanel';
import { ServerStatus } from './server/ServerStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Power, Settings } from 'lucide-react';

interface WebSocketServerInterfaceProps {
  isConnected: boolean;
  serverConfig: {
    wsEnabled: boolean;
    wssEnabled: boolean;
    wsPort: number;
    wssPort: number;
  };
  onServerConfigChange: (config: any) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WebSocketServerInterface({
  isConnected,
  serverConfig,
  onServerConfigChange,
  onConnect,
  onDisconnect,
}: WebSocketServerInterfaceProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const { clients, messages } = useWebSocket();

  if (!isConnected) {
    return (
      <SettingsPanel
        serverConfig={serverConfig}
        onServerConfigChange={onServerConfigChange}
        onConnect={onConnect}
        isConnected={false}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>WebSocket Server Interface</CardTitle>
          <CardDescription>Manage and monitor your WebSocket server</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setActiveTab('settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="destructive" onClick={onDisconnect}>
            <Power className="w-4 h-4 mr-2" />
            Disconnect Server
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ChatPanel />
          </TabsContent>

          <TabsContent value="logs">
            <LogPanel />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel
              serverConfig={serverConfig}
              onServerConfigChange={onServerConfigChange}
              onConnect={onConnect}
              isConnected={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <ServerStatus
        serverConfig={serverConfig}
        clientCount={clients.length}
        messageCount={messages.length}
        onViewLogs={() => setActiveTab('logs')}
      />
    </Card>
  );
}