import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Survey from '../models/Survey';
import Task from '../models/Task';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

export const saveDraft = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const fieldWorkerId = user?._id || user?.id;
    const ngoId = user?.ngoId;
    const { surveyId, title, description, category, urgency, affectedPeople, location } = req.body;

    if (!fieldWorkerId) {
      return res.status(401).json({ message: 'User not authenticated or ID missing' });
    }

    let survey;
    if (surveyId && mongoose.isValidObjectId(surveyId)) {
      survey = await Survey.findOneAndUpdate(
        { _id: surveyId, fieldWorkerId, status: 'DRAFT' },
        { title, description, category, urgency, affectedPeople, location, ngoId },
        { new: true }
      );
    }

    if (!survey) {
      survey = new Survey({
        fieldWorkerId,
        ngoId,
        title,
        description,
        category,
        urgency,
        affectedPeople,
        location,
        status: 'DRAFT'
      });
      await survey.save();
    }

    res.status(200).json({ message: 'Draft saved successfully', survey });
  } catch (error: any) {
    console.error('Error in saveDraft:', error);
    res.status(500).json({ message: 'Error saving draft', error: error.message });
  }
};

export const submitSurvey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const fieldWorkerId = user?._id || user?.id;
    const ngoId = user?.ngoId;
    const { surveyId } = req.body;

    if (!surveyId || !mongoose.isValidObjectId(surveyId)) {
      return res.status(400).json({ message: 'Valid Survey ID is required' });
    }

    const survey = await Survey.findOneAndUpdate(
      { _id: surveyId, fieldWorkerId, status: 'DRAFT' },
      { status: 'SUBMITTED', ngoId },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({ message: 'Draft not found or already submitted' });
    }

    // NGO_ADMIN submissions are auto-verified → immediately create a Task
    if (user.role === 'NGO_ADMIN' || user.role === 'SUPER_ADMIN') {
      survey.status = 'VERIFIED';
      await survey.save();

      const task = new Task({
        sourceSurveyId: survey._id,
        category: survey.category || 'Uncategorized',
        urgencyScore: survey.urgency || 3,
        description: survey.description || 'No description provided',
        location: survey.location || { type: 'Point', coordinates: [0, 0] },
        ngoId: ngoId || survey.ngoId,
        status: 'OPEN',
      });
      await task.save();

      return res.status(200).json({
        message: 'Survey submitted and task created successfully',
        survey,
        task,
        autoVerified: true,
      });
    }

    res.status(200).json({ message: 'Survey submitted for verification', survey });
  } catch (error: any) {
    console.error('Error in submitSurvey:', error);
    res.status(500).json({ message: 'Error submitting survey', error: error.message });
  }
};

export const getPendingSurveys = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user?.ngoId;
    const query: any = { status: 'SUBMITTED' };
    if (ngoId) query.ngoId = ngoId;

    const surveys = await Survey.find(query).populate('fieldWorkerId', 'name');
    res.status(200).json(surveys);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending surveys', error });
  }
};

export const verifySurvey = async (req: Request, res: Response) => {
  try {
    const { surveyId, action } = req.body; // action: 'VERIFIED' or 'REJECTED'
    const ngoId = (req as any).user?.ngoId;

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    survey.status = action;
    await survey.save();

    if (action === 'VERIFIED') {
      // Create a Task from the verified survey
      const task = new Task({
        sourceSurveyId: survey._id,
        category: survey.category || 'Uncategorized',
        urgencyScore: survey.urgency || 3,
        description: survey.description || 'No description provided',
        location: survey.location || { type: 'Point', coordinates: [0, 0] },
        ngoId: ngoId || survey.ngoId,
        status: 'OPEN'
      });
      await task.save();
    }

    res.status(200).json({ message: `Survey ${action.toLowerCase()} successfully`, survey });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying survey', error });
  }
};

export const getMySurveys = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const fieldWorkerId = user?._id || user?.id;
    const surveys = await Survey.find({ fieldWorkerId }).sort({ createdAt: -1 });
    res.status(200).json(surveys);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching surveys', error });
  }
};

export const uploadSurvey = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = (req as any).user;
    const fieldWorkerId = user?._id || user?.id || req.body.fieldWorkerId;
    const ngoId = user?.ngoId;
    
    // Create survey record
    const survey = new Survey({
      fieldWorkerId,
      ngoId,
      rawImageUrl: req.file.path,
      status: 'SUBMITTED', // Default to submitted for AI flow
    });

    await survey.save();

    // Call AI Service (Optional/Legacy flow)
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path));

      const aiResponse = await axios.post('http://localhost:8000/api/extract', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const { raw_text, analysis } = aiResponse.data;

      survey.aiExtractedData = {
        rawText: raw_text,
        suggestedCategory: analysis.category,
        suggestedUrgency: analysis.urgency,
        suggestedDescription: analysis.description,
      };

      // Also populate top-level fields for immediate review
      survey.category = analysis.category;
      survey.urgency = analysis.urgency;
      survey.description = analysis.description;

      await survey.save();

      res.status(201).json({
        message: 'Survey uploaded and processed by AI',
        survey,
      });
    } catch (aiError) {
      console.error('AI Service Error:', aiError);
      res.status(201).json({
        message: 'Survey uploaded but AI processing failed',
        survey,
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
