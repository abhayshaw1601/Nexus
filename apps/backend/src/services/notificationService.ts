import User from '../models/User';
import { Server } from 'socket.io';

interface CrisisData {
  id: string;
  name: string;
  category: string;
  urgencyScore: number;
  coordinates: [number, number]; // [longitude, latitude]
}

export const notifyNearbyVolunteers = async (io: Server, crisisData: CrisisData) => {
  try {
    // MongoDB $near query to find volunteers within 20km
    const maxDistanceInMeters = 20000; // 20km

    const nearbyVolunteers = await User.find({
      role: 'VOLUNTEER',
      isOnDuty: true,
      isVerified: true,
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

    console.log(`Found ${nearbyVolunteers.length} nearby on-duty volunteers for crisis: ${crisisData.name}`);

    // Emit notification to each volunteer's personal room
    nearbyVolunteers.forEach(volunteer => {
      io.to(volunteer._id.toString()).emit('NEW_CRISIS_NEARBY', {
        id: crisisData.id,
        name: crisisData.name,
        category: crisisData.category,
        urgencyScore: crisisData.urgencyScore,
        coordinates: crisisData.coordinates
      });
      console.log(`Sent crisis alert to volunteer: ${volunteer.name} (${volunteer._id})`);
    });

    return nearbyVolunteers.length;
  } catch (error) {
    console.error('Error in notifyNearbyVolunteers:', error);
    return 0;
  }
};
