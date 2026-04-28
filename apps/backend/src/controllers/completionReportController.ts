import { Request, Response } from 'express';
import CompletionReport from '../models/CompletionReport';
import Task from '../models/Task';

export const getPendingReports = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user?.ngoId;
    
    if (!ngoId) {
      return res.status(403).json({ message: 'Organization context missing' });
    }

    const reports = await CompletionReport.find({ 
      ngoId,
      status: 'PENDING' 
    })
    .populate('volunteerId', 'name email')
    .populate('taskId', 'description category')
    .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getMyReports = async (req: Request, res: Response) => {
  try {
    const volunteerId = (req as any).user?.id;
    const reports = await CompletionReport.find({ volunteerId })
      .populate('taskId', 'description category')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user?.ngoId;
    
    if (!ngoId) {
      return res.status(403).json({ message: 'Organization context missing' });
    }

    const reports = await CompletionReport.find({ ngoId })
      .populate('volunteerId', 'name email')
      .populate('taskId', 'description category')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const verifyReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'VERIFIED' or 'REJECTED'

    const report = await CompletionReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = action;
    await report.save();

    // If verified, update the task status to VERIFIED
    if (action === 'VERIFIED') {
      await Task.findByIdAndUpdate(report.taskId, { status: 'VERIFIED' });
    }

    res.json({ 
      message: `Report ${action.toLowerCase()} successfully`,
      report 
    });
  } catch (error) {
    console.error('Error verifying report:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
