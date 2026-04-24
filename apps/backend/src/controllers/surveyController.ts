import { Request, Response } from 'express';
import Survey from '../models/Survey';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

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
      status: 'PENDING_AI',
    });

    await survey.save();

    // Call AI Service
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path));

      const aiResponse = await axios.post('http://localhost:8000/api/extract', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const { raw_text, analysis } = aiResponse.data;

      survey.status = 'PENDING_HUMAN';
      survey.aiExtractedData = {
        rawText: raw_text,
        suggestedCategory: analysis.category,
        suggestedUrgency: analysis.urgency,
        suggestedDescription: analysis.description,
      };

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
