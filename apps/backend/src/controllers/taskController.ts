import { Request, Response } from 'express';
import Task from '../models/Task';
import { findMatchingVolunteers } from '../services/matchingService';
import { notifyNearbyVolunteers } from '../services/notificationService';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const ngoId = (req as any).user?.ngoId;
    if (!ngoId) {
      return res.status(403).json({ message: 'Organization context missing' });
    }
    const query: any = { status: { $ne: 'VERIFIED' }, ngoId };

    const tasks = await Task.find(query).populate('assignedVolunteerId', 'name email');

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

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('assignedVolunteerId', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createTaskFromSurvey = async (req: Request, res: Response) => {
  try {
    const { surveyId, category, urgencyScore, description, coordinates } = req.body;
    const io = (req as any).io;
    const ngoId = (req as any).user?.ngoId;

    if (!ngoId) {
      return res.status(403).json({ message: 'You must belong to an NGO to create tasks' });
    }

    const task = new Task({
      sourceSurveyId: surveyId,
      category,
      urgencyScore,
      description,
      ngoId,
      location: {
        type: 'Point',
        coordinates // [lng, lat]
      },
      status: 'OPEN'
    });

    await task.save();

    // Update survey status if applicable
    if (surveyId) {
      const Survey = (await import('../models/Survey')).default;
      await Survey.findByIdAndUpdate(surveyId, { status: 'VERIFIED' });
    }

    // Trigger matching and notifications
    await findMatchingVolunteers(task, io);

    // Trigger the new proximity-based crisis alerts for On-Duty volunteers
    // Only notifies volunteers from the same organization with matching skills
    await notifyNearbyVolunteers(io, {
      id: task._id.toString(),
      name: task.description || 'New Crisis',
      category: task.category,
      urgencyScore: task.urgencyScore,
      coordinates: task.location.coordinates as [number, number],
      ngoId: task.ngoId // Pass the organization ID for filtering
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const acceptTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const volunteerId = (req as any).user?.id || req.body.volunteerId;

    // Check if volunteer already has an active (ASSIGNED) task
    const activeTask = await Task.findOne({
      assignedVolunteerId: volunteerId,
      status: 'ASSIGNED'
    });

    if (activeTask) {
      return res.status(400).json({ 
        message: 'You already have an active task. Please complete it before accepting a new one.',
        activeTaskId: activeTask._id
      });
    }

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
    const volunteerId = (req as any).user?.id;
    const ngoId = (req as any).user?.ngoId;

    // Support both JSON and multipart/form-data
    const body = req.body;
    const title = body.title;
    const category = body.category;
    const urgencyScore = Number(body.urgencyScore);
    const affectedPeople = Number(body.affectedPeople) || 0;
    const description = body.description;
    const coordinates = typeof body.coordinates === 'string' 
      ? JSON.parse(body.coordinates) 
      : body.coordinates;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.assignedVolunteerId?.toString() !== volunteerId) {
      return res.status(403).json({ message: 'You can only complete tasks assigned to you' });
    }

    // Collect Cloudinary image URLs (multer-storage-cloudinary puts secure_url in file.path)
    const files = (req as any).files as Express.Multer.File[] | undefined;
    const imageUrls = files ? files.map(f => (f as any).path) : [];

    const CompletionReport = (await import('../models/CompletionReport')).default;
    const report = new CompletionReport({
      taskId: task._id,
      volunteerId,
      ngoId: task.ngoId,
      title,
      category,
      urgencyScore,
      affectedPeople,
      description,
      location: { type: 'Point', coordinates },
      proofImageUrls: imageUrls,
      status: 'PENDING'
    });

    await report.save();

    task.status = 'COMPLETED';
    task.proofData = { imageUrl: imageUrls[0] || '', coordinates, timestamp: new Date() };
    await task.save();

    res.json({ message: 'Task marked as completed. Report submitted for verification.', task, report });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Admin Endpoints
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Super admins see everything
    if (user.role === 'SUPER_ADMIN') {
      const tasks = await Task.find({}).populate('assignedVolunteerId', 'name email').sort({ createdAt: -1 });
      return res.json(tasks);
    }

    const ngoId = user.ngoId;
    if (!ngoId) return res.status(403).json({ message: 'Organization context missing' });

    const tasks = await Task.find({ ngoId }).populate('assignedVolunteerId', 'name email').sort({ createdAt: -1 });
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
