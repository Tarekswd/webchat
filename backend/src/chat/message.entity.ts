import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  room!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'fromUserId' })
  fromUser!: User;

  @Column()
  fromUserId!: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'toUserId' })
  toUser?: User | null;

  @Column({ nullable: true })
  toUserId?: string | null;

  @Column()
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
