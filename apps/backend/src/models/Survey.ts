import mongoose, { Schema, Document } from 'mongoose';

export interface ISurvey extends Document {
  fieldWorkerId: mongoose.Types.ObjectId;
  rawImageUrl: string;
  status: 'PENDING_AI' | 'PENDING_HUMAN' | 'PROCESSED' | 'REJECTED';
  aiExtractedData: {
    rawText?: string;
    suggestedCategory?: string;
    suggestedUrgency?: number;
    suggestedDescription?: string;
  };
  createdAt: Date;
}

const SurveySchema: Schema = new Schema({
  fieldWorkerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rawImageUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING_AI', 'PENDING_HUMAN', 'PROCESSED', 'REJECTED'], 
    default: 'PENDING_AI' 
  },
  aiExtractedData: {
    rawText: String,
    suggestedCategory: String,
    suggestedUrgency: Number,
    suggestedDescription: String
  }
}, { timestamps: true });

export default mongoose.model<ISurvey>('Survey', SurveySchema);
