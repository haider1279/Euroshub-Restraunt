import { Request } from 'express';
import { JwtPayload } from '@euroshub/shared';

export * from '@euroshub/shared';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
