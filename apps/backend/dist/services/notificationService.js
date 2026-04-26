"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyNearbyVolunteers = void 0;
const User_1 = __importDefault(require("../models/User"));
const notifyNearbyVolunteers = async (io, crisisData) => {
    try {
        // MongoDB $near query to find volunteers within 20km
        const maxDistanceInMeters = 20000; // 20km
        const nearbyVolunteers = await User_1.default.find({
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
    }
    catch (error) {
        console.error('Error in notifyNearbyVolunteers:', error);
        return 0;
    }
};
exports.notifyNearbyVolunteers = notifyNearbyVolunteers;
