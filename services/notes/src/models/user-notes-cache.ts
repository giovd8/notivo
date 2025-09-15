import mongoose, { Document, Model, Schema } from "mongoose";

export interface CachedSharedUser {
  id: string;
  username: string;
  createdAt: Date;
}

export interface CachedTag {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CachedNote {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  tags: CachedTag[];
  sharedWith: CachedSharedUser[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotesCacheDocument extends Document {
  userId: string;
  notes: CachedNote[];
  updatedAt: Date;
}

const CachedSharedUserSchema: Schema<CachedSharedUser> = new Schema(
  {
    id: { type: String, required: true },
    username: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const CachedTagSchema: Schema<CachedTag> = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const CachedNoteSchema: Schema<CachedNote> = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    ownerId: { type: String, required: true },
    tags: { type: [CachedTagSchema], required: true, default: [] },
    sharedWith: { type: [CachedSharedUserSchema], required: true, default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false }
);

const UserNotesCacheSchema: Schema<UserNotesCacheDocument> = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    notes: { type: [CachedNoteSchema], required: true, default: [] },
    updatedAt: { type: Date, required: true, default: () => new Date() },
  },
  { collection: "user_notes_cache" }
);

UserNotesCacheSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const UserNotesCacheModel: Model<UserNotesCacheDocument> =
  mongoose.models.UserNotesCache ||
  mongoose.model<UserNotesCacheDocument>("UserNotesCache", UserNotesCacheSchema);

export default UserNotesCacheModel;


