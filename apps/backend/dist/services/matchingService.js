"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingVolunteers = void 0;
const User_1 = __importDefault(require("../models/User"));
const findMatchingVolunteers = async (task, io) => {
    try {
        const volunteers = await User_1.default.find({
            role: 'VOLUNTEER',
            skills: task.category,
            location: {
                $near: {
                    $geometry: task.location,
                    $maxDistance: 5000 // 5km radius
                }
            }
        });
        console.log(`Found ${volunteers.length} potential volunteers for task: ${task._id}`);
        volunteers.forEach(volunteer => {
            // Notify the volunteer via socket if they are online
            // In a real app, you might use their user ID as a room name
            io.to(volunteer._id.toString()).emit('new_task', {
                taskId: task._id,
                category: task.category,
                urgency: task.urgencyScore,
                description: task.description
            });
        });
        return volunteers;
    }
    catch (error) {
        console.error('Matching Error:', error);
        return [];
    }
};
exports.findMatchingVolunteers = findMatchingVolunteers;
