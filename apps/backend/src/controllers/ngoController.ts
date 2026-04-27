import { Request, Response } from 'express';
import Survey from '../models/Survey';
import NGO from '../models/NGO';
import crypto from 'crypto';

export const registerNGO = async (req: Request, res: Response) => {
  try {
    const { name, description, coordinates, contactEmail, website } = req.body;
    const adminId = (req as any).user.id;

    // Check if user already has an NGO
    const existingNGO = await NGO.findOne({ adminId });
    if (existingNGO) {
      return res.status(400).json({ message: 'You have already established an NGO.' });
    }

    // Generate unique 6-character join code
    const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const ngo = new NGO({
      name,
      description,
      joinCode,
      adminId,
      location: {
        type: 'Point',
        coordinates // [lng, lat]
      },
      contactEmail,
      website
    });

    await ngo.save();

    // Update admin user with the new ngoId
    const User = (await import('../models/User')).default;
    await User.findByIdAndUpdate(adminId, { ngoId: ngo._id, role: 'NGO_ADMIN' });

    res.status(201).json(ngo);
  } catch (error) {
    res.status(500).json({ message: 'Error registering NGO', error });
  }
};

export const getMyNGO = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user.ngoId;
    if (!ngoId) return res.status(404).json({ message: 'No NGO associated with this user' });

    const [ngo, memberCount, taskCount] = await Promise.all([
      NGO.findById(ngoId),
      (await import('../models/User')).default.countDocuments({ ngoId }),
      (await import('../models/Task')).default.countDocuments({ ngoId })
    ]);

    res.status(200).json({
      ...ngo?.toObject(),
      stats: {
        members: memberCount,
        tasks: taskCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching NGO details', error });
  }
};

export const updateNGO = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user.ngoId;
    if (!ngoId) return res.status(404).json({ message: 'No NGO associated with this user' });

    const { name, description, contactEmail, website, coordinates } = req.body;

    const ngo = await NGO.findById(ngoId);
    if (!ngo) return res.status(404).json({ message: 'NGO not found' });

    // Check if user is the admin
    if (ngo.adminId.toString() !== (req as any).user.id) {
      return res.status(403).json({ message: 'Only the NGO admin can update details' });
    }

    if (name) ngo.name = name;
    if (description) ngo.description = description;
    if (contactEmail) ngo.contactEmail = contactEmail;
    if (website) ngo.website = website;
    if (coordinates) {
      ngo.location = {
        type: 'Point',
        coordinates // [lng, lat]
      };
    }

    await ngo.save();
    res.status(200).json(ngo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating NGO details', error });
  }
};

export const getPendingReports = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user.ngoId;
    const reports = await Survey.find({ 
      status: 'SUBMITTED',
      ngoId // Scope surveys to NGO
    }).populate('fieldWorkerId', 'name email');
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending reports', error });
  }
};
