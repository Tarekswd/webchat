import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessage } from './chat.types';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})
@UseGuards(WsJwtGuard)
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService
  ) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const user = (client.data as any).user;
    console.log('Client connected:', client.id, 'user:', user?.username);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string
  ) {
    client.join(room);
    const user = (client.data as any).user;

    this.server.to(room).emit('system', {
      content: `User ${user?.username ?? client.id} joined room ${room}`,
      time: new Date().toISOString()
    });
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string
  ) {
    client.leave(room);
    const user = (client.data as any).user;

    this.server.to(room).emit('system', {
      content: `User ${user?.username ?? client.id} left room ${room}`,
      time: new Date().toISOString()
    });
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; content: string; toUsername?: string }
  ) {
    const user = (client.data as any).user;

    let toUserId: string | undefined;
    if (payload.toUsername) {
      const target = await this.usersService.findByUsername(payload.toUsername);
      if (target) toUserId = target.id;
    }

    const saved = await this.chatService.saveMessage({
      room: payload.room,
      fromUserId: user.sub,
      toUserId,
      content: payload.content
    });

    const msg: ChatMessage = {
      room: saved.room,
      author: user.username,
      content: saved.content,
      time: saved.createdAt.toISOString()
    };

    this.server.to(saved.room).emit('message', msg);
  }

  @SubscribeMessage('history')
  async handleHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string
  ) {
    const docs = await this.chatService.getRoomHistory(room);
    const messages: ChatMessage[] = docs
      .map(doc => ({
        room: doc.room,
        author: doc.fromUser.username,
        content: doc.content,
        time: doc.createdAt.toISOString()
      }))
      .reverse();

    client.emit('history', messages);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string
  ) {
    const user = (client.data as any).user;
    if (!room || !user?.username) return;

    client.to(room).emit('typing', {
      author: user.username,
      time: new Date().toISOString()
    });
  }
}
