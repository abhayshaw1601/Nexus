import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import User from '../models/User';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Auth Middleware: Token invalid');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('Auth Middleware: User not found for ID', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('Auth Middleware: Authenticated User:', user.email, 'Role:', user.role);
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};
