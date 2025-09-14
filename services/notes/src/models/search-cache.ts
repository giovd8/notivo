import mongoose, { Document, Model, Schema } from "mongoose";
import { CachedNote } from "./user-notes-cache";

export interface UserSearchFilter {
  text: string;
  tags: string[];
}

export interface UserSearchCacheDocument extends Document {
  userId: string;
  key: string; // normalized key built from filter
  filter: UserSearchFilter;
  results: CachedNote[];
  lastUpdated: Date; // used for TTL (24h)
}

const UserSearchCacheSchema: Schema<UserSearchCacheDocument> = new Schema(
  {
    userId: { type: String, required: true, index: true },
    key: { type: String, required: true, index: true },
    filter: {
      type: new Schema<UserSearchFilter>(
        {
          text: { type: String, required: true, default: "" },
          tags: { type: [String], required: true, default: [] },
        },
        { _id: false }
      ),
      required: true,
    },
    results: { type: [Object], required: true, default: [] },
    lastUpdated: { type: Date, required: true, default: () => new Date() },
  },
  { collection: "user_search_cache" }
);

// Unique per user and query key
UserSearchCacheSchema.index({ userId: 1, key: 1 }, { unique: true });
// TTL index: delete documents not used in the last 24 hours
UserSearchCacheSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 86400 });

UserSearchCacheSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

const UserSearchCacheModel: Model<UserSearchCacheDocument> =
  mongoose.models.UserSearchCache ||
  mongoose.model<UserSearchCacheDocument>("UserSearchCache", UserSearchCacheSchema);

export default UserSearchCacheModel;


