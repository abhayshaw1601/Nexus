import mongoose from 'mongoose';
import Task from '../models/Task';
import User from '../models/User';
import Survey from '../models/Survey';
import { hashPassword } from '../utils/auth';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexusimpact';

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
    
    // 1. Seed Users (Upsert Logic)
    const hashedAdminPassword = await hashPassword('admin123');
    const hashedWorkerPassword = await hashPassword('worker123');
    const hashedVolunteerPassword = await hashPassword('volunteer123');

    const userData = [
      {
        name: 'NGO Admin',
        email: 'admin@nexus.com',
        password: hashedAdminPassword,
        role: 'NGO_ADMIN',
        isVerified: true
      },
      {
        name: 'Field Worker John',
        email: 'worker@nexus.com',
        password: hashedWorkerPassword,
        role: 'FIELD_WORKER',
        isVerified: true
      },
      {
        name: 'Volunteer Sarah',
        email: 'volunteer@nexus.com',
        password: hashedVolunteerPassword,
        role: 'VOLUNTEER',
        skills: ['Medical', 'Sanitation'],
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        isVerified: true,
        impactScore: 45
      }
    ];

    for (const u of userData) {
      await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
    }

    const adminUser = await User.findOne({ email: 'admin@nexus.com' });
    const workerUser = await User.findOne({ email: 'worker@nexus.com' });
    const volunteerUser = await User.findOne({ email: 'volunteer@nexus.com' });

    const adminId = adminUser?._id;
    const workerId = workerUser?._id;
    const volunteerId = volunteerUser?._id;

    console.log('Successfully seeded/upserted users');

    // 2. Seed Surveys (Linked to Field Worker)
    // For surveys and tasks, we might still want a clean start, or just upsert them too.
    // I'll keep the deleteMany for these to ensure the "stack" is fresh for the user's check.
    await Survey.deleteMany({});
    await Task.deleteMany({});

    const surveys = await Survey.insertMany([
      {
        fieldWorkerId: workerId,
        rawImageUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=2070&auto=format&fit=crop',
        status: 'VERIFIED',
        description: 'Critical drainage blockage in Sector 4',
        category: 'Sanitation',
        urgency: 5,
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        aiExtractedData: {
          rawText: 'Critical drainage blockage in Sector 4',
          suggestedCategory: 'Sanitation',
          suggestedUrgency: 5,
          suggestedDescription: 'Major drainage overflow near market area'
        }
      },
      {
        fieldWorkerId: workerId,
        rawImageUrl: 'https://images.unsplash.com/photo-1583324113626-70df0f43aa2b?q=80&w=2070&auto=format&fit=crop',
        status: 'SUBMITTED',
        description: 'Road crack observed after heavy rain',
        category: 'Infrastructure',
        urgency: 3,
        location: { type: 'Point', coordinates: [77.6046, 12.9816] },
        aiExtractedData: {
          rawText: 'Road crack observed after heavy rain',
          suggestedCategory: 'Infrastructure',
          suggestedUrgency: 3,
          suggestedDescription: 'Pothole and road surface degradation'
        }
      },
      {
        fieldWorkerId: workerId,
        status: 'DRAFT',
        description: 'Partial draft of a new medical center request',
        category: 'Medical',
        urgency: 2,
        location: { type: 'Point', coordinates: [77.5846, 12.9616] },
        dataStack: { step1: "Completed", notes: "Needs assessment underway" }
      }
    ]);

    console.log('Successfully seeded surveys');

    // 3. Seed Tasks
    const dummyTasks = [
      {
        sourceSurveyId: surveys[0]._id,
        category: 'Sanitation',
        urgencyScore: 5,
        description: 'Major drainage overflow near market area',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        status: 'OPEN'
      },
      {
        category: 'Medical',
        urgencyScore: 4,
        description: 'Need for urgent medical supplies at community center',
        location: { type: 'Point', coordinates: [77.5996, 12.9756] },
        status: 'OPEN'
      }
    ];

    await Task.insertMany(dummyTasks);
    console.log('Successfully seeded tasks');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
