import { Schema, model } from 'mongoose';
import { IUser } from './user.interface';

const userSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret: any) {
    delete ret._id;
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
