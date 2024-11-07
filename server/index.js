import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const clientInfo = {
    id: clientId,
    connectedAt: new Date().toISOString(),
    ws
  };

  clients.set(clientId, clientInfo);

  // Notify all clients about the new connection
  broadcastToAll({
    type: 'client_connected',
    client: {
      id: clientId,
      connectedAt: clientInfo.connectedAt
    }
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'message') {
        broadcastToAll({
          type: 'message',
          clientId: clientId,
          content: data.content,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    broadcastToAll({
      type: 'client_disconnected',
      clientId
    });
  });

  // Send current clients list to the new client
  const clientsList = Array.from(clients.values()).map(client => ({
    id: client.id,
    connectedAt: client.connectedAt
  }));

  ws.send(JSON.stringify({
    type: 'clients_list',
    clients: clientsList
  }));
});

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    client.ws.send(messageStr);
  });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});