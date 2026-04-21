import { DurableObject } from "cloudflare:workers";
import { drizzle } from 'drizzle-orm/d1';
import { messages, conversations } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export class LiveSession extends DurableObject {
  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    
    // Enable WebSocket Hibernation
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
    try {
      const data = JSON.parse(msg as string);
      
      if (data.type === 'chat_message') {
        const db = drizzle((this.env as any).DB);
        
        const inserted = await db.insert(messages).values({
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content || '',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType
        }).returning();

        await db.update(conversations)
          .set({ lastMessageAt: sql`(strftime('%s', 'now'))` })
          .where(eq(conversations.id, data.conversationId));

        const broadcastPayload = JSON.stringify({
          type: 'chat_message',
          message: inserted[0]
        });

        // Broadcast to all active hibernation connections
        const sockets = this.ctx.getWebSockets();
        for (const socket of sockets) {
          if (socket !== ws) { 
            socket.send(broadcastPayload);
          }
        }
      }
    } catch (err) {
      console.error('WebSocket execution failed:', err);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, _wasClean: boolean) {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error('WebSocket encountered an error:', error);
    ws.close(1011, 'Internal Error');
  }
}
