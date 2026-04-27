"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitReport = exports.saveDraft = void 0;
const Survey_1 = __importDefault(require("../models/Survey"));
const saveDraft = async (req, res) => {
    try {
        const fieldWorkerId = req.user?.id;
        const { surveyId, description, category, urgency, location, dataStack } = req.body;
        // Use findOneAndUpdate with upsert: true as requested
        const survey = await Survey_1.default.findOneAndUpdate({ _id: surveyId || new (require('mongoose').Types.ObjectId)(), fieldWorkerId }, {
            description,
            category,
            urgency,
            location,
            dataStack,
            status: 'DRAFT'
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        res.status(200).json({ message: 'Draft saved successfully', survey });
    }
    catch (error) {
        res.status(500).json({ message: 'Error saving draft', error });
    }
};
exports.saveDraft = saveDraft;
const submitReport = async (req, res) => {
    try {
        const fieldWorkerId = req.user?.id;
        const { surveyId } = req.body;
        const survey = await Survey_1.default.findOneAndUpdate({ _id: surveyId, fieldWorkerId }, { status: 'SUBMITTED' }, { new: true });
        if (!survey) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json({ message: 'Report submitted successfully', survey });
    }
    catch (error) {
        res.status(500).json({ message: 'Error submitting report', error });
    }
};
exports.submitReport = submitReport;
