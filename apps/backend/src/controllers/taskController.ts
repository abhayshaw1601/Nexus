import { Request, Response } from 'express';
import Task from '../models/Task';
import { findMatchingVolunteers } from '../services/matchingService';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ status: { $ne: 'VERIFIED' } });

    // Simple Privacy Geofencing: 
    // If not admin, add slight random offset to coordinates (approx 100m)
    const isAdmin = (req as any).user?.role === 'NGO_ADMIN';

    const safeTasks = tasks.map(task => {
      if (isAdmin) return task;

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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createTaskFromSurvey = async (req: Request, res: Response) => {
  try {
    const { surveyId, category, urgencyScore, description, coordinates } = req.body;
    const io = (req as any).io;

    const task = new Task({
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
    await findMatchingVolunteers(task, io);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const acceptTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const volunteerId = (req as any).user?.id || req.body.volunteerId;

    const task = await Task.findById(id);
    if (!task || task.status !== 'OPEN') {
      return res.status(400).json({ message: 'Task not available' });
    }

    task.status = 'ASSIGNED';
    task.assignedVolunteerId = volunteerId;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { coordinates } = req.body; // [lng, lat] from volunteer's device

    const task = await Task.findById(id);
    if (!task || !req.file) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Distance validation (simple Haversine or approximation)
    const [taskLng, taskLat] = task.location.coordinates;
    const [proofLng, proofLat] = coordinates;

    const distance = Math.sqrt(
      Math.pow(taskLng - proofLng, 2) + Math.pow(taskLat - proofLat, 2)
    );

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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Admin Endpoints
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({}).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const verifyTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.status = 'VERIFIED';
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Task.findByIdAndDelete(id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
