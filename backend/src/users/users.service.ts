import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>
  ) {}

  async findByUsername(username: string) {
    return this.usersRepo.findOne({ where: { username } });
  }

  async createUser(username: string, passwordHash: string, role: UserRole = 'user') {
    const user = this.usersRepo.create({ username, passwordHash, role });
    return this.usersRepo.save(user);
  }

  async findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }
}
