import mongoose, { Schema, Document } from 'mongoose';

export interface INGO extends Document {
  name: string;
  description: string;
  joinCode: string; // Unique ID for volunteers/workers to join
  adminId: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  contactEmail: string;
  website?: string;
  verified: boolean;
}

const NGOSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  joinCode: { type: String, required: true, unique: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  contactEmail: { type: String, required: true },
  website: { type: String },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

NGOSchema.index({ location: '2dsphere' });
export default mongoose.model<INGO>('NGO', NGOSchema);
