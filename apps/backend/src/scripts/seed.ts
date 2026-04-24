import mongoose from 'mongoose';
import Task from '../models/Task';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexusimpact';

const dummyTasks = [
  {
    category: 'Sanitation',
    urgencyScore: 5,
    description: 'Major drainage overflow near market area',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore
    status: 'OPEN'
  },
  {
    category: 'Medical',
    urgencyScore: 4,
    description: 'Need for urgent medical supplies at community center',
    location: { type: 'Point', coordinates: [77.5996, 12.9756] },
    status: 'OPEN'
  },
  {
    category: 'Infrastructure',
    urgencyScore: 2,
    description: 'Broken streetlight on 5th main road',
    location: { type: 'Point', coordinates: [77.5846, 12.9616] },
    status: 'OPEN'
  },
  {
    category: 'Education',
    urgencyScore: 3,
    description: 'School roof needs repair before monsoon',
    location: { type: 'Point', coordinates: [77.6046, 12.9816] },
    status: 'OPEN'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
    
    await Task.deleteMany({});
    await Task.insertMany(dummyTasks);
    
    console.log('Successfully seeded dummy tasks!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
