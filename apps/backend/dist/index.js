"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const surveyRoutes_1 = __importDefault(require("./routes/surveyRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const workerRoutes_1 = __importDefault(require("./routes/workerRoutes"));
const ngoRoutes_1 = __importDefault(require("./routes/ngoRoutes"));
const volunteerRoutes_1 = __importDefault(require("./routes/volunteerRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Adjust for production
    },
});
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Attach io to request for use in controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their notification room`);
    });
    socket.on('volunteer_location_update', async (data) => {
        try {
            const { userId, coordinates, isOnDuty } = data;
            const User = mongoose_1.default.model('User');
            await User.findByIdAndUpdate(userId, {
                isOnDuty,
                lastLocation: {
                    type: 'Point',
                    coordinates
                }
            });
            console.log(`Updated location for volunteer ${userId}. On Duty: ${isOnDuty}`);
        }
        catch (error) {
            console.error('Error updating volunteer location via socket:', error);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/surveys', surveyRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/worker', workerRoutes_1.default);
app.use('/api/ngo', ngoRoutes_1.default);
app.use('/api/volunteer', volunteerRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'NexusImpact Backend API is running' });
});
const startServer = async () => {
    try {
        if (process.env.MONGODB_URI) {
            await mongoose_1.default.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');
        }
        else {
            console.warn('MONGODB_URI not found in .env, running without DB');
        }
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};
startServer();
