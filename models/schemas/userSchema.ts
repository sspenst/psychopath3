import bcrypt from 'bcryptjs';
import { ObjectId } from 'bson';
import mongoose from 'mongoose';
import Role from '../../constants/role';
import User from '../db/user';
import { LevelModel, UserModel } from '../mongoose';

export const USER_DEFAULT_PROJECTION = {
  _id: 1,
  avatarUpdatedAt: 1,
  hideStatus: 1,
  last_visited_at: 1,
  name: 1,
};

const UserSchema = new mongoose.Schema<User>({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  avatarUpdatedAt: {
    type: Number,
  },
  bio: {
    type: String,
    required: false,
    // restrict length to 256 characters
    maxlength: 256,
    select: false
  },
  calc_levels_created_count: {
    type: Number,
    default: 0,
  },
  calc_records: {
    type: Number,
    default: 0,
  },
  chapterUnlocked: {
    type: Number,
    default: 1,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    select: false,
    minlength: 3,
    maxlength: 50,
    validate: {
      validator: (v: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      }
    }
  },
  hideStatus: {
    type: Boolean,
  },
  last_visited_at: {
    type: Number,
  },
  ip_addresses_used: {
    type: [String],
    select: false,
  },
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
    validate: {
      validator: (v: string) => {
        return /^[-a-zA-Z0-9_]+$/.test(v);
      }
    }
  },
  password: {
    type: String,
    select: false,
    required: true,
  },
  roles: {
    type: [String],
    enum: Role,
    default: [],
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  ts: {
    type: Number,
  },
}, {
  collation: {
    locale: 'en_US',
    strength: 2,
  },
});

UserSchema.index({ score: -1 });
UserSchema.index({ name: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ calc_records: -1 });

const saltRounds = 10;

UserSchema.pre('save', function(next) {
  // Check if document is new or a new password has been set
  if (this.isNew || this.isModified('password')) {
    // Saving reference to this because of changing scopes
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const document = this;

    bcrypt.hash(document.password as string, saltRounds,
      function(err, hashedPassword) {
        /* istanbul ignore if */
        if (err) {
          next(err);
        } else {
          document.password = hashedPassword;
          next();
        }
      }
    );
  } else {
    next();
  }
});

export async function calcCreatorCounts(userId: ObjectId, session?: mongoose.ClientSession) {
  const levelsCreatedCountAgg = await LevelModel.aggregate([
    { $match: { isDeleted: { $ne: true }, isDraft: false, userId: userId } },
    { $count: 'count' },
  ], { session: session });
  const levelsCreatedCount = levelsCreatedCountAgg.length > 0 ? levelsCreatedCountAgg[0].count : 0;

  await UserModel.updateOne({ _id: userId }, {
    calc_levels_created_count: levelsCreatedCount,
  }, { session: session });
}

export default UserSchema;
