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
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
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
  impactScore: { type: Number, default: 0 }
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });

export default mongoose.model<IUser>('User', UserSchema);
