import mongoose, { Schema, Document } from 'mongoose';

export interface ICompletionReport extends Document {
  taskId: mongoose.Types.ObjectId;
  volunteerId: mongoose.Types.ObjectId;
  ngoId: mongoose.Types.ObjectId;
  title: string;
  category: string;
  urgencyScore: number;
  affectedPeople?: number;
  description: string;
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  proofImageUrl?: string;
  proofImageUrls?: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  aiExtractedData?: {
    rawText?: string;
    suggestedCategory?: string;
    suggestedUrgency?: number;
    suggestedDescription?: string;
  };
  createdAt: Date;
}

const CompletionReportSchema: Schema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  volunteerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  urgencyScore: { type: Number, min: 1, max: 5, default: 1 },
  affectedPeople: { type: Number, default: 0 },
  description: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  proofImageUrl: { type: String },
  proofImageUrls: [{ type: String }],
  status: { 
    type: String, 
    enum: ['PENDING', 'VERIFIED', 'REJECTED'], 
    default: 'PENDING' 
  },
  aiExtractedData: {
    rawText: String,
    suggestedCategory: String,
    suggestedUrgency: Number,
    suggestedDescription: String
  }
}, { timestamps: true });

CompletionReportSchema.index({ location: '2dsphere' });

export default mongoose.model<ICompletionReport>('CompletionReport', CompletionReportSchema);
