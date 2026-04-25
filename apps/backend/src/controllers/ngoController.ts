import { Request, Response } from 'express';
import Survey from '../models/Survey';

export const getPendingReports = async (req: Request, res: Response) => {
  try {
    console.log('Fetching pending reports. User:', (req as any).user);
    const reports = await Survey.find({ status: 'SUBMITTED' }).populate('fieldWorkerId', 'name email');
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending reports', error });
  }
};
