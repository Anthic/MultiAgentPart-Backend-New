import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../../../config';
import { IAuthUserDocument } from './auth.interface';

const authUserSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    refreshToken: { type: String, select: false, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    passwordHistory: { type: [String], select: false, default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

authUserSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret: any) {
    delete ret._id;
    return ret;
  },
});

// Password hashing middleware
authUserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this;
  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds),
  );
});

//instance methods
authUserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

authUserSchema.methods.incrementLoginAttempts =
  async function (): Promise<void> {
    //if lock expire , reset attempts
    if (this.lockUntil && this.lockUntil < new Date()) {
      await this.updateOne({
        $set: { loginAttempts: 1 },
        $unset: { lockUntil: 1 },
      });
      return;
    }
    const update: any = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= config.account_lock.max_attempts) {
      update.$set = {
        lockUntil: new Date(Date.now() + config.account_lock.duration_ms),
      };
    }
    await this.updateOne(update);
  };

authUserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};
export const AuthUser = model<IAuthUserDocument>('AuthUser', authUserSchema);
