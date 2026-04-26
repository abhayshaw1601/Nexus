"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingReports = void 0;
const Survey_1 = __importDefault(require("../models/Survey"));
const getPendingReports = async (req, res) => {
    try {
        console.log('Fetching pending reports. User:', req.user);
        const reports = await Survey_1.default.find({ status: 'SUBMITTED' }).populate('fieldWorkerId', 'name email');
        res.status(200).json(reports);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching pending reports', error });
    }
};
exports.getPendingReports = getPendingReports;
