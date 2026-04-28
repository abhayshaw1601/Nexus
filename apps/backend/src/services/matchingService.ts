import User from '../models/User';
import { ITask } from '../models/Task';
import { Server } from 'socket.io';

export const findMatchingVolunteers = async (task: ITask, io: Server) => {
  try {
    // Find volunteers that match ALL criteria:
    // 1. Assigned to the same organization (ngoId)
    // 2. Have matching skills (category matches their skills array)
    // 3. Within 5km radius of the task location
    // 4. Are verified volunteers
    const volunteers = await User.find({
      role: 'VOLUNTEER',
      ngoId: task.ngoId, // Only volunteers from the same organization
      isVerified: true,
      skills: task.category, // Skill must match the task category (e.g., Medical, Sanitation)
      location: {
        $near: {
          $geometry: task.location,
          $maxDistance: 5000 // 5km radius
        }
      }
    });

    console.log(`Found ${volunteers.length} potential volunteers with matching skills (${task.category}) for task: ${task._id}`);

    volunteers.forEach(volunteer => {
      // Notify the volunteer via socket if they are online
      // In a real app, you might use their user ID as a room name
      io.to(volunteer._id.toString()).emit('new_task', {
        taskId: task._id,
        category: task.category,
        urgency: task.urgencyScore,
        description: task.description
      });
      console.log(`Notified volunteer: ${volunteer.name} (${volunteer._id}) - Skills: ${volunteer.skills.join(', ')}`);
    });

    return volunteers;
  } catch (error) {
    console.error('Matching Error:', error);
    return [];
  }
};
