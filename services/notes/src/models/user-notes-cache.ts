import mongoose, { Document, Model, Schema } from "mongoose";

export interface CachedNote {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotesCacheDocument extends Document {
  userId: string;
  notes: CachedNote[];
  updatedAt: Date;
}

const CachedNoteSchema: Schema<CachedNote> = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    ownerId: { type: String, required: true },
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


