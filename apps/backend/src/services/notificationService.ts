import User from '../models/User';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

interface CrisisData {
  id: string;
  name: string;
  category: string;
  urgencyScore: number;
  coordinates: [number, number]; // [longitude, latitude]
  ngoId: mongoose.Types.ObjectId; // Organization that raised the issue
}

export const notifyNearbyVolunteers = async (io: Server, crisisData: CrisisData) => {
  try {
    // MongoDB $near query to find volunteers within 20km
    const maxDistanceInMeters = 20000; // 20km

    // Find volunteers that match ALL criteria:
    // 1. Assigned to the same organization (ngoId)
    // 2. On-duty and verified
    // 3. Within 20km radius
    // 4. Have matching skills (category matches their skills array)
    const nearbyVolunteers = await User.find({
      role: 'VOLUNTEER',
      ngoId: crisisData.ngoId, // Only volunteers from the same organization
      isOnDuty: true,
      isVerified: true,
      skills: crisisData.category, // Skill must match the issue category (e.g., Medical, Sanitation)
      lastLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: crisisData.coordinates
          },
          $maxDistance: maxDistanceInMeters
        }
      }
    });

    console.log(`Found ${nearbyVolunteers.length} nearby on-duty volunteers with matching skills (${crisisData.category}) for crisis: ${crisisData.name}`);

    // Emit notification to each volunteer's personal room
    nearbyVolunteers.forEach(volunteer => {
      io.to(volunteer._id.toString()).emit('NEW_CRISIS_NEARBY', {
        id: crisisData.id,
        name: crisisData.name,
        category: crisisData.category,
        urgencyScore: crisisData.urgencyScore,
        coordinates: crisisData.coordinates
      });
      console.log(`Sent crisis alert to volunteer: ${volunteer.name} (${volunteer._id}) - Skills: ${volunteer.skills.join(', ')}`);
    });

    return nearbyVolunteers.length;
  } catch (error) {
    console.error('Error in notifyNearbyVolunteers:', error);
    return 0;
  }
};
