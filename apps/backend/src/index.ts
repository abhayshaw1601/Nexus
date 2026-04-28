import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes';
import surveyRoutes from './routes/surveyRoutes';
import taskRoutes from './routes/taskRoutes';
import userRoutes from './routes/userRoutes';
import workerRoutes from './routes/workerRoutes';
import ngoRoutes from './routes/ngoRoutes';
import volunteerRoutes from './routes/volunteerRoutes';
import adminRoutes from './routes/adminRoutes';
import completionReportRoutes from './routes/completionReportRoutes';

import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
  },
});

const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Attach io to request for use in controllers
app.use((req, res, next) => {
  (req as any).io = io;
  next();
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room`);
  });

  socket.on('volunteer_location_update', async (data: { userId: string; coordinates: [number, number], isOnDuty: boolean }) => {
    try {
      const { userId, coordinates, isOnDuty } = data;
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(userId, {
        isOnDuty,
        lastLocation: {
          type: 'Point',
          coordinates
        }
      });
      console.log(`Updated location for volunteer ${userId}. On Duty: ${isOnDuty}`);
    } catch (error) {
      console.error('Error updating volunteer location via socket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/completion-reports', completionReportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'NexusImpact Backend API is running' });
});

const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    } else {
      console.warn('MONGODB_URI not found in .env, running without DB');
    }
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
