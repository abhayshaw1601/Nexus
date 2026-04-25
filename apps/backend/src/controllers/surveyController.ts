import { Request, Response } from 'express';
import Survey from '../models/Survey';
import Task from '../models/Task';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

export const saveDraft = async (req: Request, res: Response) => {
  try {
    const fieldWorkerId = (req as any).user?.id || req.body.fieldWorkerId;
    const { surveyId, description, category, urgency, location } = req.body;

    let survey;
    if (surveyId) {
      survey = await Survey.findOneAndUpdate(
        { _id: surveyId, fieldWorkerId, status: 'DRAFT' },
        { description, category, urgency, location },
        { new: true }
      );
    }

    if (!survey) {
      survey = new Survey({
        fieldWorkerId,
        description,
        category,
        urgency,
        location,
        status: 'DRAFT'
      });
      await survey.save();
    }

    res.status(200).json({ message: 'Draft saved successfully', survey });
  } catch (error) {
    res.status(500).json({ message: 'Error saving draft', error });
  }
};

export const submitSurvey = async (req: Request, res: Response) => {
  try {
    const fieldWorkerId = (req as any).user?.id || req.body.fieldWorkerId;
    const { surveyId } = req.body;

    const survey = await Survey.findOneAndUpdate(
      { _id: surveyId, fieldWorkerId, status: 'DRAFT' },
      { status: 'SUBMITTED' },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    res.status(200).json({ message: 'Survey submitted successfully', survey });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting survey', error });
  }
};

export const getPendingSurveys = async (req: Request, res: Response) => {
  try {
    const surveys = await Survey.find({ status: 'SUBMITTED' }).populate('fieldWorkerId', 'name');
    res.status(200).json(surveys);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending surveys', error });
  }
};

export const verifySurvey = async (req: Request, res: Response) => {
  try {
    const { surveyId, action } = req.body; // action: 'VERIFIED' or 'REJECTED'

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
        status: 'OPEN'
      });
      await task.save();
    }

    res.status(200).json({ message: `Survey ${action.toLowerCase()} successfully`, survey });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying survey', error });
  }
};

export const uploadSurvey = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fieldWorkerId = (req as any).user?.id || req.body.fieldWorkerId;
    
    // Create survey record
    const survey = new Survey({
      fieldWorkerId,
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
