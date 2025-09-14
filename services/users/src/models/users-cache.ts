import mongoose, { Document, Model, Schema } from "mongoose";

export interface CachedUser {
  id: string;
  username: string;
  createdAt: Date;
}

export interface UsersCacheDocument extends Document {
  userId: string;
  others: CachedUser[];
  updatedAt: Date;
}

const CachedUserSchema: Schema<CachedUser> = new Schema(
  {
    id: { type: String, required: true },
    username: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const UsersCacheSchema: Schema<UsersCacheDocument> = new Schema(
  {
    userId: { type: String, required: true, index: true, unique: true },
    others: { type: [CachedUserSchema], required: true, default: [] },
    updatedAt: { type: Date, default: () => new Date(), required: true },
  },
  { collection: "users_cache" }
);

UsersCacheSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const UsersCacheModel: Model<UsersCacheDocument> = mongoose.models.UsersCache ||
  mongoose.model<UsersCacheDocument>("UsersCache", UsersCacheSchema);

export default UsersCacheModel;


