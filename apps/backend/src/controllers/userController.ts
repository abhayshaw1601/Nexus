import { Request, Response } from 'express';
import User from '../models/User';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Super admins can see everyone
    if (user.role === 'SUPER_ADMIN') {
      const users = await User.find({}, '-password');
      return res.json(users);
    }

    const ngoId = user.ngoId;
    if (!ngoId) {
      return res.status(403).json({ message: 'Organization context missing: User not associated with an NGO' });
    }

    const users = await User.find({ ngoId }, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
