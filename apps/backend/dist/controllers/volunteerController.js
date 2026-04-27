"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitDetails = void 0;
const User_1 = __importDefault(require("../models/User"));
const zod_1 = require("zod");
const submitDetailsSchema = zod_1.z.object({
    specialization: zod_1.z.string().min(2),
    experienceBio: zod_1.z.string().min(5),
});
const submitDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        // Validate body
        const validatedData = submitDetailsSchema.parse(req.body);
        // Check for uploaded file
        if (!req.file) {
            return res.status(400).json({ message: 'ID Proof is required' });
        }
        const idProofUrl = req.file.path; // Cloudinary returns the URL in req.file.path
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'VOLUNTEER') {
            return res.status(403).json({ message: 'Only volunteers can submit these details' });
        }
        user.specialization = validatedData.specialization;
        user.experienceBio = validatedData.experienceBio;
        user.idProofUrl = idProofUrl;
        user.status = 'pending';
        await user.save();
        res.json({
            message: 'Details submitted successfully',
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                status: user.status,
                specialization: user.specialization,
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.submitDetails = submitDetails;
