import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useToast } from "@/hooks/use-toast";

export function LogPanel() {
  const { logs } = useWebSocket();
  const { toast } = useToast();

  const handleExportLogs = () => {
    const logsText = logs
      .map((log) => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.content}`)
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
    
    toast({
      title: "Logs Exported",
      description: "Server logs have been exported successfully",
    });
  };

  return (
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
              {log.headers && (
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">
                    HTTP Headers
                  </summary>
                  <pre className="text-xs mt-1 p-2 bg-muted rounded">
                    {JSON.stringify(log.headers, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}