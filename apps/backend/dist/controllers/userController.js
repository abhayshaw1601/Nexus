"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const getUsers = async (req, res) => {
    try {
        const users = await User_1.default.find({}, '-password'); // exclude password
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getUsers = getUsers;
