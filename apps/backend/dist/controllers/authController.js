"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../utils/auth");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['NGO_ADMIN', 'FIELD_WORKER', 'VOLUNTEER']).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const existingUser = await User_1.default.findOne({ email: validatedData.email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await (0, auth_1.hashPassword)(validatedData.password);
        const user = new User_1.default({
            ...validatedData,
            password: hashedPassword,
        });
        await user.save();
        const token = (0, auth_1.generateToken)(user._id.toString(), user.role);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                specialization: user.specialization,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const user = await User_1.default.findOne({ email: validatedData.email });
        if (!user || !user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await (0, auth_1.comparePassword)(validatedData.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = (0, auth_1.generateToken)(user._id.toString(), user.role);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                specialization: user.specialization,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.login = login;
