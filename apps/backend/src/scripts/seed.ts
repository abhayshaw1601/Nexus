import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Task from '../models/Task';
import NGO from '../models/NGO';
import Survey from '../models/Survey';
import { hashPassword } from '../utils/auth';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus_impact';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    // 1. Clear Existing Data
    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({}),
      NGO.deleteMany({}),
      Survey.deleteMany({})
    ]);
    console.log('Database cleared.');

    const password = await hashPassword('password123');

    // 2. Create Admin Users (Approved)
    const admin1 = await new User({
      name: 'Alpha Admin',
      email: 'admin@alpha.org',
      password,
      role: 'NGO_ADMIN',
      status: 'approved'
    }).save();

    const admin2 = await new User({
      name: 'Beta Admin',
      email: 'admin@beta.org',
      password,
      role: 'NGO_ADMIN',
      status: 'approved'
    }).save();

    // 3. Create NGOs (Linked to Admins)
    const ngo1 = await new NGO({
      name: 'Global Response Alpha',
      description: 'Rapid humanitarian response and medical aid.',
      joinCode: 'ALPHA1',
      adminId: admin1._id,
      contactEmail: 'admin@alpha.org',
      website: 'https://alpha.org',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore
      verified: true
    }).save();

    const ngo2 = await new NGO({
      name: 'Civic Support Beta',
      description: 'Community-led disaster relief and infrastructure support.',
      joinCode: 'BETA02',
      adminId: admin2._id,
      contactEmail: 'info@beta-civic.org',
      website: 'https://beta-civic.org',
      location: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
      verified: true
    }).save();

    // 4. Update Admins with their NGO IDs
    await User.findByIdAndUpdate(admin1._id, { ngoId: ngo1._id });
    await User.findByIdAndUpdate(admin2._id, { ngoId: ngo2._id });

    // 5. Create Supporting Users (Linked to NGOs, Status Pending for testing)
    const worker1 = await new User({
      name: 'Alpha Field Agent',
      email: 'worker@alpha.org',
      password,
      role: 'FIELD_WORKER',
      ngoId: ngo1._id,
      status: 'pending'
    }).save();

    const volunteer2 = await new User({
      name: 'Beta Volunteer',
      email: 'volunteer@beta.org',
      password,
      role: 'VOLUNTEER',
      ngoId: ngo2._id,
      status: 'pending'
    }).save();

    console.log('Users and NGOs created successfully.');

    // 6. Create Tasks (Scoped to NGOs) - Urgency 1 to 5
    await Task.create([
      {
        description: 'Medical supply shortage in Sector 4',
        category: 'Medical',
        urgencyScore: 5,
        status: 'OPEN',
        ngoId: ngo1._id,
        location: { type: 'Point', coordinates: [77.6000, 12.9800] }
      },
      {
        description: 'Water contamination report near Alpha HQ',
        category: 'Water',
        urgencyScore: 3,
        status: 'OPEN',
        ngoId: ngo1._id,
        location: { type: 'Point', coordinates: [77.5900, 12.9600] }
      },
      {
        description: 'Debris removal needed on Main St',
        category: 'Infrastructure',
        urgencyScore: 2,
        status: 'OPEN',
        ngoId: ngo2._id,
        location: { type: 'Point', coordinates: [72.8800, 19.0800] }
      }
    ]);

    // 7. Create Surveys
    await Survey.create([
      {
        description: 'Handwritten survey: Power outage in Block B',
        category: 'Power',
        urgency: 3,
        status: 'SUBMITTED',
        fieldWorkerId: worker1._id,
        ngoId: ngo1._id,
        location: { type: 'Point', coordinates: [77.6100, 12.9900] }
      }
    ]);

    console.log('Tasks and Surveys seeded successfully.');
    console.log('\n--- MULTI-NGO SEED COMPLETE ---');
    console.log('NGO Alpha: Join Code [ALPHA1] | Admin: admin@alpha.org');
    console.log('NGO Beta:  Join Code [BETA02] | Admin: admin@beta.org');
    console.log('Common Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
}

seed();
