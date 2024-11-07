import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Power, Upload } from "lucide-react";

interface SettingsPanelProps {
  serverConfig: {
    wsEnabled: boolean;
    wssEnabled: boolean;
    wsPort: number;
    wssPort: number;
  };
  onServerConfigChange: (config: any) => void;
  onConnect: () => void;
  isConnected: boolean;
}

export function SettingsPanel({
  serverConfig,
  onServerConfigChange,
  onConnect,
  isConnected,
}: SettingsPanelProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>WebSocket Server Control</CardTitle>
        <CardDescription>Configure and manage your WebSocket server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="ws-enabled"
            checked={serverConfig.wsEnabled}
            onCheckedChange={(checked) =>
              onServerConfigChange({ ...serverConfig, wsEnabled: checked })
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
              onServerConfigChange({ ...serverConfig, wssEnabled: checked })
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
                onServerConfigChange({
                  ...serverConfig,
                  wsPort: parseInt(e.target.value),
                })
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
                onServerConfigChange({
                  ...serverConfig,
                  wssPort: parseInt(e.target.value),
                })
              }
              disabled={isConnected || !serverConfig.wssEnabled}
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={onConnect}
          disabled={(!serverConfig.wsEnabled && !serverConfig.wssEnabled) || isConnected}
        >
          <Power className="w-4 h-4 mr-2" />
          Connect Server
        </Button>
      </CardContent>
    </Card>
  );
}