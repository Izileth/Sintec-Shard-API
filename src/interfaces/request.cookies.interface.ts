import { Request } from 'express';

export interface RequestWithCookies extends Request {
  cookies: {
    refresh_token?: string;
  };
}