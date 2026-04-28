import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  sourceSurveyId: mongoose.Types.ObjectId;
  category: string;
  urgencyScore: number;
  description: string;
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  ngoId: mongoose.Types.ObjectId;
  status: 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'VERIFIED';
  assignedVolunteerId?: mongoose.Types.ObjectId;
  imageUrls?: string[];
  proofData?: {
    imageUrl: string;
    coordinates: number[];
    timestamp: Date;
  };
  createdAt: Date;
}

const TaskSchema: Schema = new Schema({
  sourceSurveyId: { type: Schema.Types.ObjectId, ref: 'Survey' },
  category: { type: String, required: true },
  urgencyScore: { type: Number, min: 1, max: 5, required: true },
  description: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
  status: { 
    type: String, 
    enum: ['OPEN', 'ASSIGNED', 'COMPLETED', 'VERIFIED'], 
    default: 'OPEN' 
  },
  assignedVolunteerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  imageUrls: [{ type: String }],
  proofData: {
    imageUrl: String,
    coordinates: [Number],
    timestamp: Date
  }
}, { timestamps: true });

TaskSchema.index({ location: '2dsphere' });

export default mongoose.model<ITask>('Task', TaskSchema);
