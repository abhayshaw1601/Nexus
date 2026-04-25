import { Request, Response } from 'express';
import Survey from '../models/Survey';

export const saveDraft = async (req: Request, res: Response) => {
  try {
    const fieldWorkerId = (req as any).user?.id;
    const { surveyId, description, category, urgency, location, dataStack } = req.body;

    // Use findOneAndUpdate with upsert: true as requested
    const survey = await Survey.findOneAndUpdate(
      { _id: surveyId || new (require('mongoose').Types.ObjectId)(), fieldWorkerId },
      { 
        description, 
        category, 
        urgency, 
        location, 
        dataStack,
        status: 'DRAFT' 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'Draft saved successfully', survey });
  } catch (error) {
    res.status(500).json({ message: 'Error saving draft', error });
  }
};

export const submitReport = async (req: Request, res: Response) => {
  try {
    const fieldWorkerId = (req as any).user?.id;
    const { surveyId } = req.body;

    const survey = await Survey.findOneAndUpdate(
      { _id: surveyId, fieldWorkerId },
      { status: 'SUBMITTED' },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({ message: 'Report submitted successfully', survey });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting report', error });
  }
};
