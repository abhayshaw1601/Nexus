"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVolunteerStatus = exports.getPendingVolunteers = void 0;
const User_1 = __importDefault(require("../models/User"));
const getPendingVolunteers = async (req, res) => {
    try {
        const volunteers = await User_1.default.find({ role: 'VOLUNTEER', status: 'pending' })
            .select('-password -__v');
        res.json(volunteers);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getPendingVolunteers = getPendingVolunteers;
const updateVolunteerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const user = await User_1.default.findById(id);
        if (!user || user.role !== 'VOLUNTEER') {
            return res.status(404).json({ message: 'Volunteer not found' });
        }
        user.status = status;
        if (status === 'approved') {
            user.isVerified = true;
        }
        await user.save();
        // Here we can trigger socket.io notification if needed
        if (req.io) {
            req.io.to(user._id.toString()).emit('status_updated', { status });
        }
        res.json({ message: `Volunteer ${status} successfully`, user });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.updateVolunteerStatus = updateVolunteerStatus;
