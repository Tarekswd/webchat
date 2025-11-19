import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket>();

    const token =
      client.handshake.auth?.token ||
      (typeof client.handshake.headers['authorization'] === 'string'
        ? client.handshake.headers['authorization'].split(' ')[1]
        : undefined);

    return {
      headers: {
        authorization: token ? `Bearer ${token}` : undefined
      }
    } as any;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket>();

    if (user) {
      (client.data as any).user = user;
    }

    return user;
  }
}
