"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.verifyTask = exports.getAllTasks = exports.completeTask = exports.acceptTask = exports.createTaskFromSurvey = exports.getTasks = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const matchingService_1 = require("../services/matchingService");
const notificationService_1 = require("../services/notificationService");
const getTasks = async (req, res) => {
    try {
        const tasks = await Task_1.default.find({ status: { $ne: 'VERIFIED' } });
        // Simple Privacy Geofencing: 
        // If not admin, add slight random offset to coordinates (approx 100m)
        const isAdmin = req.user?.role === 'NGO_ADMIN';
        const safeTasks = tasks.map(task => {
            if (isAdmin)
                return task;
            const [lng, lat] = task.location.coordinates;
            const blurredLng = lng + (Math.random() - 0.5) * 0.002;
            const blurredLat = lat + (Math.random() - 0.5) * 0.002;
            return {
                ...task.toObject(),
                location: {
                    ...task.location,
                    coordinates: [blurredLng, blurredLat]
                }
            };
        });
        res.json(safeTasks);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getTasks = getTasks;
const createTaskFromSurvey = async (req, res) => {
    try {
        const { surveyId, category, urgencyScore, description, coordinates } = req.body;
        const io = req.io;
        const task = new Task_1.default({
            sourceSurveyId: surveyId,
            category,
            urgencyScore,
            description,
            location: {
                type: 'Point',
                coordinates // [lng, lat]
            },
            status: 'OPEN'
        });
        await task.save();
        // Trigger matching and notifications
        await (0, matchingService_1.findMatchingVolunteers)(task, io);
        // Trigger the new proximity-based crisis alerts for On-Duty volunteers
        await (0, notificationService_1.notifyNearbyVolunteers)(io, {
            id: task._id.toString(),
            name: task.description || 'New Crisis',
            category: task.category,
            urgencyScore: task.urgencyScore,
            coordinates: task.location.coordinates
        });
        res.status(201).json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createTaskFromSurvey = createTaskFromSurvey;
const acceptTask = async (req, res) => {
    try {
        const { id } = req.params;
        const volunteerId = req.user?.id || req.body.volunteerId;
        const task = await Task_1.default.findById(id);
        if (!task || task.status !== 'OPEN') {
            return res.status(400).json({ message: 'Task not available' });
        }
        task.status = 'ASSIGNED';
        task.assignedVolunteerId = volunteerId;
        await task.save();
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.acceptTask = acceptTask;
const completeTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { coordinates } = req.body; // [lng, lat] from volunteer's device
        const task = await Task_1.default.findById(id);
        if (!task || !req.file) {
            return res.status(400).json({ message: 'Invalid request' });
        }
        // Distance validation (simple Haversine or approximation)
        const [taskLng, taskLat] = task.location.coordinates;
        const [proofLng, proofLat] = coordinates;
        const distance = Math.sqrt(Math.pow(taskLng - proofLng, 2) + Math.pow(taskLat - proofLat, 2));
        // Approx 0.001 degree is ~110 meters
        if (distance > 0.001) {
            return res.status(400).json({
                message: 'You must be at the task location to submit proof',
                distance_detected: distance
            });
        }
        task.status = 'COMPLETED';
        task.proofData = {
            imageUrl: req.file.path,
            coordinates,
            timestamp: new Date()
        };
        await task.save();
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.completeTask = completeTask;
// Admin Endpoints
const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task_1.default.find({}).sort({ createdAt: -1 });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getAllTasks = getAllTasks;
const verifyTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task_1.default.findById(id);
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        task.status = 'VERIFIED';
        await task.save();
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.verifyTask = verifyTask;
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await Task_1.default.findByIdAndDelete(id);
        res.json({ message: 'Task deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.deleteTask = deleteTask;
