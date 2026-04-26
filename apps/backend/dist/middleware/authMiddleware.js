"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.auth = void 0;
const auth_1 = require("../utils/auth");
const User_1 = __importDefault(require("../models/User"));
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            console.log('Auth Middleware: Token invalid');
            return res.status(401).json({ message: 'Token is not valid' });
        }
        const user = await User_1.default.findById(decoded.id).select('-password');
        if (!user) {
            console.log('Auth Middleware: User not found for ID', decoded.id);
            return res.status(401).json({ message: 'User not found' });
        }
        console.log('Auth Middleware: Authenticated User:', user.email, 'Role:', user.role);
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
exports.auth = auth;
const authorize = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        }
        next();
    };
};
exports.authorize = authorize;
