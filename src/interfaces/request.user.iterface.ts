import { Request } from 'express';
import { User } from 'generated/prisma';

export interface RequestWithUser extends Request {
    user?: User;
}