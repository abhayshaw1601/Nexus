import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import User from '../models/User';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET || 'your_fallback_secret';
    if (!token) {
      console.log('Auth Middleware: No token found in Authorization header');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log(`Auth Middleware: Verifying token with secret (len: ${secret.length}). Token starts with: ${token.substring(0, 15)}...`);
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Auth Middleware: Token verification failed (invalid or expired). Token:', token.substring(0, 10) + '...');
      return res.status(401).json({ message: 'Auth Failed: Invalid or expired token' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('Auth Middleware: User not found in DB for ID:', decoded.id);
      return res.status(401).json({ message: 'Auth Failed: User not found in database' });
    }

    console.log('Auth Middleware: Authenticated User:', user.email, 'Role:', user.role);
    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error('Auth Middleware Exception:', error.message);
    res.status(401).json({ message: 'Token is not valid', error: error.message });
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
