import mongoose, { Schema, Document } from 'mongoose';

export interface ISurvey extends Document {
  fieldWorkerId: mongoose.Types.ObjectId;
  rawImageUrl?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  description?: string;
  category?: string;
  urgency?: number;
  location?: {
    type: 'Point';
    coordinates: number[];
  };
  ngoId?: mongoose.Types.ObjectId;
  dataStack?: any;
  extractedEntries?: Array<{
    category: string;
    urgency: number;
    latitude?: string;
    longitude?: string;
    description: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }>;
  createdAt: Date;
}

const SurveySchema: Schema = new Schema({
  fieldWorkerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rawImageUrl: { type: String },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'], 
    default: 'DRAFT' 
  },
  description: String,
  category: String,
  urgency: Number,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }
  },
  extractedEntries: [{
    category: String,
    urgency: Number,
    latitude: String,
    longitude: String,
    description: String,
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' }
  }],
  ngoId: { type: Schema.Types.ObjectId, ref: 'NGO' },
  dataStack: { type: Schema.Types.Mixed, default: {} },
  aiExtractedData: {
    rawText: String,
    suggestedCategory: String,
    suggestedUrgency: Number,
    suggestedDescription: String
  }
}, { timestamps: true });

export default mongoose.model<ISurvey>('Survey', SurveySchema);
