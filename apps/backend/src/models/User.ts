import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'NGO_ADMIN' | 'FIELD_WORKER' | 'VOLUNTEER';
  skills: string[];
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  isVerified: boolean;
  impactScore: number;
  status: 'incomplete' | 'pending' | 'approved' | 'rejected';
  specialization?: string;
  idProofUrl?: string;
  experienceBio?: string;
  isOnDuty: boolean;
  ngoId?: mongoose.Types.ObjectId;
  lastLocation?: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  ngoId: { type: Schema.Types.ObjectId, ref: 'NGO' },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'NGO_ADMIN', 'FIELD_WORKER', 'VOLUNTEER'], 
    default: 'VOLUNTEER' 
  },
  skills: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  isVerified: { type: Boolean, default: false },
  impactScore: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['incomplete', 'pending', 'approved', 'rejected'], 
    default: 'incomplete' 
  },
  specialization: { type: String },
  idProofUrl: { type: String },
  experienceBio: { type: String },
  isOnDuty: { type: Boolean, default: false },
  lastLocation: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  }
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });
UserSchema.index({ lastLocation: '2dsphere' });

export default mongoose.model<IUser>('User', UserSchema);
