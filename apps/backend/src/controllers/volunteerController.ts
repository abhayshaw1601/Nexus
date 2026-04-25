import { Request, Response } from 'express';
import User from '../models/User';
import { z } from 'zod';

const submitDetailsSchema = z.object({
  specialization: z.string().min(2),
  experienceBio: z.string().min(5),
});

export const submitDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Validate body
    const validatedData = submitDetailsSchema.parse(req.body);
    
    // Check for uploaded file
    if (!req.file) {
      return res.status(400).json({ message: 'ID Proof is required' });
    }
    
    const idProofUrl = req.file.path; // Cloudinary returns the URL in req.file.path
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'VOLUNTEER') {
      return res.status(403).json({ message: 'Only volunteers can submit these details' });
    }
    
    user.specialization = validatedData.specialization;
    user.experienceBio = validatedData.experienceBio;
    user.idProofUrl = idProofUrl;
    user.status = 'pending';
    
    await user.save();
    
    res.json({
      message: 'Details submitted successfully',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status,
        specialization: user.specialization,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error });
  }
};
