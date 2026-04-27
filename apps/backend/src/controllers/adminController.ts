import { Request, Response } from 'express';
import User from '../models/User';

export const getPendingVolunteers = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user?.ngoId;
    if (!ngoId) return res.status(403).json({ message: 'Organization context missing' });

    const volunteers = await User.find({ role: 'VOLUNTEER', status: 'pending', ngoId })
      .select('-password');
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateVolunteerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const user = await User.findById(id);
    if (!user || user.role !== 'VOLUNTEER') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    
    user.status = status;
    if (status === 'approved') {
      user.isVerified = true;
    }
    
    await user.save();
    
    // Here we can trigger socket.io notification if needed
    if ((req as any).io) {
      (req as any).io.to(user._id.toString()).emit('status_updated', { status });
    }
    
    res.json({ message: `Volunteer ${status} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
