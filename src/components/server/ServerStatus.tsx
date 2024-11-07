import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ServerStatusProps {
  serverConfig: {
    wsEnabled: boolean;
    wssEnabled: boolean;
    wsPort: number;
    wssPort: number;
  };
  clientCount: number;
  messageCount: number;
  onViewLogs: () => void;
}

export function ServerStatus({
  serverConfig,
  clientCount,
  messageCount,
  onViewLogs,
}: ServerStatusProps) {
  return (
    <CardContent>
      <Separator className="my-4" />
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Server Status</h3>
          <p className="text-sm text-muted-foreground">
            Connected |
            {serverConfig.wsEnabled && ` WS Port: ${serverConfig.wsPort}`}
            {serverConfig.wsEnabled && serverConfig.wssEnabled && ' | '}
            {serverConfig.wssEnabled && ` WSS Port: ${serverConfig.wssPort}`} |
            Clients: {clientCount} | Messages: {messageCount}
          </p>
        </div>
        <Button variant="outline" onClick={onViewLogs}>
          View Full Logs
        </Button>
      </div>
    </CardContent>
  );
}