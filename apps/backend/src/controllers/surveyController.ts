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
    const { surveyId, description, category, urgency, location, extractedEntries } = req.body;

    if (!fieldWorkerId) {
      return res.status(401).json({ message: 'User not authenticated or ID missing' });
    }

    let survey;
    if (surveyId && mongoose.isValidObjectId(surveyId)) {
      survey = await Survey.findOneAndUpdate(
        { _id: surveyId, fieldWorkerId, status: 'DRAFT' },
        { description, category, urgency, location, ngoId, extractedEntries },
        { new: true }
      );
    }

    if (!survey) {
      survey = new Survey({
        fieldWorkerId,
        ngoId,
        description,
        category,
        urgency,
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

    // NGO_ADMIN submissions are auto-verified → immediately create Task(s)
    if (user.role === 'NGO_ADMIN' || user.role === 'SUPER_ADMIN') {
      survey.status = 'VERIFIED';
      await survey.save();

      const tasks = [];
      if (survey.extractedEntries && survey.extractedEntries.length > 0) {
        for (const entry of survey.extractedEntries) {
          const task = new Task({
            sourceSurveyId: survey._id,
            category: entry.category || 'Uncategorized',
            urgencyScore: entry.urgency || 3,
            description: entry.description || 'No description provided',
            location: (entry.latitude && entry.longitude) 
              ? { type: 'Point', coordinates: [Number(entry.longitude), Number(entry.latitude)] }
              : survey.location || { type: 'Point', coordinates: [0, 0] },
            ngoId: ngoId || survey.ngoId,
            status: 'OPEN',
          });
          await task.save();
          tasks.push(task);
        }
      } else {
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
        tasks.push(task);
      }

      return res.status(200).json({
        message: `Survey submitted and ${tasks.length} task(s) created successfully`,
        survey,
        tasks,
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

export const uploadSurvey = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = (req as any).user;
    const fieldWorkerId = user?._id || user?.id || req.body.fieldWorkerId;
    const ngoId = user?.ngoId;

    // Create survey record with Cloudinary URL
    const survey = new Survey({
      fieldWorkerId,
      ngoId,
      rawImageUrl: req.file.path, // This is now the Cloudinary URL
      status: 'DRAFT',
    });

    await survey.save();

    // ── Call new AI Service (Docling + Sarvam + LangExtract) ──────────────
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const { language } = req.body;

    try {
      const formData = new FormData();
      formData.append('image_url', req.file.path);
      if (language) {
        formData.append('language', language);
      }

      const aiResponse = await axios.post(`${aiServiceUrl}/extract-survey`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 90000, 
      });

      // New response shape: { surveys: [{category, urgency, latitude, longitude, description}], raw_ocr_text }
      const { surveys, raw_ocr_text } = aiResponse.data;

      if (surveys && Array.isArray(surveys)) {
        survey.extractedEntries = surveys.map((s: any) => ({
          category: s.category || 'Other',
          urgency: s.urgency ? Number(s.urgency) : 3,
          latitude: s.latitude,
          longitude: s.longitude,
          description: s.description || '',
          status: 'PENDING'
        }));

        // For backward compatibility or if single entry logic is used elsewhere
        if (surveys.length > 0) {
          survey.category = surveys[0].category;
          survey.urgency = Number(surveys[0].urgency) || 3;
          survey.description = surveys[0].description;
          if (surveys[0].latitude && surveys[0].longitude) {
            survey.location = {
              type: 'Point',
              coordinates: [Number(surveys[0].longitude), Number(surveys[0].latitude)]
            };
          }
        }
      }

      survey.aiExtractedData = {
        rawText: raw_ocr_text || '',
      };

      await survey.save();

      res.status(201).json({
        message: 'Survey uploaded and processed by AI',
        survey,
      });
    } catch (aiError: any) {
      console.error('AI Service Error:', aiError.message);
      res.status(201).json({
        message: 'Survey uploaded but AI processing failed — please fill details manually',
        survey,
        aiError: aiError.message,
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getSurveyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findById(id);
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    res.status(200).json(survey);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching survey', error });
  }
};
