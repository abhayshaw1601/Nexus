import { Request, Response } from 'express';
import User from '../models/User';
import NGO from '../models/NGO';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['NGO_ADMIN', 'FIELD_WORKER', 'VOLUNTEER']).optional(),
  ngoJoinCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { ngoJoinCode, ...userData } = validatedData;
    
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let ngoId = undefined;
    if (ngoJoinCode) {
      if (userData.role === 'NGO_ADMIN') {
        return res.status(400).json({ message: 'NGO Admins cannot use join codes. They must establish their own organization.' });
      }
      const ngo = await NGO.findOne({ joinCode: ngoJoinCode });
      if (!ngo) {
        return res.status(400).json({ message: 'Invalid NGO Join Code' });
      }
      ngoId = ngo._id;
    }
    
    const hashedPassword = await hashPassword(userData.password);
    
    const user = new User({
      ...userData,
      password: hashedPassword,
      ngoId
    });
    
    await user.save();
    
    const token = generateToken(user._id.toString(), user.role, user.ngoId?.toString());
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        specialization: user.specialization,
        ngoId: user.ngoId
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const user = await User.findOne({ email: validatedData.email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await comparePassword(validatedData.password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user._id.toString(), user.role, user.ngoId?.toString());
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        specialization: user.specialization,
        ngoId: user.ngoId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error });
  }
};
