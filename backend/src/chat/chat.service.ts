import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>
  ) {}

  async saveMessage(params: { room: string; fromUserId: string; toUserId?: string; content: string }) {
    const msg = this.msgRepo.create({
      room: params.room,
      fromUserId: params.fromUserId,
      toUserId: params.toUserId ?? null,
      content: params.content
    });
    return this.msgRepo.save(msg);
  }

  async getRoomHistory(room: string, limit = 50) {
    return this.msgRepo.find({
      where: { room },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }
}
