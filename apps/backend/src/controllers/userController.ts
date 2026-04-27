import { Request, Response } from 'express';
import User from '../models/User';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user?.ngoId;
    if (!ngoId) return res.status(403).json({ message: 'Organization context missing' });

    const users = await User.find({ ngoId }, '-password'); // exclude password
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
