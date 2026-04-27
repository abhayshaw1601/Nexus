"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSurvey = exports.verifySurvey = exports.getPendingSurveys = exports.submitSurvey = exports.saveDraft = void 0;
const Survey_1 = __importDefault(require("../models/Survey"));
const Task_1 = __importDefault(require("../models/Task"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const saveDraft = async (req, res) => {
    try {
        const fieldWorkerId = req.user?.id || req.body.fieldWorkerId;
        const { surveyId, description, category, urgency, location } = req.body;
        let survey;
        if (surveyId) {
            survey = await Survey_1.default.findOneAndUpdate({ _id: surveyId, fieldWorkerId, status: 'DRAFT' }, { description, category, urgency, location }, { new: true });
        }
        if (!survey) {
            survey = new Survey_1.default({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error saving draft', error });
    }
};
exports.saveDraft = saveDraft;
const submitSurvey = async (req, res) => {
    try {
        const fieldWorkerId = req.user?.id || req.body.fieldWorkerId;
        const { surveyId } = req.body;
        const survey = await Survey_1.default.findOneAndUpdate({ _id: surveyId, fieldWorkerId, status: 'DRAFT' }, { status: 'SUBMITTED' }, { new: true });
        if (!survey) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        res.status(200).json({ message: 'Survey submitted successfully', survey });
    }
    catch (error) {
        res.status(500).json({ message: 'Error submitting survey', error });
    }
};
exports.submitSurvey = submitSurvey;
const getPendingSurveys = async (req, res) => {
    try {
        const surveys = await Survey_1.default.find({ status: 'SUBMITTED' }).populate('fieldWorkerId', 'name');
        res.status(200).json(surveys);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching pending surveys', error });
    }
};
exports.getPendingSurveys = getPendingSurveys;
const verifySurvey = async (req, res) => {
    try {
        const { surveyId, action } = req.body; // action: 'VERIFIED' or 'REJECTED'
        const survey = await Survey_1.default.findById(surveyId);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        survey.status = action;
        await survey.save();
        if (action === 'VERIFIED') {
            // Create a Task from the verified survey
            const task = new Task_1.default({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error verifying survey', error });
    }
};
exports.verifySurvey = verifySurvey;
const uploadSurvey = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fieldWorkerId = req.user?.id || req.body.fieldWorkerId;
        // Create survey record
        const survey = new Survey_1.default({
            fieldWorkerId,
            rawImageUrl: req.file.path,
            status: 'SUBMITTED', // Default to submitted for AI flow
        });
        await survey.save();
        // Call AI Service (Optional/Legacy flow)
        try {
            const formData = new form_data_1.default();
            formData.append('file', fs_1.default.createReadStream(req.file.path));
            const aiResponse = await axios_1.default.post('http://localhost:8000/api/extract', formData, {
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
        }
        catch (aiError) {
            console.error('AI Service Error:', aiError);
            res.status(201).json({
                message: 'Survey uploaded but AI processing failed',
                survey,
            });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.uploadSurvey = uploadSurvey;
