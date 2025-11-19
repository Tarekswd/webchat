import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) {}

  async signup(username: string, password: string) {
    const existing = await this.usersService.findByUsername(username);
    if (existing) {
      throw new BadRequestException('Username already in use');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(username, passwordHash, 'user');
    return this.signUser(user.id, user.username, user.role);
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.signUser(user.id, user.username, user.role);
  }

  private signUser(id: string, username: string, role: string) {
    const payload = { sub: id, username, role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
