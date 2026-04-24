import User from '../models/User';
import { ITask } from '../models/Task';
import { Server } from 'socket.io';

export const findMatchingVolunteers = async (task: ITask, io: Server) => {
  try {
    const volunteers = await User.find({
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
  } catch (error) {
    console.error('Matching Error:', error);
    return [];
  }
};
