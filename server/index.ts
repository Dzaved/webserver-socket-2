import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

const wsServer = new WebSocketServer({ port: 8080 });

wsServer.on('connection', (ws) => {
  const clientId = `client-${Math.random().toString(36).substr(2, 9)}`;
  
  // Send client connected event
  wsServer.clients.forEach((client) => {
    if (client !== ws) {
      client.send(JSON.stringify({
        type: 'client_connected',
        client: {
          id: clientId,
          connectedAt: new Date().toISOString()
        }
      }));
    }
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Broadcast message to all clients
      wsServer.clients.forEach((client) => {
        if (client !== ws) {
          client.send(JSON.stringify({
            type: 'message',
            clientId,
            content: data.content
          }));
        }
      });
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  ws.on('close', () => {
    // Notify other clients about disconnection
    wsServer.clients.forEach((client) => {
      if (client !== ws) {
        client.send(JSON.stringify({
          type: 'client_disconnected',
          clientId
        }));
      }
    });
  });
});

console.log('WebSocket server is running on port 8080');