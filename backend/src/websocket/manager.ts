import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();

  initialize(server: http.Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      // Generate a unique client ID
      const clientId = Math.random().toString(36).substring(2, 15);
      this.clients.set(clientId, ws);
      console.log(`🔌 WebSocket client connected: ${clientId}`);

      // Send the client their ID
      ws.send(JSON.stringify({ type: 'connected', clientId }));

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          // Handle subscription to assignment updates
          if (message.type === 'subscribe' && message.assignmentId) {
            // Tag the connection with the assignment ID for targeted updates
            (ws as any).assignmentId = message.assignmentId;
          }
        } catch (err) {
          console.error('Invalid WebSocket message:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`🔌 WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.clients.delete(clientId);
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Broadcast a message to all clients subscribed to a specific assignment
   */
  notifyAssignment(assignmentId: string, data: object): void {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'assignment_update',
      assignmentId,
      ...data,
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Send to all clients or only those subscribed to this assignment
        const subscribedId = (client as any).assignmentId;
        if (!subscribedId || subscribedId === assignmentId) {
          client.send(message);
        }
      }
    });
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(data: object): void {
    if (!this.wss) return;

    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export const wsManager = new WebSocketManager();
