import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class AuthDto {
  username!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: AuthDto) {
    const { username, password } = body;
    return this.authService.signup(username.trim(), password);
  }

  @Post('login')
  async login(@Body() body: AuthDto) {
    const { username, password } = body;
    return this.authService.login(username.trim(), password);
  }
}
